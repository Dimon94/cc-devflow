/**
 * [INPUT]: 依赖 manifest 当前任务状态与 dispatch 执行器，接收 changeId/并行度/重试参数。
 * [OUTPUT]: 将 running 与可重试 failed 任务回置为 pending，并继续调度执行。
 * [POS]: harness 恢复执行入口，被 CLI `harness:resume` 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { readJson, writeJson, getTaskManifestPath } = require('../store');
const { parseManifest } = require('../schemas');
const { runDispatch } = require('./dispatch');
const { syncIntentMemory } = require('../intent');

async function runResume({ repoRoot, changeId, parallel, maxRetries, executionScope = 'all' }) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const manifest = parseManifest(await readJson(manifestPath));

  for (const task of manifest.tasks) {
    if (task.status === 'running') {
      task.status = 'pending';
      task.lastError = 'Resumed from interrupted running state';
      continue;
    }

    if (task.status === 'failed') {
      const retryLimit = Number.isInteger(maxRetries) ? maxRetries : task.maxRetries;
      if (task.attempts <= retryLimit) {
        task.status = 'pending';
      }
    }
  }

  await writeJson(manifestPath, manifest);
  await syncIntentMemory(repoRoot, changeId, {
    event: 'resume_requeued',
    reason: 'Running and retryable failed tasks were reset to pending before resume'
  });

  return runDispatch({
    repoRoot,
    changeId,
    parallel,
    maxRetries,
    resume: true,
    executionScope
  });
}

module.exports = {
  runResume
};
