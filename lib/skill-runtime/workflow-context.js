/**
 * [INPUT]: 依赖 task-manifest/report/change-meta/runtime-state 等已有 artifact，接收 repoRoot/changeId/changeKey。
 * [OUTPUT]: 生成 compact workflow context，告诉 PDCA/IDCA 下一步、默认读取集、可信命令与深层展开条件。
 * [POS]: skill runtime 的渐进式披露查询层，只读派生状态，不拥有 workflow 规则本身。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const path = require('path');

const {
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath,
  getTasksMarkdownPath,
  getCheckpointPath,
  exists,
  readJson
} = require('./store');
const { getIntentPrBriefPath } = require('./artifacts');
const { getChangePaths } = require('./paths');
const { deriveManifestExecutionState } = require('./planner');
const {
  getApprovalState,
  deriveLifecycleStage,
  deriveTaskProgress,
  isTaskCompletedStatus
} = require('./lifecycle');
const { namedError } = require('./errors');
const { deriveShipReadiness } = require('./readiness');
const {
  buildDefaultOpenRefs,
  buildMustNotForget,
  buildPacketOnly,
  buildSourceHashes,
  buildSourceIndex,
  dedupeOpenRefs,
  deepOpenGroup,
  openRef,
  withFragment
} = require('./context-index');

const RESUMABLE_TASK_STATUSES = new Set([
  'pending',
  'running',
  'in_progress',
  'active',
  'blocked',
  'needs_fix',
  'failed'
]);

async function readWorkflowArtifact(filePath, { required = true } = {}) {
  try {
    const value = await readJson(filePath, null);

    if (required && value === null) {
      throw namedError(
        'MissingQueryArtifactError',
        `Missing required query artifact: ${filePath}`,
        {
          artifactRefs: [filePath],
          rescueAction: 'create required runtime artifacts before running this query'
        }
      );
    }

    return value;
  } catch (error) {
    if (error.name === 'MissingQueryArtifactError') {
      throw error;
    }

    throw namedError(
      'InvalidQueryArtifactError',
      `Invalid query artifact ${filePath}: ${error.message}`,
      {
        artifactRefs: [filePath],
        rescueAction: 'repair or regenerate the invalid runtime artifact before running this query',
        details: {
          cause: error.name || 'Error'
        }
      }
    );
  }
}

function relativePath(repoRoot, filePath) {
  return path.relative(repoRoot, filePath) || filePath;
}

async function maybeRelativePath(repoRoot, filePath) {
  return (await exists(filePath)) ? relativePath(repoRoot, filePath) : null;
}

function dedupe(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function normalizeTaskReadFile(filePath, refs) {
  const value = String(filePath || '').trim().replace(/^\.\//, '');
  if (!value) {
    return null;
  }

  if (path.isAbsolute(value)) {
    return relativePath(refs.repoRoot, value);
  }

  const artifactAliases = new Map([
    ['design.md', refs.relativeDesignPath],
    ['analysis.md', refs.relativeAnalysisPath],
    ['tasks.md', refs.relativeTasksPath],
    ['task-manifest.json', refs.relativeManifestPath],
    ['change-meta.json', refs.relativeChangeMetaPath],
    ['report-card.json', refs.relativeReportPath],
    ['change-state.json', refs.relativeStatePath]
  ]);
  const normalizedDir = path.dirname(value).replace(/\\/g, '/');
  const basename = path.basename(value);

  if (normalizedDir === '.' && artifactAliases.has(value)) {
    return artifactAliases.get(value) || null;
  }

  if (normalizedDir === 'planning' && artifactAliases.has(basename)) {
    return artifactAliases.get(basename) || null;
  }

  if (normalizedDir === 'review' && basename === 'report-card.json') {
    return refs.relativeReportPath || null;
  }

  if (normalizedDir === 'meta' && basename === 'change-state.json') {
    return refs.relativeStatePath || null;
  }

  return value;
}

function normalizeTaskReadFiles(readFiles, refs) {
  return dedupe((readFiles || []).map((filePath) => normalizeTaskReadFile(filePath, refs)));
}

function isArtifactReadFile(filePath, refs) {
  return [
    refs.relativeDesignPath,
    refs.relativeAnalysisPath,
    refs.relativeTasksPath,
    refs.relativeManifestPath,
    refs.relativeChangeMetaPath,
    refs.relativeStatePath,
    refs.relativeReportPath
  ].filter(Boolean).includes(filePath);
}

function summarizeTask(task) {
  if (!task) {
    return null;
  }

  return {
    id: task.id,
    title: task.title || task.id,
    type: task.type || 'OTHER',
    phase: task.phase || 1,
    status: task.status || 'pending',
    tddPhase: task.tddPhase || null,
    dependsOn: task.dependsOn || [],
    parallel: Boolean(task.parallel),
    touches: task.touches || task.files || [],
    files: task.files || [],
    verification: task.verification || [],
    evidence: task.evidence || [],
    context: {
      readFiles: task.context?.readFiles || [],
      commands: task.context?.commands || [],
      notes: task.context?.notes || []
    }
  };
}

function deriveTaskQueues(manifest) {
  const tasks = manifest.tasks || [];
  const executionState = deriveManifestExecutionState(tasks);
  const activePhase = executionState.activePhase;
  const completedIds = new Set(
    tasks.filter((task) => isTaskCompletedStatus(task.status)).map((task) => task.id)
  );
  const unfinished = tasks.filter((task) => !isTaskCompletedStatus(task.status));

  function waitingOn(task) {
    return (task.dependsOn || []).filter((depId) => !completedIds.has(depId));
  }

  const activeTasks = unfinished.filter((task) => (
    activePhase === null || activePhase === undefined || (task.phase || 1) === activePhase
  ));

  return {
    activePhase,
    readyTasks: activeTasks
      .filter((task) => (task.status || 'pending') === 'pending' && waitingOn(task).length === 0)
      .map((task) => ({
        ...summarizeTask(task),
        waitingOn: []
      })),
    runningTasks: activeTasks
      .filter((task) => (task.status || 'pending') === 'running')
      .map(summarizeTask),
    blockedTasks: activeTasks
      .filter((task) => !['pending', 'running'].includes(task.status || 'pending') || waitingOn(task).length > 0)
      .map((task) => ({
        ...summarizeTask(task),
        waitingOn: waitingOn(task)
      })),
    deferredTasks: unfinished
      .filter((task) => activePhase !== null && activePhase !== undefined && (task.phase || 1) !== activePhase)
      .map(summarizeTask)
  };
}

function selectNextTask(manifest, queues) {
  const currentTaskId = manifest.currentTaskId;

  if (currentTaskId) {
    const currentTask = (manifest.tasks || []).find((task) => task.id === currentTaskId);
    if (currentTask && RESUMABLE_TASK_STATUSES.has(currentTask.status || 'pending')) {
      return currentTask;
    }
  }

  const nextReady = queues.readyTasks[0];
  if (!nextReady) {
    return null;
  }

  return (manifest.tasks || []).find((task) => task.id === nextReady.id) || null;
}

function deriveWorkflowNextAction({ progress, nextTask, report, reportPath, missingVerificationCommands }) {
  if (missingVerificationCommands) {
    return {
      skill: 'cc-plan',
      action: 'repair-task-verification',
      taskId: nextTask.id,
      reason: 'current task has no executable verification command',
      mustOpen: ['planning/task-manifest.json']
    };
  }

  if (nextTask) {
    const status = nextTask.status || 'pending';
    return {
      skill: 'cc-do',
      action: status === 'pending' ? 'execute-current-task' : 'resume-current-task',
      taskId: nextTask.id,
      reason: status === 'pending'
        ? 'a dependency-ready task is still pending'
        : `current task ${nextTask.id} is ${status} and should be resumed before selecting new work`
    };
  }

  if (progress.totalTasks > 0 && progress.completedTasks === progress.totalTasks) {
    const readiness = report ? deriveShipReadiness(report, { reportPath }) : null;
    if (readiness?.ready) {
      return {
        skill: 'cc-act',
        action: 'ship-or-handoff',
        reason: 'all tasks are complete and ship-readiness is ready'
      };
    }

    return {
      skill: 'cc-check',
      action: 'build-fresh-verdict',
      reason: report
        ? 'all tasks are complete but ship-readiness is blocked'
        : 'all tasks are complete but no report card exists',
      blockers: readiness?.blockers || ['missing report-card']
    };
  }

  return {
    skill: 'cc-plan',
    action: 'repair-task-graph',
    reason: 'no ready task can be selected from the current manifest'
  };
}

function getWorkflowContextArtifactRefs(repoRoot, changeId, options = {}) {
  const change = getChangePaths(repoRoot, changeId, options);
  return [
    path.join(change.planningDir, 'design.md'),
    path.join(change.planningDir, 'analysis.md'),
    getTasksMarkdownPath(repoRoot, changeId, options),
    getTaskManifestPath(repoRoot, changeId, options),
    path.join(change.changeDir, 'change-meta.json'),
    getRuntimeStatePath(repoRoot, changeId, options),
    getReportCardPath(repoRoot, changeId, options)
  ];
}

function getWorkflowContextRequiredArtifactRefs(repoRoot, changeId, options = {}) {
  return [
    getTaskManifestPath(repoRoot, changeId, options)
  ];
}

async function getWorkflowContext(repoRoot, changeId, options = {}) {
  const change = getChangePaths(repoRoot, changeId, options);
  const manifestPath = getTaskManifestPath(repoRoot, changeId, options);
  const reportPath = getReportCardPath(repoRoot, changeId, options);
  const statePath = getRuntimeStatePath(repoRoot, changeId, options);
  const tasksPath = getTasksMarkdownPath(repoRoot, changeId, options);
  const changeMetaPath = path.join(change.changeDir, 'change-meta.json');
  const designPath = path.join(change.planningDir, 'design.md');
  const analysisPath = path.join(change.planningDir, 'analysis.md');
  const preferredContractPaths = changeId.startsWith('FIX-')
    ? [analysisPath, designPath]
    : [designPath, analysisPath];
  const canonicalContractPath = (await Promise.all(
    preferredContractPaths.map(async (candidate) => ((await exists(candidate)) ? candidate : null))
  )).find(Boolean);

  const [manifest, report, state, changeMeta] = await Promise.all([
    readWorkflowArtifact(manifestPath),
    readWorkflowArtifact(reportPath, { required: false }),
    readWorkflowArtifact(statePath, { required: false }),
    readWorkflowArtifact(changeMetaPath, { required: false })
  ]);
  const progress = deriveTaskProgress(manifest.tasks || []);
  const queues = deriveTaskQueues(manifest);
  const nextTask = selectNextTask(manifest, queues);
  const checkpointPath = nextTask ? getCheckpointPath(repoRoot, changeId, nextTask.id, options) : null;
  const relativeContractPath = canonicalContractPath ? relativePath(repoRoot, canonicalContractPath) : null;
  const relativeDesignPath = await maybeRelativePath(repoRoot, designPath);
  const relativeAnalysisPath = await maybeRelativePath(repoRoot, analysisPath);
  const relativeManifestPath = relativePath(repoRoot, manifestPath);
  const relativeTasksPath = await maybeRelativePath(repoRoot, tasksPath);
  const relativeChangeMetaPath = await maybeRelativePath(repoRoot, changeMetaPath);
  const relativeStatePath = await maybeRelativePath(repoRoot, statePath);
  const relativeReportPath = await maybeRelativePath(repoRoot, reportPath);
  const relativeCheckpointPath = checkpointPath ? await maybeRelativePath(repoRoot, checkpointPath) : null;
  const refs = {
    repoRoot,
    relativeContractPath,
    relativeDesignPath,
    relativeAnalysisPath,
    relativeTasksPath,
    relativeManifestPath,
    relativeChangeMetaPath,
    relativeStatePath,
    relativeReportPath,
    relativeCheckpointPath
  };
  const queryCommand = [
    'cc-devflow query workflow-context',
    `--change ${changeId}`,
    options.changeKey ? `--change-key ${change.changeKey}` : '',
    '--cwd <repo-root>'
  ].filter(Boolean).join(' ');
  const taskReadFiles = normalizeTaskReadFiles(nextTask?.context?.readFiles || [], refs);
  const taskDeepOpen = taskReadFiles.filter((filePath) => !isArtifactReadFile(filePath, refs));
  const source = await buildSourceIndex({
    manifestPath,
    canonicalContractPath,
    tasksPath,
    changeMetaPath,
    reportPath,
    checkpointPath,
    refs
  });
  const defaultOpen = buildDefaultOpenRefs({ nextTask, refs, source });
  const taskCommands = dedupe([
    ...(nextTask?.context?.commands || []),
    ...(nextTask?.verification || [])
  ]);
  const missingVerificationCommands = Boolean(nextTask && taskCommands.length === 0);
  const currentTaskSummary = summarizeTask(nextTask);
  const mustNotForget = await buildMustNotForget({
    manifest,
    nextTask,
    report,
    source,
    refs,
    canonicalContractPath,
    missingVerificationCommands
  });
  const packetOnly = await buildPacketOnly({
    canonicalContractPath,
    manifest,
    currentTaskSummary,
    nextTask,
    report,
    mustNotForget
  });
  const deepOpen = [
    deepOpenGroup({
      when: 'scope_or_contract_uncertain',
      conditions: [
        'confidence.scope < 0.85',
        "task.type in ['ARCH', 'SECURITY', 'DATA_MIGRATION']",
        'user_request_changes_scope == true',
        'do_not_redecide_missing == true'
      ],
      refs: [
        { ref: relativeContractPath, reason: 'full contract for scope and do-not-redecide disputes' },
        { ref: withFragment(relativeContractPath, 'approved-direction'), reason: 'approved direction section' },
        { ref: relativeTasksPath, reason: 'task protocol and handoff context' },
        { ref: withFragment(relativeChangeMetaPath, '/risk'), reason: 'risk and spec sync context' }
      ].filter((entry) => entry.ref),
      source
    }),
    deepOpenGroup({
      when: 'task_or_dependency_uncertain',
      conditions: [
        'currentTask == null',
        'dependency_state_unclear == true',
        'active_phase_unclear == true'
      ],
      refs: [
        { ref: withFragment(relativeManifestPath, nextTask ? `/tasks/${nextTask.id}` : '/summary'), reason: 'task graph source of truth' },
        { ref: withFragment(relativeTasksPath, nextTask ? `task.${nextTask.id}` : 'execution-handoff'), reason: 'human task block and execution protocol' }
      ],
      source,
      command: queryCommand
    }),
    deepOpenGroup({
      when: 'parallel_or_touch_ownership_uncertain',
      conditions: [
        'task.touches.length > 3',
        'parallel_candidates.length > 1',
        'current_file_not_listed_in_task_files == true',
        'touch_paths_overlap == true'
      ],
      refs: [
        { ref: relativeTasksPath, reason: 'task ownership and slicing details' },
        { ref: relativeManifestPath, reason: 'machine task graph and touched files' }
      ],
      source,
      command: `bash .claude/skills/cc-do/scripts/select-ready-tasks.sh --manifest ${relativeManifestPath}`
    }),
    deepOpenGroup({
      when: 'verification_or_recovery_needed',
      conditions: [
        'verification_failed == true',
        'missingVerificationCommands == true',
        'report.reroute != none',
        'checkpoint_needed == true'
      ],
      refs: [
        { ref: relativeCheckpointPath, reason: 'current task recovery checkpoint' },
        { ref: relativeReportPath, reason: 'latest review gate verdict' },
        { ref: relativeManifestPath, reason: 'verification command source' }
      ].filter((entry) => entry.ref),
      source
    }),
    deepOpenGroup({
      when: 'implementation_details_needed',
      conditions: [
        'agent_needs_code_context == true',
        'current_file_not_listed_in_task_files == true'
      ],
      refs: taskDeepOpen.map((ref) => ({ ref, reason: 'selected task implementation context' })),
      source
    }),
    deepOpenGroup({
      when: 'delivery_or_ship_readiness_needed',
      conditions: [
        'progress.completedTasks == progress.totalTasks',
        'nextAction.skill == cc-act',
        'ship_mode_unclear == true'
      ],
      refs: [
        { ref: relativeReportPath, reason: 'ship-readiness verdict input' },
        { ref: 'devflow/changes/<change-key>/handoff/', reason: 'delivery handoff artifacts' }
      ],
      source,
      command: `cc-devflow query ship-readiness --change ${changeId}${options.changeKey ? ` --change-key ${change.changeKey}` : ''} --cwd <repo-root>`
    })
  ];
  const nextAction = deriveWorkflowNextAction({
    progress,
    nextTask,
    report,
    reportPath,
    missingVerificationCommands
  });
  const sourceHashes = buildSourceHashes(source);

  return {
    schemaVersion: 'workflow-context.v2',
    changeId: manifest.changeId || changeId,
    changeKey: change.changeKey,
    generatedAt: new Date().toISOString(),
    source,
    goal: manifest.goal || state?.goal || '',
    route: changeId.startsWith('FIX-') ? 'IDCA' : 'PDCA',
    lifecycle: {
      stage: state ? deriveLifecycleStage({
        state,
        manifest,
        report,
        hasPrBrief: await exists(getIntentPrBriefPath(repoRoot, changeId, options))
      }) : null,
      status: state?.status || null,
      approval: state ? getApprovalState(state, manifest) : null
    },
    progress,
    nextAction,
    currentTask: currentTaskSummary,
    queues,
    progressiveDisclosure: {
      mode: 'compact-first',
      rule: 'Use this as a context index: packetOnly routes, mustNotForget guards judgment, source artifacts decide disputed facts. If you need to guess, open the referenced source first.',
      contextBudget: {
        packetFields: Object.keys(packetOnly).length,
        defaultRefs: defaultOpen.length,
        defaultCommands: taskCommands.length,
        deepOpenGroups: deepOpen.length,
        deepOpeners: 6
      },
      packetOnly,
      mustNotForget,
      sourceHashes,
      stalenessCheck: {
        policy: 'if any source hash differs from sourceHashes, rerun workflow-context before acting',
        command: queryCommand
      },
      defaultOpen,
      deepOpen,
      commandsToTrust: taskCommands,
      missingVerificationCommands,
      manifestIssue: missingVerificationCommands
        ? 'current task has no executable verification command'
        : null,
      failClosed: [
        'If manifest, contract, change-meta, report-card, or checkpoint hash changed after packet generation, rerun workflow-context.',
        'If current task status is running, in_progress, active, blocked, needs_fix, or failed, resume it before selecting another ready task.',
        'If verification command is missing, route to cc-plan repair-task-verification instead of cc-do.',
        'If scope, ownership, dependency, or source confidence is uncertain, open the source artifact before acting.'
      ],
      uncertaintyPolicy: {
        mode: 'open-source-before-acting',
        openOn: [
          'scope uncertainty',
          'task ambiguity',
          'dependency ambiguity',
          'missing verification',
          'changed files outside manifest',
          'test failure',
          'user changes requirement',
          'security or data migration impact'
        ]
      },
      openWhen: [
        {
          trigger: 'the current task, dependency state, or active phase is unclear',
          conditions: [
            'currentTask == null',
            'dependency_state_unclear == true',
            'active_phase_unclear == true'
          ],
          open: dedupeOpenRefs([
            openRef(nextTask ? withFragment(relativeManifestPath, `/tasks/${nextTask.id}`) : withFragment(relativeManifestPath, '/summary'), 'task graph source of truth', source),
            openRef(withFragment(relativeTasksPath, nextTask ? `task.${nextTask.id}` : 'execution-handoff'), 'task block and execution handoff', source)
          ]),
          command: queryCommand
        },
        {
          trigger: 'scope, design, root cause, or do-not-redecide contract is disputed',
          conditions: [
            'confidence.scope < 0.85',
            'user_request_changes_scope == true',
            'do_not_redecide_missing == true'
          ],
          open: dedupeOpenRefs([
            openRef(relativeContractPath, 'full contract for scope and do-not-redecide disputes', source),
            openRef(relativeTasksPath, 'task protocol and handoff context', source),
            openRef(withFragment(relativeChangeMetaPath, '/risk'), 'risk and spec sync context', source)
          ])
        },
        {
          trigger: 'parallel dispatch, touched-path ownership, or task slicing is disputed',
          conditions: [
            'parallel_candidates.length > 1',
            'touch_paths_overlap == true',
            'current_file_not_listed_in_task_files == true'
          ],
          open: dedupeOpenRefs([
            openRef(relativeTasksPath, 'task ownership and slicing details', source),
            openRef(relativeManifestPath, 'machine task graph and touched files', source)
          ]),
          command: `bash .claude/skills/cc-do/scripts/select-ready-tasks.sh --manifest ${relativeManifestPath}`
        },
        {
          trigger: 'task evidence, review gates, or recovery state is needed',
          conditions: [
            'verification_failed == true',
            'report.reroute != none',
            'checkpoint_needed == true'
          ],
          open: dedupeOpenRefs([
            openRef(relativeCheckpointPath, 'current task recovery checkpoint', source),
            openRef(relativeReportPath, 'latest review gate verdict', source),
            openRef(relativeManifestPath, 'verification command source', source)
          ])
        },
        {
          trigger: 'implementation file details are needed for the selected task',
          conditions: [
            'agent_needs_code_context == true',
            'current_file_not_listed_in_task_files == true'
          ],
          open: dedupeOpenRefs(taskDeepOpen.map((ref) => openRef(ref, 'selected task implementation context', source)))
        },
        {
          trigger: 'all tasks are complete and delivery can start',
          conditions: [
            'progress.completedTasks == progress.totalTasks',
            'nextAction.skill == cc-act',
            'ship_mode_unclear == true'
          ],
          open: dedupeOpenRefs([
            openRef(relativeReportPath, 'ship-readiness verdict input', source),
            openRef('devflow/changes/<change-key>/handoff/', 'delivery handoff artifacts', source)
          ]),
          command: `cc-devflow query ship-readiness --change ${changeId}${options.changeKey ? ` --change-key ${change.changeKey}` : ''} --cwd <repo-root>`
        }
      ]
    },
    artifactRefs: dedupe([
      relativeContractPath,
      relativeTasksPath,
      relativeManifestPath,
      relativeChangeMetaPath,
      relativeReportPath,
      relativeCheckpointPath
    ]),
    planningMeta: {
      planVersion: manifest.metadata?.planVersion || null,
      reqPlanSkillVersion: manifest.planningMeta?.reqPlanSkillVersion || null,
      sourceCapability: changeMeta?.spec?.primaryCapability || null,
      specSyncStatus: changeMeta?.spec?.syncStatus || null
    }
  };
}

module.exports = {
  getWorkflowContext,
  getWorkflowContextArtifactRefs,
  getWorkflowContextRequiredArtifactRefs
};
