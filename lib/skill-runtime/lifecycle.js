/**
 * [INPUT]: 依赖 harness-state/task-manifest/report-card 的内存对象，接收 stage 名与任务元数据。
 * [OUTPUT]: 对外提供 lifecycle 阶段判定、approval 解析、下一步动作建议、执行模式归一化与 direct/delegate/team 路由决策。
 * [POS]: skill runtime 的共享生命周期语义层，让 query/intent/autopilot/dispatch 使用同一套运行时词汇与阶段建议。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const STAGE_ORDER = [
  'discover',
  'converge',
  'approve',
  'delegate',
  'execute',
  'verify',
  'document',
  'prepare-pr',
  'released'
];

function normalizeStage(stage) {
  if (!stage) {
    return null;
  }

  const aliases = {
    init: 'discover',
    snapshot: 'discover',
    plan: 'converge',
    approval: 'approve',
    approved: 'approve',
    'awaiting-approval': 'approve',
    awaiting_approval: 'approve',
    spec: 'converge',
    dispatch: 'execute',
    resume: 'execute',
    release: 'prepare-pr'
  };

  return aliases[stage] || stage;
}

function stageIndex(stage) {
  const normalized = normalizeStage(stage);
  if (!normalized) {
    return 0;
  }

  const index = STAGE_ORDER.indexOf(normalized);
  if (index === -1) {
    throw new Error(`Unknown autopilot stage: ${stage}`);
  }

  return index;
}

function normalizeExecutionMode(mode) {
  if (['direct', 'delegate', 'team'].includes(mode)) {
    return mode;
  }

  return 'delegate';
}

function normalizeTaskStatus(status) {
  const aliases = {
    completed: 'passed',
    done: 'passed',
    verified: 'passed'
  };

  return aliases[status] || status || 'pending';
}

function isTaskCompletedStatus(status) {
  return normalizeTaskStatus(status) === 'passed';
}

function isTaskSettledStatus(status) {
  return isTaskCompletedStatus(status) || status === 'skipped';
}

function summarizeTaskStates(tasks = []) {
  return tasks.reduce(
    (acc, task) => {
      const normalizedStatus = normalizeTaskStatus(task.status);
      acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
      return acc;
    },
    { pending: 0, running: 0, passed: 0, failed: 0, skipped: 0 }
  );
}

function deriveTaskProgress(tasks = []) {
  const summary = summarizeTaskStates(tasks);

  return {
    totalTasks: tasks.length,
    completedTasks: summary.passed,
    failedTasks: summary.failed,
    pendingTasks: summary.pending,
    runningTasks: summary.running,
    skippedTasks: summary.skipped
  };
}

function listTaskIdsByStatus(tasks = [], status) {
  return tasks
    .filter((task) => task.status === status)
    .map((task) => task.id);
}

function getApprovalState(state, manifest = null) {
  const currentPlanVersion = manifest?.metadata?.planVersion || state?.approval?.planVersion || null;
  const executionMode = normalizeExecutionMode(state?.approval?.executionMode);
  const approvedPlanVersion = state?.approval?.planVersion || null;
  const approved = Boolean(
    currentPlanVersion &&
    state?.approval?.status === 'approved' &&
    approvedPlanVersion === currentPlanVersion
  );

  return {
    status: approved ? 'approved' : 'pending',
    executionMode,
    planVersion: currentPlanVersion,
    approvedPlanVersion,
    approvedAt: approved ? state?.approval?.approvedAt || null : null
  };
}

function isExecutionApproved(state, manifest) {
  return getApprovalState(state, manifest).status === 'approved';
}

function classifyDelegationMode(task, options = {}) {
  const commandCount = (task.run || []).length + (task.checks || []).length;
  const executionMode = normalizeExecutionMode(
    options.executionMode || options.approval?.executionMode || options.state?.approval?.executionMode
  );
  const teamCandidate = (task.touches || []).length >= 4 || (task.dependsOn || []).length >= 3;

  if (executionMode === 'direct') {
    return 'direct';
  }

  if (executionMode === 'team' && teamCandidate) {
    return 'team';
  }

  if (
    commandCount > 1 ||
    (task.touches || []).length > 1 ||
    (task.dependsOn || []).length > 0 ||
    teamCandidate
  ) {
    return 'delegate';
  }

  return 'direct';
}

function deriveLifecycleStage({ state, manifest, report, hasPrBrief = false }) {
  const approval = getApprovalState(state, manifest);

  if (state?.status === 'released') {
    return 'released';
  }

  if (report?.overall === 'pass' && hasPrBrief) {
    return 'prepare-pr';
  }

  if (report?.overall === 'pass') {
    return 'document';
  }

  if (report?.overall === 'fail') {
    return 'verify';
  }

  if (manifest && approval.status !== 'approved') {
    return 'approve';
  }

  if (manifest) {
    const summary = summarizeTaskStates(manifest.tasks);
    if (summary.running > 0 || summary.failed > 0 || summary.pending > 0) {
      return state?.status === 'planned' ? 'delegate' : 'execute';
    }
    if (summary.passed > 0 || summary.skipped > 0) {
      return 'verify';
    }
  }

  if (state?.status === 'planned') {
    return 'delegate';
  }

  if (state?.status === 'initialized') {
    return 'discover';
  }

  return 'converge';
}

function describeExecutionNextAction({ failedTaskIds, runningTaskIds, pendingTaskIds, report }) {
  if (failedTaskIds.length > 0) {
    return `优先修复失败任务 ${failedTaskIds.join(', ')}，然后从最近稳定 checkpoint 恢复。`;
  }

  if (runningTaskIds.length > 0) {
    return `检查运行中任务 ${runningTaskIds.join(', ')}。`;
  }

  if (pendingTaskIds.length > 0) {
    return `继续执行待处理任务 ${pendingTaskIds.join(', ')}。`;
  }

  if (!report) {
    return '所有任务已完成，进入 cc-check 并同步验证证据。';
  }

  if (report.overall === 'fail') {
    return '修复 blocking findings 后重新进入 cc-check。';
  }

  return '验证已通过，按实际路由生成唯一 handoff 文件。';
}

const DEFAULT_NEXT_ACTION = '生成或刷新 task-manifest，然后回到批准闸。';

const NEXT_ACTION_RESOLVERS = {
  discover: () => DEFAULT_NEXT_ACTION,
  converge: () => DEFAULT_NEXT_ACTION,
  approve: ({ approval }) => `先批准当前计划版本 ${approval.planVersion || 1}，再进入执行。`,
  delegate: describeExecutionNextAction,
  execute: describeExecutionNextAction,
  verify: describeExecutionNextAction,
  document: ({ hasReleaseNote }) => (
    hasReleaseNote
      ? '发布材料已经生成，可归档或启动下一轮增量。'
      : '验证已通过，按实际路由生成唯一 handoff 文件。'
  ),
  'prepare-pr': ({ hasPrBrief, hasReleaseNote }) => {
    if (hasReleaseNote) {
      return '发布材料已经生成，可归档或启动下一轮增量。';
    }

    if (hasPrBrief) {
      return 'PR brief 已生成，可直接整理提交并创建 PR。';
    }

    return '验证已通过，按实际路由生成唯一 handoff 文件。';
  },
  released: () => '发布材料已经生成，可归档或启动下一轮增量。'
};

function deriveLifecycleNextAction({
  state,
  manifest,
  report,
  hasPrBrief = false,
  hasReleaseNote = false
}) {
  const stage = deriveLifecycleStage({ state, manifest, report, hasPrBrief });
  const resolver = NEXT_ACTION_RESOLVERS[stage] || NEXT_ACTION_RESOLVERS.converge;

  return resolver({
    approval: getApprovalState(state, manifest),
    report,
    hasPrBrief,
    hasReleaseNote,
    failedTaskIds: listTaskIdsByStatus(manifest?.tasks, 'failed'),
    runningTaskIds: listTaskIdsByStatus(manifest?.tasks, 'running'),
    pendingTaskIds: listTaskIdsByStatus(manifest?.tasks, 'pending')
  });
}

module.exports = {
  STAGE_ORDER,
  normalizeStage,
  stageIndex,
  normalizeExecutionMode,
  normalizeTaskStatus,
  isTaskCompletedStatus,
  isTaskSettledStatus,
  summarizeTaskStates,
  deriveTaskProgress,
  getApprovalState,
  isExecutionApproved,
  classifyDelegationMode,
  deriveLifecycleStage,
  deriveLifecycleNextAction
};
