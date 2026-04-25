/**
 * [INPUT]: 依赖 store 的路径与文件读写能力，依赖 change-state/task-manifest/report-card/checkpoint 作为 durable truth。
 * [OUTPUT]: 对外提供 handoff 级工件生成与 legacy artifact 清理能力。
 * [POS]: skill runtime 的薄 handoff 层，只保留终态交付文件，不再投影中间态 Markdown。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  exists,
  readJson,
  writeText,
  removePath,
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath,
  getCheckpointPath,
  getReleaseNotePath
} = require('./store');
const {
  deriveLifecycleStage,
  summarizeTaskStates,
  getApprovalState,
  deriveLifecycleNextAction,
  isTaskSettledStatus
} = require('./lifecycle');
const {
  getChangePaths
} = require('./paths');
const {
  getIntentResumeIndexPath,
  getIntentPrBriefPath,
  getIntentHandoffArtifactPaths,
  getLegacyIntentProjectionPaths,
  ensureIntentScaffold
} = require('./artifacts');

function formatList(items, empty = '- None') {
  if (!items || items.length === 0) {
    return empty;
  }

  return items.map((item) => `- ${item}`).join('\n');
}

function truncateLine(value, max = 120) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 3).trimEnd()}...`;
}

function suggestPrTitle(changeId, goal) {
  const prefix = changeId.startsWith('FIX-') ? 'fix' : 'feat';
  return `${prefix}(${changeId.toLowerCase()}): ${truncateLine(goal || changeId, 72)}`;
}

function summarizeGateSection(gates = []) {
  if (!gates.length) {
    return ['- None'];
  }

  return gates.map((gate) => {
    const duration = typeof gate.durationMs === 'number' ? `${gate.durationMs}ms` : 'n/a';
    return `- ${gate.name}: ${gate.status} (${duration}) via \`${gate.command}\``;
  });
}

async function readLatestCheckpoints(repoRoot, changeId, tasks = []) {
  const checkpoints = [];

  for (const task of tasks) {
    const checkpoint = await readJson(getCheckpointPath(repoRoot, changeId, task.id), null);
    if (!checkpoint) {
      continue;
    }

    checkpoints.push({
      taskId: task.id,
      title: task.title,
      status: checkpoint.status,
      timestamp: checkpoint.timestamp,
      summary: checkpoint.summary
    });
  }

  checkpoints.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  return checkpoints;
}

async function cleanupLegacyArtifacts(repoRoot, changeId, manifest) {
  const taskIds = (manifest?.tasks || []).map((task) => task.id);
  const change = getChangePaths(repoRoot, changeId);

  await Promise.all(
    getLegacyIntentProjectionPaths(repoRoot, changeId, taskIds).map((target) => removePath(target))
  );
  await removePath(change.workersDir);
}

async function clearHandoffArtifacts(repoRoot, changeId, keep = null) {
  await Promise.all(
    getIntentHandoffArtifactPaths(repoRoot, changeId)
      .filter((target) => target !== keep)
      .map((target) => removePath(target))
  );
}

async function writeResumeIndex(repoRoot, changeId, state, manifest, report) {
  await ensureIntentScaffold(repoRoot, changeId);

  const checkpoints = await readLatestCheckpoints(repoRoot, changeId, manifest?.tasks || []);
  const lastGoodCheckpoint = checkpoints.find((checkpoint) => checkpoint.status === 'passed') || checkpoints[0] || null;
  const blockers = [
    ...(manifest?.tasks || [])
      .filter((task) => task.status === 'failed')
      .map((task) => `${task.id}: ${task.lastError || 'Task failed'}`),
    ...(report?.blockingFindings || [])
  ];
  const hasPrBrief = await exists(getIntentPrBriefPath(repoRoot, changeId));
  const hasReleaseNote = await exists(getReleaseNotePath(repoRoot, changeId));
  const stage = deriveLifecycleStage({ state, manifest, report, hasPrBrief });
  const approval = getApprovalState(state, manifest);
  const goal = manifest?.goal || state?.goal || changeId;
  const nextAction = deriveLifecycleNextAction({
    state,
    manifest,
    report,
    hasPrBrief,
    hasReleaseNote
  });
  const resumePath = getIntentResumeIndexPath(repoRoot, changeId);

  const content = [
    `# Resume Index: ${changeId}`,
    '',
    `- Goal: ${goal}`,
    `- Stage: \`${stage}\``,
    `- Lifecycle: \`${state?.status || 'unknown'}\``,
    `- Approval: \`${approval.status}\``,
    `- Execution Mode: \`${approval.executionMode}\``,
    `- Plan Version: ${manifest?.metadata?.planVersion || 1}`,
    `- Updated At: ${nowIso()}`,
    '',
    '## Last Good Checkpoint',
    '',
    lastGoodCheckpoint
      ? `- \`${lastGoodCheckpoint.taskId}\` ${lastGoodCheckpoint.status} @ ${lastGoodCheckpoint.timestamp} - ${lastGoodCheckpoint.summary}`
      : '- No checkpoint yet',
    '',
    '## Blockers',
    '',
    formatList(blockers, '- None'),
    '',
    '## Next Action',
    '',
    nextAction,
    '',
    '## Durable Truth',
    '',
    formatList([
      `\`devflow/changes/<change>/meta/change-state.json\``,
      `\`devflow/changes/<change>/planning/task-manifest.json\``,
      `\`devflow/changes/<change>/review/report-card.json\``
    ])
  ].join('\n');

  await clearHandoffArtifacts(repoRoot, changeId, resumePath);
  await writeText(resumePath, `${content}\n`);

  return {
    goalId: changeId,
    resumePath
  };
}

async function syncIntentPrBrief(repoRoot, changeId) {
  await ensureIntentScaffold(repoRoot, changeId);

  const [state, manifest, report] = await Promise.all([
    readJson(getRuntimeStatePath(repoRoot, changeId), null),
    readJson(getTaskManifestPath(repoRoot, changeId), null),
    readJson(getReportCardPath(repoRoot, changeId), null)
  ]);

  if (!manifest) {
    throw new Error(`Cannot prepare PR brief for ${changeId}: task-manifest.json is missing`);
  }

  if (!report) {
    throw new Error(`Cannot prepare PR brief for ${changeId}: report-card.json is missing`);
  }

  if (report.overall !== 'pass') {
    throw new Error(`Cannot prepare PR brief for ${changeId}: verification has not passed`);
  }

  await cleanupLegacyArtifacts(repoRoot, changeId, manifest);

  const goal = manifest.goal || state?.goal || changeId;
  const summary = summarizeTaskStates(manifest.tasks || []);
  const touchedFiles = [...new Set((manifest.tasks || []).flatMap((task) => task.touches || []))];
  const skippedTasks = (manifest.tasks || []).filter((task) => task.status === 'skipped');
  const checkpointRefs = (manifest.tasks || [])
    .filter((task) => isTaskSettledStatus(task.status))
    .map((task) => `\`${task.id}\` ${task.title} -> \`devflow/changes/<change>/execution/tasks/${task.id}/checkpoint.json\``);

  const risks = [
    ...((report.review?.status === 'skipped' || report.review?.status === 'blocked')
      ? ['评审门未完全闭环，合并前需要补齐 review 证据。']
      : []),
    ...(skippedTasks.length > 0
      ? [`存在 ${skippedTasks.length} 个 skipped 任务，需要确认是否可接受：${skippedTasks.map((task) => task.id).join(', ')}`]
      : []),
    ...(summary.failed > 0
      ? [`manifest 中仍有 ${summary.failed} 个 failed 任务，PR 前需要重新确认状态一致性。`]
      : []),
    ...(report.blockingFindings || [])
  ];

  const content = [
    `# PR Brief: ${changeId}`,
    '',
    `- Suggested Title: ${suggestPrTitle(changeId, goal)}`,
    `- Goal: ${goal}`,
    `- Lifecycle: \`${state?.status || 'verified'}\``,
    `- Prepared At: ${nowIso()}`,
    '',
    '## Summary',
    '',
    formatList(
      (manifest.tasks || [])
        .filter((task) => task.status === 'passed')
        .map((task) => `\`${task.id}\` ${task.title}`),
      '- No passed tasks'
    ),
    '',
    '## Verification',
    '',
    `- Verdict: \`${report.verdict || (report.overall === 'pass' ? 'pass' : 'fail')}\``,
    `- Overall: \`${report.overall}\``,
    `- Review: \`${report.review?.status || 'skipped'}\``,
    `- Blocking Findings: ${(report.blockingFindings || []).length}`,
    '',
    '### Quick Gates',
    '',
    ...summarizeGateSection(report.quickGates),
    '',
    '### Strict Gates',
    '',
    ...summarizeGateSection(report.strictGates),
    '',
    '### Review Summary',
    '',
    report.review?.summary || '- None',
    '',
    '## Risks',
    '',
    formatList(risks, '- None captured by verify; remaining risk is merge timing and manual product acceptance.'),
    '',
    '## Rollback',
    '',
    formatList([
      '回滚该变更分支或最终提交栈，然后重新执行 cc-check 的验证命令。',
      touchedFiles.length > 0
        ? `优先检查这些触达文件：${touchedFiles.slice(0, 8).map((file) => `\`${file}\``).join(', ')}${touchedFiles.length > 8 ? ' ...' : ''}`
        : '当前 manifest 未记录触达文件，回滚时以最终 diff 为准。'
    ]),
    '',
    '## Key Artifacts',
    '',
    formatList([
      `\`devflow/changes/<change>/meta/change-state.json\``,
      `\`devflow/changes/<change>/planning/task-manifest.json\``,
      `\`devflow/changes/<change>/review/report-card.json\``,
      ...checkpointRefs
    ]),
    ''
  ].join('\n');

  const prBriefPath = getIntentPrBriefPath(repoRoot, changeId);
  await clearHandoffArtifacts(repoRoot, changeId, prBriefPath);
  await writeText(prBriefPath, `${content}\n`);

  return {
    goalId: changeId,
    prBriefPath,
    suggestedTitle: suggestPrTitle(changeId, goal)
  };
}

async function syncIntentMemory(repoRoot, changeId, options = {}) {
  await ensureIntentScaffold(repoRoot, changeId);

  const [state, manifest, report] = await Promise.all([
    readJson(getRuntimeStatePath(repoRoot, changeId), null),
    readJson(getTaskManifestPath(repoRoot, changeId), null),
    readJson(getReportCardPath(repoRoot, changeId), null)
  ]);

  await cleanupLegacyArtifacts(repoRoot, changeId, manifest);

  if (options.handoff === 'resume') {
    return writeResumeIndex(repoRoot, changeId, state, manifest, report);
  }

  const prBriefPath = getIntentPrBriefPath(repoRoot, changeId);
  const releaseNotePath = getReleaseNotePath(repoRoot, changeId);
  const hasPrBrief = await exists(prBriefPath);
  const hasReleaseNote = await exists(releaseNotePath);
  const stage = deriveLifecycleStage({ state, manifest, report, hasPrBrief });

  if (hasReleaseNote) {
    await clearHandoffArtifacts(repoRoot, changeId, releaseNotePath);
  } else if (hasPrBrief) {
    await clearHandoffArtifacts(repoRoot, changeId, prBriefPath);
  } else {
    await clearHandoffArtifacts(repoRoot, changeId, null);
  }

  return {
    goalId: changeId,
    stage,
    resumePath: hasPrBrief || hasReleaseNote ? null : getIntentResumeIndexPath(repoRoot, changeId)
  };
}

module.exports = {
  syncIntentPrBrief,
  syncIntentMemory
};
