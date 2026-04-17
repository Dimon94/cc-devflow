/**
 * [INPUT]: 依赖 harness-state/task-manifest/report-card 的内存对象，接收 stage 名与任务元数据。
 * [OUTPUT]: 对外提供 lifecycle 阶段判定、approval 解析、执行模式归一化与 direct/delegate/team 路由决策。
 * [POS]: skill runtime 的共享生命周期语义层，让 query/intent/autopilot/dispatch 使用同一套运行时词汇。
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
    pack: 'discover',
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

function summarizeTaskStates(tasks = []) {
  return tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    { pending: 0, running: 0, passed: 0, failed: 0, skipped: 0 }
  );
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

module.exports = {
  STAGE_ORDER,
  normalizeStage,
  stageIndex,
  normalizeExecutionMode,
  summarizeTaskStates,
  getApprovalState,
  isExecutionApproved,
  classifyDelegationMode,
  deriveLifecycleStage
};
