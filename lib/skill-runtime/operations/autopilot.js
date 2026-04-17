/**
 * [INPUT]: 依赖 autopilot shared/core/execution runner，接收 changeId、goal、from、resume 等推进参数。
 * [OUTPUT]: 作为兼容入口串联最小阶段闭环，写入 autopilot 起止日志，并返回当前阶段、已执行步骤、resume 索引与 PR brief 路径。
 * [POS]: skill runtime 的 autopilot 兼容入口，只保留阶段顺序与总结果汇总。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  getIntentResumeIndexPath
} = require('../artifacts');
const { syncIntentMemory } = require('../intent');
const {
  normalizeStage,
  stageIndex,
  resolveCompletedStage,
  runDiscoverStage,
  runConvergeStage,
  runApprovalStage,
  runDelegateStage,
  runFinishStages
} = require('./autopilot-core');
const {
  loadState
} = require('./autopilot-shared');
const {
  runExecutionStage
} = require('./autopilot-execution');

async function runAutopilot({
  repoRoot,
  changeId,
  goal,
  from,
  resume = false,
  overwrite = false,
  parallel = 3,
  maxRetries,
  strict = false,
  skipReview = false,
  release = false,
  workerProvider,
  workerProviderArgs,
  workerCommand
}) {
  const executed = [];
  const fromIndex = stageIndex(from);

  await syncIntentMemory(repoRoot, changeId, {
    event: 'autopilot_started',
    reason: `Autopilot entered at stage ${normalizeStage(from) || 'discover'}`
  });

  let snapshot = await loadState(repoRoot, changeId);

  snapshot = await runDiscoverStage({
    repoRoot,
    changeId,
    goal,
    fromIndex,
    executed,
    snapshot
  });

  snapshot = await runConvergeStage({
    repoRoot,
    changeId,
    goal,
    fromIndex,
    overwrite,
    executed,
    snapshot
  });

  const approvalResult = await runApprovalStage({
    repoRoot,
    changeId,
    fromIndex,
    executed,
    snapshot
  });
  snapshot = approvalResult.snapshot;

  if (approvalResult.shouldStop) {
    const completedStage = resolveCompletedStage(snapshot);
    await syncIntentMemory(repoRoot, changeId, {
      event: 'autopilot_finished',
      reason: `Autopilot stopped at stage ${completedStage}`
    });

    return {
      changeId,
      executed,
      currentStage: completedStage,
      lifecycleStatus: snapshot.state?.status || 'unknown',
      reportOverall: snapshot.report?.overall || null,
      resumeIndexPath: getIntentResumeIndexPath(repoRoot, changeId),
      prBriefPath: null
    };
  }

  snapshot = await runDelegateStage({
    repoRoot,
    changeId,
    fromIndex,
    executed,
    snapshot
  });

  snapshot = await runExecutionStage({
    repoRoot,
    changeId,
    fromIndex,
    snapshot,
    executed,
    parallel,
    maxRetries,
    resume,
    workerProvider,
    workerProviderArgs,
    workerCommand
  });

  const finishResult = await runFinishStages({
    repoRoot,
    changeId,
    from,
    fromIndex,
    strict,
    skipReview,
    release,
    executed,
    snapshot
  });
  snapshot = finishResult.snapshot;

  const completedStage = resolveCompletedStage(snapshot);
  await syncIntentMemory(repoRoot, changeId, {
    event: 'autopilot_finished',
    reason: `Autopilot stopped at stage ${completedStage}`
  });

  return {
    changeId,
    executed,
    currentStage: completedStage,
    lifecycleStatus: snapshot.state?.status || 'unknown',
    reportOverall: snapshot.report?.overall || null,
    resumeIndexPath: getIntentResumeIndexPath(repoRoot, changeId),
    prBriefPath: finishResult.prBriefPath
  };
}

module.exports = {
  runAutopilot
};
