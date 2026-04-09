/**
 * [INPUT]: 依赖 store/intent/delegation 与 discover/converge/delegate/verify/release 原语，接收阶段上下文。
 * [OUTPUT]: 对外提供 autopilot 的阶段判定、approval gate、state 读取与非执行类 stage runner。
 * [POS]: autopilot 的核心生命周期层，负责阶段顺序、记忆写点与 finish 收尾，而不处理具体执行循环。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  exists,
  getContextPackagePath
} = require('../store');
const { syncIntentMemory, getIntentPrBriefPath } = require('../intent');
const { syncDelegationRuntime } = require('../delegation');
const { runInit } = require('./init');
const { runPack } = require('./pack');
const { runPlan } = require('./plan');
const { runPreparePr } = require('./prepare-pr');
const { runVerify } = require('./verify');
const { runRelease } = require('./release');
const {
  normalizeStage,
  stageIndex,
  hasUnresolvedTasks,
  loadState,
  getApprovalState
} = require('./autopilot-shared');

function allTasksSettled(manifest) {
  if (!manifest) {
    return false;
  }

  return manifest.tasks.every((task) =>
    ['passed', 'skipped'].includes(task.status)
  );
}

function shouldRunVerify(from, snapshot) {
  if (!snapshot.manifest || !allTasksSettled(snapshot.manifest)) {
    return false;
  }

  return (
    !snapshot.report ||
    snapshot.report.overall === 'fail' ||
    normalizeStage(from) === 'verify' ||
    normalizeStage(from) === 'document' ||
    normalizeStage(from) === 'prepare-pr'
  );
}

function resolveCompletedStage(snapshot) {
  const approval = getApprovalState(snapshot.state, snapshot.manifest);

  if (snapshot.report?.overall === 'pass') {
    return 'prepare-pr';
  }

  if (snapshot.manifest && approval.status !== 'approved') {
    return 'approve';
  }

  if (snapshot.manifest && hasUnresolvedTasks(snapshot.manifest)) {
    return 'execute';
  }

  return snapshot.manifest ? 'verify' : 'converge';
}

async function runVerificationStage({
  repoRoot,
  changeId,
  from,
  strict,
  skipReview,
  executed,
  snapshot
}) {
  if (!shouldRunVerify(from, snapshot)) {
    return snapshot;
  }

  const result = await runVerify({
    repoRoot,
    changeId,
    strict,
    skipReview
  });
  executed.push('verify');

  await syncIntentMemory(repoRoot, changeId, {
    event: result.overall === 'pass' ? 'autopilot_verify_passed' : 'autopilot_verify_failed',
    reason: result.overall === 'pass' ? 'Verification passed' : 'Verification produced blocking findings'
  });

  return loadState(repoRoot, changeId);
}

async function runPreparePrStage({
  repoRoot,
  changeId,
  fromIndex,
  executed,
  snapshot
}) {
  if (fromIndex > stageIndex('prepare-pr') || snapshot.report?.overall !== 'pass') {
    return {
      snapshot,
      prBriefPath: snapshot.report?.overall === 'pass' ? getIntentPrBriefPath(repoRoot, changeId) : null
    };
  }

  const prepared = await runPreparePr({ repoRoot, changeId });
  executed.push('prepare-pr');

  return {
    snapshot: await loadState(repoRoot, changeId),
    prBriefPath: prepared.prBriefPath
  };
}

async function runReleaseStage({
  repoRoot,
  changeId,
  release,
  executed,
  snapshot
}) {
  if (!release || snapshot.report?.overall !== 'pass') {
    return snapshot;
  }

  await runRelease({ repoRoot, changeId });
  executed.push('release');

  await syncIntentMemory(repoRoot, changeId, {
    event: 'autopilot_release_completed',
    reason: 'Release stage completed after successful verification'
  });

  return loadState(repoRoot, changeId);
}

async function runDiscoverStage({
  repoRoot,
  changeId,
  goal,
  fromIndex,
  executed,
  snapshot
}) {
  const hasContextPackage = await exists(getContextPackagePath(repoRoot, changeId));
  if (fromIndex > stageIndex('discover') && snapshot.state && hasContextPackage) {
    return snapshot;
  }

  if (!snapshot.state) {
    await runInit({ repoRoot, changeId, goal });
    executed.push('init');
  }

  await runPack({ repoRoot, changeId, goal });
  executed.push('pack');

  await syncIntentMemory(repoRoot, changeId, {
    event: 'autopilot_discover_completed',
    reason: 'Requirement state and context package are ready'
  });

  return loadState(repoRoot, changeId);
}

async function runConvergeStage({
  repoRoot,
  changeId,
  goal,
  fromIndex,
  overwrite,
  executed,
  snapshot
}) {
  if (fromIndex > stageIndex('converge') && snapshot.manifest && !overwrite) {
    return snapshot;
  }

  const plannedFresh = !snapshot.manifest || overwrite;
  if (!snapshot.manifest || overwrite) {
    await runPlan({ repoRoot, changeId, goal, overwrite });
    executed.push('plan');
  }

  await syncIntentMemory(repoRoot, changeId, {
    event: 'autopilot_converge_completed',
    reason: plannedFresh ? 'Execution plan is ready and waiting for approval' : 'Plan already existed and was reused'
  });

  return loadState(repoRoot, changeId);
}

async function runApprovalStage({
  repoRoot,
  changeId,
  fromIndex,
  executed,
  snapshot
}) {
  if (!snapshot.manifest) {
    return {
      snapshot,
      shouldStop: false
    };
  }

  const approval = getApprovalState(snapshot.state, snapshot.manifest);
  if (approval.status !== 'approved') {
    await syncIntentMemory(repoRoot, changeId, {
      event: 'autopilot_awaiting_approval',
      reason: `Plan version ${approval.planVersion || 1} is waiting for explicit approval before execute`
    });

    return {
      snapshot: await loadState(repoRoot, changeId),
      shouldStop: true
    };
  }

  if (fromIndex <= stageIndex('approve')) {
    executed.push('approve');
  }

  await syncIntentMemory(repoRoot, changeId, {
    event: 'autopilot_approval_confirmed',
    reason: `Plan version ${approval.planVersion || 1} approved for ${approval.executionMode} execution`
  });

  return {
    snapshot: await loadState(repoRoot, changeId),
    shouldStop: false
  };
}

async function runDelegateStage({
  repoRoot,
  changeId,
  fromIndex,
  executed,
  snapshot
}) {
  if (fromIndex > stageIndex('delegate')) {
    return snapshot;
  }

  const approval = getApprovalState(snapshot.state, snapshot.manifest);
  if (approval.status !== 'approved') {
    return snapshot;
  }

  let delegationSummary = null;
  if (snapshot.manifest && approval.executionMode !== 'direct') {
    delegationSummary = await syncDelegationRuntime(repoRoot, changeId, snapshot.manifest, snapshot.state);
  }

  if (delegationSummary && delegationSummary.delegatedCount > 0) {
    executed.push('delegate');
  }

  await syncIntentMemory(repoRoot, changeId, {
    event: 'autopilot_delegate_completed',
    reason: approval.executionMode === 'direct'
      ? 'Approved plan stays in direct mode, so delegation runtime was skipped'
      : delegationSummary && delegationSummary.delegatedCount > 0
      ? `Prepared ${delegationSummary.delegatedCount} delegated assignment(s) for local execution`
      : 'Current plan stays on direct execution'
  });

  return loadState(repoRoot, changeId);
}

async function runFinishStages({
  repoRoot,
  changeId,
  from,
  fromIndex,
  strict,
  skipReview,
  release,
  executed,
  snapshot
}) {
  let nextSnapshot = snapshot;

  if (fromIndex <= stageIndex('verify')) {
    nextSnapshot = await runVerificationStage({
      repoRoot,
      changeId,
      from,
      strict,
      skipReview,
      executed,
      snapshot: nextSnapshot
    });
  }

  const preparePrResult = await runPreparePrStage({
    repoRoot,
    changeId,
    fromIndex,
    executed,
    snapshot: nextSnapshot
  });
  nextSnapshot = preparePrResult.snapshot;

  nextSnapshot = await runReleaseStage({
    repoRoot,
    changeId,
    release,
    executed,
    snapshot: nextSnapshot
  });

  return {
    snapshot: nextSnapshot,
    prBriefPath: preparePrResult.prBriefPath
  };
}

module.exports = {
  normalizeStage,
  stageIndex,
  hasUnresolvedTasks,
  loadState,
  resolveCompletedStage,
  runDiscoverStage,
  runConvergeStage,
  runApprovalStage,
  runDelegateStage,
  runFinishStages
};
