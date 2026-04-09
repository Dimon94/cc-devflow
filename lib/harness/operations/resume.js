/**
 * [INPUT]: 依赖 manifest/checkpoint 当前状态与 dispatch 执行器，接收 changeId/并行度/重试参数。
 * [OUTPUT]: 将失败执行明确恢复到最近稳定 checkpoint，把未稳定任务重新排队后继续执行。
 * [POS]: harness 恢复执行入口，被 CLI `harness:resume` 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  readJson,
  writeJson,
  getTaskManifestPath,
  getHarnessStatePath,
  getCheckpointPath
} = require('../store');
const { parseManifest } = require('../schemas');
const { runDispatch } = require('./dispatch');
const { syncIntentMemory } = require('../intent');
const { getApprovalState, isExecutionApproved } = require('../lifecycle');

async function resolveStableCheckpoint(repoRoot, changeId, manifest) {
  const checkpoints = await Promise.all(
    manifest.tasks.map(async (task) => {
      const checkpoint = await readJson(getCheckpointPath(repoRoot, changeId, task.id), null);
      if (!checkpoint) {
        return null;
      }

      return {
        taskId: task.id,
        status: checkpoint.status,
        timestamp: checkpoint.timestamp,
        summary: checkpoint.summary,
        planVersion: checkpoint.planVersion || null
      };
    })
  );

  const latestPassed = checkpoints
    .filter((checkpoint) =>
      checkpoint &&
      checkpoint.status === 'passed' &&
      checkpoint.planVersion === (manifest.metadata?.planVersion || 1)
    )
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];

  return latestPassed || null;
}

function restoreTaskToPending(task, restoreLabel) {
  const previousError = task.lastError ? ` Previous error: ${task.lastError}` : '';
  task.status = 'pending';
  task.attempts = 0;
  task.lastError = `Restored from ${restoreLabel}.${previousError}`.trim();
}

function requeueFromStableCheckpoint(manifest, restoreTarget) {
  const restoreLabel = restoreTarget ? `stable checkpoint ${restoreTarget.taskId}` : 'execution start';
  const restoredTaskIds = [];

  for (const task of manifest.tasks) {
    if (task.status === 'running' || task.status === 'failed') {
      restoreTaskToPending(task, restoreLabel);
      restoredTaskIds.push(task.id);
      continue;
    }

    if (task.status === 'skipped' && task.lastError === 'Blocked by failed dependency') {
      restoreTaskToPending(task, restoreLabel);
      restoredTaskIds.push(task.id);
    }
  }

  return {
    restoreLabel,
    restoredTaskIds
  };
}

async function runResume({
  repoRoot,
  changeId,
  parallel,
  maxRetries,
  executionScope = 'all',
  fromCheckpoint = 'stable'
}) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const manifest = parseManifest(await readJson(manifestPath));
  const state = await readJson(getHarnessStatePath(repoRoot, changeId), null);
  const approval = getApprovalState(state, manifest);

  if (!isExecutionApproved(state, manifest)) {
    await syncIntentMemory(repoRoot, changeId, {
      event: 'resume_blocked_unapproved',
      reason: `Plan version ${approval.planVersion || manifest.metadata?.planVersion || 1} must be approved before resume`
    });

    return {
      changeId,
      manifestPath,
      summary: null,
      success: false,
      reason: `Execution blocked until plan_version ${approval.planVersion || manifest.metadata?.planVersion || 1} is approved. Run npm run harness:approve -- --change-id "${changeId}" --execution-mode ${approval.executionMode}.`
    };
  }

  if (fromCheckpoint && fromCheckpoint !== 'stable') {
    throw new Error(`Unsupported --from-checkpoint value: ${fromCheckpoint}`);
  }

  const restoreTarget = await resolveStableCheckpoint(repoRoot, changeId, manifest);
  const restoreSummary = requeueFromStableCheckpoint(manifest, restoreTarget);

  await writeJson(manifestPath, manifest);
  await syncIntentMemory(repoRoot, changeId, {
    event: 'resume_restored_checkpoint',
    reason: restoreSummary.restoredTaskIds.length > 0
      ? `Restored ${restoreSummary.restoredTaskIds.join(', ')} from ${restoreSummary.restoreLabel}`
      : `Resume confirmed ${restoreSummary.restoreLabel}; no unresolved tasks required requeue`
  });

  const dispatchResult = await runDispatch({
    repoRoot,
    changeId,
    parallel,
    maxRetries,
    resume: true,
    executionScope
  });

  return {
    ...dispatchResult,
    restoredCheckpoint: restoreTarget,
    restoredTasks: restoreSummary.restoredTaskIds,
    reason: dispatchResult.reason || `Resumed from ${restoreSummary.restoreLabel}`
  };
}

module.exports = {
  runResume
};
