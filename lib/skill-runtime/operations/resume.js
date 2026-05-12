/**
 * [INPUT]: 依赖 manifest 当前状态与 dispatch 执行器，接收 changeId/并行度/重试参数。
 * [OUTPUT]: 将失败执行恢复到最近已通过的 manifest 任务边界，把未稳定任务重新排队后继续执行。
 * [POS]: skill runtime 恢复执行入口，供内部恢复链路复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  readJson,
  writeJson,
  getTaskManifestPath,
  getRuntimeStatePath
} = require('../store');
const { parseManifest } = require('../schemas');
const { applyManifestExecutionState } = require('../planner');
const { runDispatch } = require('./dispatch');
const { syncIntentMemory } = require('../intent');
const { getApprovalState, isExecutionApproved } = require('../lifecycle');

async function resolveStableManifestPoint(manifest) {
  const passedTasks = manifest.tasks
    .filter((task) => task.status === 'passed')
    .map((task) => ({
      taskId: task.id,
      status: task.status,
      title: task.title || '',
      planVersion: manifest.metadata?.planVersion || 1
    }));

  return passedTasks[passedTasks.length - 1] || null;
}

function restoreTaskToPending(task, restoreLabel) {
  const previousError = task.lastError ? ` Previous error: ${task.lastError}` : '';
  task.status = 'pending';
  task.attempts = 0;
  task.lastError = `Restored from ${restoreLabel}.${previousError}`.trim();
}

function requeueFromStableManifestPoint(manifest, restoreTarget) {
  const restoreLabel = restoreTarget ? `stable manifest task ${restoreTarget.taskId}` : 'execution start';
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
  const state = await readJson(getRuntimeStatePath(repoRoot, changeId), null);
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
      reason: `Execution blocked until plan_version ${approval.planVersion || manifest.metadata?.planVersion || 1} is approved. Return to the cc-plan approval gate and keep execution mode ${approval.executionMode}.`
    };
  }

  if (fromCheckpoint && fromCheckpoint !== 'stable') {
    throw new Error(`Unsupported resume point: ${fromCheckpoint}`);
  }

  const restoreTarget = await resolveStableManifestPoint(manifest);
  const restoreSummary = requeueFromStableManifestPoint(manifest, restoreTarget);

  applyManifestExecutionState(manifest);
  await writeJson(manifestPath, manifest);
  await syncIntentMemory(repoRoot, changeId, {
    event: 'resume_restored_manifest_state',
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
    restoredState: restoreTarget,
    restoredTasks: restoreSummary.restoredTaskIds,
    reason: dispatchResult.reason || `Resumed from ${restoreSummary.restoreLabel}`
  };
}

module.exports = {
  runResume
};
