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

function summarizeTask(task) {
  if (!task) {
    return null;
  }

  return {
    id: task.id,
    title: task.title || task.id,
    type: task.type || 'OTHER',
    phase: task.phase || 0,
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
    activePhase === null || activePhase === undefined || (task.phase || 0) === activePhase
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
      .filter((task) => activePhase !== null && activePhase !== undefined && (task.phase || 0) !== activePhase)
      .map(summarizeTask)
  };
}

function selectNextTask(manifest, queues) {
  const currentTaskId = manifest.currentTaskId;

  if (currentTaskId) {
    const currentTask = (manifest.tasks || []).find((task) => task.id === currentTaskId);
    if (currentTask && (currentTask.status || 'pending') === 'pending') {
      return currentTask;
    }
  }

  const nextReady = queues.readyTasks[0];
  if (!nextReady) {
    return null;
  }

  return (manifest.tasks || []).find((task) => task.id === nextReady.id) || null;
}

function deriveWorkflowNextAction({ progress, nextTask, report, reportPath }) {
  if (nextTask) {
    return {
      skill: 'cc-do',
      action: 'execute-current-task',
      taskId: nextTask.id,
      reason: 'a dependency-ready task is still pending'
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
  const queryCommand = [
    'cc-devflow query workflow-context',
    `--change ${changeId}`,
    options.changeKey ? `--change-key ${change.changeKey}` : '',
    '--cwd <repo-root>'
  ].filter(Boolean).join(' ');
  const defaultRead = dedupe([
    relativeContractPath,
    relativeManifestPath,
    relativeChangeMetaPath,
    ...normalizeTaskReadFiles(nextTask?.context?.readFiles || [], {
      repoRoot,
      relativeDesignPath,
      relativeAnalysisPath,
      relativeTasksPath,
      relativeManifestPath,
      relativeChangeMetaPath,
      relativeStatePath,
      relativeReportPath
    })
  ]);
  const taskCommands = dedupe([
    ...(nextTask?.context?.commands || []),
    ...(nextTask?.verification || [])
  ]);
  const nextAction = deriveWorkflowNextAction({ progress, nextTask, report, reportPath });

  return {
    changeId: manifest.changeId || changeId,
    changeKey: change.changeKey,
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
    currentTask: summarizeTask(nextTask),
    queues,
    progressiveDisclosure: {
      mode: 'compact-first',
      rule: 'Read defaultRead first. Open deep sections only when the matching trigger below is true.',
      contextBudget: {
        defaultFiles: defaultRead.length,
        defaultCommands: taskCommands.length,
        deepOpeners: 5
      },
      defaultRead,
      commandsToTrust: taskCommands.length > 0 ? taskCommands : [queryCommand],
      openWhen: [
        {
          trigger: 'the current task, dependency state, or active phase is unclear',
          open: dedupe([relativeTasksPath, relativeManifestPath]),
          command: queryCommand
        },
        {
          trigger: 'scope, design, root cause, or do-not-redecide contract is disputed',
          open: dedupe([relativeContractPath, relativeTasksPath, relativeChangeMetaPath])
        },
        {
          trigger: 'parallel dispatch, touched-path ownership, or task slicing is disputed',
          open: dedupe([relativeTasksPath, relativeManifestPath]),
          command: `bash .claude/skills/cc-do/scripts/select-ready-tasks.sh --manifest ${relativeManifestPath}`
        },
        {
          trigger: 'task evidence, review gates, or recovery state is needed',
          open: dedupe([relativeCheckpointPath, relativeReportPath, relativeManifestPath])
        },
        {
          trigger: 'all tasks are complete and delivery can start',
          open: dedupe([relativeReportPath, 'devflow/changes/<change-key>/handoff/']),
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
