/**
 * [INPUT]: 依赖 store 的路径与文件读写能力，依赖 harness-state/task-manifest/report-card/checkpoint 作为事实源。
 * [OUTPUT]: 对外提供 intent Markdown 工件路径、approval/route 判定、checkpoint/Task Result/PR brief 写入与 summary/resume-index 同步能力。
 * [POS]: skill runtime 的语义记忆桥接层，把薄 runtime 状态投影为 agent 可读的 Markdown 记录系统。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  exists,
  readJson,
  readText,
  writeText,
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath,
  getCheckpointPath
} = require('./store');
const {
  deriveLifecycleStage,
  summarizeTaskStates,
  normalizeExecutionMode,
  getApprovalState,
  isExecutionApproved,
  classifyDelegationMode
} = require('./lifecycle');
const {
  getIntentSummaryPath,
  getIntentFactsPath,
  getIntentDecisionLogPath,
  getIntentPlanPath,
  getIntentDelegationMapPath,
  getIntentResumeIndexPath,
  getIntentCheckpointNotePath,
  getIntentTaskBriefPath,
  getIntentTaskResultPath,
  getIntentPrBriefPath,
  ensureIntentScaffold
} = require('./artifacts');

function formatList(items, empty = '- None') {
  if (!items || items.length === 0) {
    return empty;
  }

  return items.map((item) => `- ${item}`).join('\n');
}

function deriveNextAction({ changeId, state, manifest, report, hasPrBrief = false }) {
  if (!manifest) {
    return '生成或刷新 task-manifest，然后停在 cc-plan 的批准闸前。';
  }

  const approval = getApprovalState(state, manifest);
  if (approval.status !== 'approved') {
    return `先批准当前计划版本 ${approval.planVersion || 1}，再进入执行。回到 cc-plan 的批准闸，并把 execution mode 设为 ${approval.executionMode}。`;
  }

  const failedTasks = manifest.tasks.filter((task) => task.status === 'failed');
  if (failedTasks.length > 0) {
    return `优先修复失败任务 ${failedTasks.map((task) => task.id).join(', ')}，然后按 cc-do 的恢复流程回到最近稳定 checkpoint。`;
  }

  const runningTasks = manifest.tasks.filter((task) => task.status === 'running');
  if (runningTasks.length > 0) {
    return `检查运行中任务 ${runningTasks.map((task) => task.id).join(', ')}，必要时按 cc-do 的恢复流程回到最近稳定 checkpoint。`;
  }

  const pendingTasks = manifest.tasks.filter((task) => task.status === 'pending');
  if (pendingTasks.length > 0) {
    return `继续执行待处理任务 ${pendingTasks.map((task) => task.id).join(', ')}。`;
  }

  if (!report) {
    return '所有任务已完成，进入 cc-check 并同步新鲜验证证据。';
  }

  if (report.overall === 'fail') {
    return '修复 blocking findings 后重新进入 cc-check。';
  }

  if (state?.status === 'released') {
    return '当前交付已发布，可归档或启动下一轮增量。';
  }

  if (hasPrBrief) {
    return 'PR brief 已生成，可直接整理提交、补齐说明并创建 PR。';
  }

  return '验证已通过，生成 PR brief 并准备文档同步 / release 材料。';
}

async function readLatestCheckpointNotes(repoRoot, goalId, tasks = []) {
  const notes = [];

  for (const task of tasks) {
    const checkpointPath = getCheckpointPath(repoRoot, goalId, task.id);
    const checkpoint = await readJson(checkpointPath, null);
    if (!checkpoint) {
      continue;
    }

    notes.push({
      taskId: task.id,
      status: checkpoint.status,
      timestamp: checkpoint.timestamp,
      summary: checkpoint.summary
    });
  }

  notes.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return notes.slice(0, 5);
}

async function writeSeedFile(filePath, content) {
  if (await exists(filePath)) {
    return;
  }
  await writeText(filePath, content);
}

async function appendIntentDecision(repoRoot, goalId, entry) {
  const logPath = getIntentDecisionLogPath(repoRoot, goalId);
  const existing = await readText(logPath, '');
  const header = existing.trim().length > 0 ? '' : '# Decision Log\n\n';
  const block = [
    `## ${entry.timestamp || nowIso()}`,
    `- Event: ${entry.event}`,
    `- Stage: ${entry.stage}`,
    `- Reason: ${entry.reason}`
  ];

  if (entry.details) {
    block.push(`- Details: ${entry.details}`);
  }

  await writeText(logPath, `${existing}${header}${block.join('\n')}\n\n`);
}

async function syncIntentCheckpoint(repoRoot, goalId, checkpoint) {
  await ensureIntentScaffold(repoRoot, goalId);

  const notePath = getIntentCheckpointNotePath(repoRoot, goalId, checkpoint.taskId);
  const content = [
    `# Checkpoint: ${checkpoint.taskId}`,
    '',
    `- Change: \`${checkpoint.changeId}\``,
    `- Session: \`${checkpoint.sessionId}\``,
    `- Plan Version: ${checkpoint.planVersion || 1}`,
    `- Status: \`${checkpoint.status}\``,
    `- Attempt: ${checkpoint.attempt}`,
    `- Timestamp: ${checkpoint.timestamp}`,
    '',
    '## Summary',
    '',
    checkpoint.summary
  ].join('\n');

  await writeText(notePath, `${content}\n`);
}

async function syncIntentTaskBriefs(repoRoot, goalId, manifest, state) {
  await ensureIntentScaffold(repoRoot, goalId);

  for (const task of manifest.tasks || []) {
    const mode = classifyDelegationMode(task, state || {});
    const briefPath = getIntentTaskBriefPath(repoRoot, goalId, task.id);
    const content = [
      `# Task Brief: ${task.id}`,
      '',
      `- Plan Version: ${manifest.metadata?.planVersion || 1}`,
      `- Route: \`${mode}\``,
      `- Type: \`${task.type}\``,
      `- Title: ${task.title}`,
      '',
      '## Dependencies',
      '',
      formatList(task.dependsOn.map((item) => `\`${item}\``), '- None'),
      '',
      '## Touched Files',
      '',
      formatList(task.touches.map((item) => `\`${item}\``), '- None'),
      '',
      '## Commands',
      '',
      formatList([...task.run, ...task.checks].map((item) => `\`${item}\``))
    ].join('\n');

    await writeText(briefPath, `${content}\n`);
  }
}

async function syncIntentTaskResult(repoRoot, goalId, checkpoint, lastError = '', details = {}) {
  if (!['passed', 'failed', 'skipped'].includes(checkpoint.status)) {
    return;
  }

  await ensureIntentScaffold(repoRoot, goalId);

  const resultPath = getIntentTaskResultPath(repoRoot, goalId, checkpoint.taskId);
  const content = [
    `# Task Result: ${checkpoint.taskId}`,
    '',
    `- Change: \`${checkpoint.changeId}\``,
    `- Plan Version: ${checkpoint.planVersion || 1}`,
    `- Session: \`${checkpoint.sessionId}\``,
    `- Status: \`${checkpoint.status}\``,
    `- Attempt: ${checkpoint.attempt}`,
    `- Timestamp: ${checkpoint.timestamp}`,
    '',
    '## Summary',
    '',
    checkpoint.summary,
    '',
    '## Error',
    '',
    lastError || 'None'
  ].join('\n');
  const outputBlock = details.output
    ? ['',
      '## Output',
      '',
      details.output]
    : [];

  const metadataBlock = details.metadata && Object.keys(details.metadata).length > 0
    ? ['',
      '## Metadata',
      '',
      ...Object.entries(details.metadata).map(([key, value]) => `- ${key}: ${value}`)]
    : [];

  await writeText(resultPath, `${[content, ...outputBlock, ...metadataBlock].join('\n')}\n`);
}

function truncateLine(value, max = 120) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 3).trimEnd()}...`;
}

function suggestPrTitle(changeId, goal) {
  const prefix = changeId.startsWith('BUG-') ? 'fix' : 'feat';
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

async function syncIntentPrBrief(repoRoot, goalId) {
  await ensureIntentScaffold(repoRoot, goalId);

  const [state, manifest, report] = await Promise.all([
    readJson(getRuntimeStatePath(repoRoot, goalId), null),
    readJson(getTaskManifestPath(repoRoot, goalId), null),
    readJson(getReportCardPath(repoRoot, goalId), null)
  ]);

  if (!manifest) {
    throw new Error(`Cannot prepare PR brief for ${goalId}: task-manifest.json is missing`);
  }

  if (!report) {
    throw new Error(`Cannot prepare PR brief for ${goalId}: report-card.json is missing`);
  }

  if (report.overall !== 'pass') {
    throw new Error(`Cannot prepare PR brief for ${goalId}: verification has not passed`);
  }

  const goal = manifest.goal || state?.goal || goalId;
  const summary = summarizeTaskStates(manifest.tasks || []);
  const touchedFiles = [...new Set((manifest.tasks || []).flatMap((task) => task.touches || []))];
  const skippedTasks = (manifest.tasks || []).filter((task) => task.status === 'skipped');
  const primaryResults = (manifest.tasks || [])
    .filter((task) => ['passed', 'skipped'].includes(task.status))
    .map((task) => `\`${task.id}\` ${task.title} -> \`devflow/intent/${goalId}/artifacts/results/${task.id}.md\``);

  const risks = [
    ...((report.review?.status === 'skipped' || report.review?.status === 'blocked')
      ? ['评审门未完全闭环，合并前需要补齐任务 review 与 diff review 证据。']
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
    `# PR Brief: ${goalId}`,
    '',
    `- Suggested Title: ${suggestPrTitle(goalId, goal)}`,
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
      `\`devflow/intent/${goalId}/resume-index.md\``,
      `\`devflow/requirements/${goalId}/task-manifest.json\``,
      `\`devflow/requirements/${goalId}/report-card.json\``,
      ...primaryResults
    ]),
    ''
  ].join('\n');

  const prBriefPath = getIntentPrBriefPath(repoRoot, goalId);
  await writeText(prBriefPath, `${content}\n`);

  return {
    goalId,
    prBriefPath,
    suggestedTitle: suggestPrTitle(goalId, goal)
  };
}

async function syncIntentMemory(repoRoot, changeId, options = {}) {
  const goalId = changeId;
  const generatedAt = nowIso();
  await ensureIntentScaffold(repoRoot, goalId);

  const state = await readJson(getRuntimeStatePath(repoRoot, changeId), null);
  const manifest = await readJson(getTaskManifestPath(repoRoot, changeId), null);
  const report = await readJson(getReportCardPath(repoRoot, changeId), null);
  const hasPrBrief = await exists(getIntentPrBriefPath(repoRoot, goalId));
  const stage = deriveLifecycleStage({ state, manifest, report, hasPrBrief });
  const approval = getApprovalState(state, manifest);
  const goal = manifest?.goal || state?.goal || changeId;
  const summary = summarizeTaskStates(manifest?.tasks || []);
  const latestCheckpoints = await readLatestCheckpointNotes(repoRoot, goalId, manifest?.tasks || []);
  const lastGoodCheckpoint = latestCheckpoints.find((checkpoint) => checkpoint.status === 'passed') || latestCheckpoints[0] || null;
  const nextAction = deriveNextAction({ changeId, state, manifest, report, hasPrBrief });

  const summaryPath = getIntentSummaryPath(repoRoot, goalId);
  const summaryContent = [
    `# Summary: ${goalId}`,
    '',
    `- Goal: ${goal}`,
    `- Change: \`${changeId}\``,
    `- Stage: \`${stage}\``,
    `- Lifecycle: \`${state?.status || 'unknown'}\``,
    `- Approval: \`${approval.status}\``,
    `- Execution Mode: \`${approval.executionMode}\``,
    `- Plan Version: ${manifest?.metadata?.planVersion || 1}`,
    `- Updated At: ${generatedAt}`,
    '',
    '## Progress',
    '',
    `- Passed: ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    `- Pending: ${summary.pending}`,
    `- Running: ${summary.running}`,
    `- Skipped: ${summary.skipped}`,
    '',
    '## Next Action',
    '',
    nextAction,
    '',
    '## Latest Checkpoints',
    '',
    formatList(
      latestCheckpoints.map(
        (checkpoint) =>
          `\`${checkpoint.taskId}\` ${checkpoint.status} @ ${checkpoint.timestamp} - ${checkpoint.summary}`
      ),
      '- No checkpoints yet'
    )
  ].join('\n');
  await writeText(summaryPath, `${summaryContent}\n`);

  const factsPath = getIntentFactsPath(repoRoot, goalId);
  const factsContent = [
    '# Facts',
    '',
    '## Confirmed',
    '',
    formatList([
      `当前变更 ID 为 \`${changeId}\`。`,
      `当前生命周期状态为 \`${state?.status || 'unknown'}\`。`,
      `当前执行阶段判定为 \`${stage}\`。`,
      `当前批准状态为 \`${approval.status}\`，执行模式为 \`${approval.executionMode}\`。`,
      `当前 plan_version 为 ${manifest?.metadata?.planVersion || 1}。`,
      manifest ? `当前任务数为 ${manifest.tasks.length}。` : '当前尚未生成 task-manifest。',
      hasPrBrief ? 'PR brief 已生成，可直接作为收尾材料。' : 'PR brief 尚未生成。'
    ]),
    '',
    '## Open Questions',
    '',
    formatList(
      manifest && approval.status === 'approved'
        ? []
        : ['当前计划是否已经被显式批准，并绑定到最新 plan_version？'],
      '- None'
    ),
    '',
    '## Rejected',
    '',
    '- 当前恢复逻辑不再只依赖聊天历史。'
  ].join('\n');
  await writeSeedFile(factsPath, `${factsContent}\n`);

  const planPath = getIntentPlanPath(repoRoot, goalId);
  const planContent = [
    `# Plan: ${goalId}`,
    '',
    `- Goal: ${goal}`,
    `- Generated At: ${generatedAt}`,
    `- Plan Version: ${manifest?.metadata?.planVersion || 1}`,
    '',
    '## Approval',
    '',
    `- Status: \`${approval.status}\``,
    `- Execution Mode: \`${approval.executionMode}\``,
    `- Approved At: ${approval.approvedAt || 'pending'}`,
    '',
    '## Execution Tasks',
    '',
    formatList(
      (manifest?.tasks || []).map(
        (task) => `\`${task.id}\` [${task.type}] ${task.title} -> ${task.status}`
      ),
      '- No tasks yet'
    ),
    '',
    '## Acceptance',
    '',
    formatList([
      '所有执行任务写出可审计结果。',
      'resume-index 与 checkpoint 保持一致。',
      '验证通过且文档同步完成。',
      'PR brief 准备完成，可直接进入提审。'
    ])
  ].join('\n');
  await writeText(planPath, `${planContent}\n`);

  const delegationPath = getIntentDelegationMapPath(repoRoot, goalId);
  const delegationContent = [
    `# Delegation Map: ${goalId}`,
    '',
    '## Default Ladder',
    '',
    '1. direct',
    '2. delegate',
    '3. team',
    '',
    '## Current Routing',
    '',
    formatList(
      (manifest?.tasks || []).map(
        (task) => `\`${task.id}\` -> ${classifyDelegationMode(task, state || {})}`
      ),
      '- 尚未生成任务，保持 direct 模式'
    )
  ].join('\n');
  await writeText(delegationPath, `${delegationContent}\n`);

  const blockers = [
    ...(manifest?.tasks || [])
      .filter((task) => task.status === 'failed')
      .map((task) => `${task.id}: ${task.lastError || 'Task failed'}`),
    ...(report?.blockingFindings || [])
  ];

  const resumePath = getIntentResumeIndexPath(repoRoot, goalId);
  const resumeContent = [
    `# Resume Index: ${goalId}`,
    '',
    `- Stage: \`${stage}\``,
    `- Goal: ${goal}`,
    `- Lifecycle: \`${state?.status || 'unknown'}\``,
    `- Approval: \`${approval.status}\``,
    `- Execution Mode: \`${approval.executionMode}\``,
    `- Plan Version: ${manifest?.metadata?.planVersion || 1}`,
    `- Updated At: ${generatedAt}`,
    '',
    '## Last Good Checkpoint',
    '',
    lastGoodCheckpoint
      ? `- \`${lastGoodCheckpoint.taskId}\` ${lastGoodCheckpoint.status} @ ${lastGoodCheckpoint.timestamp}`
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
    '## Suggested Actions',
    '',
    formatList(
      approval.status === 'approved'
        ? [
          '进入 cc-do，继续执行当前 ready tasks。',
          '如果执行中断，按 cc-do 的 stable checkpoint 恢复流程继续。',
          '任务完成后进入 cc-check，重新生成 report-card.json。'
        ]
        : [
          `回到 cc-plan，批准当前 plan_version ${manifest?.metadata?.planVersion || 1}。`,
          `确认 execution mode 仍为 ${approval.executionMode}。`,
          '如果 planning 已漂移，先重写 DESIGN.md / TASKS.md / task-manifest.json。'
        ]
    )
  ].join('\n');
  await writeText(resumePath, `${resumeContent}\n`);
  if (manifest) {
    await syncIntentTaskBriefs(repoRoot, goalId, manifest, state);
  }

  if (options.event) {
    await appendIntentDecision(repoRoot, goalId, {
      timestamp: nowIso(),
      event: options.event,
      stage,
      reason: options.reason || 'Runtime state updated',
      details: options.details || ''
    });
  }

  return {
    goalId,
    stage,
    summaryPath,
    resumePath
  };
}

module.exports = {
  getIntentSummaryPath,
  getIntentFactsPath,
  getIntentDecisionLogPath,
  getIntentPlanPath,
  getIntentDelegationMapPath,
  getIntentResumeIndexPath,
  getIntentCheckpointNotePath,
  getIntentTaskBriefPath,
  getIntentTaskResultPath,
  getIntentPrBriefPath,
  appendIntentDecision,
  syncIntentCheckpoint,
  syncIntentTaskResult,
  syncIntentPrBrief,
  syncIntentMemory
};
