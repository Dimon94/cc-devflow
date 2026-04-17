/**
 * [INPUT]: 依赖 store 提供的 requirement 状态读取能力，接收阶段名与 repo/change 标识。
 * [OUTPUT]: 对外提供 autopilot 共享阶段工具、approval 判定与 snapshot 读取函数。
 * [POS]: autopilot 的共享基础层，被 core 与 execution 共同复用，避免跨层互相借实现。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  readJson,
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath
} = require('../store');
const {
  normalizeStage,
  stageIndex,
  getApprovalState,
  isExecutionApproved
} = require('../lifecycle');

function hasUnresolvedTasks(manifest) {
  if (!manifest) {
    return false;
  }

  return manifest.tasks.some((task) =>
    ['pending', 'running', 'failed'].includes(task.status)
  );
}

async function loadState(repoRoot, changeId) {
  const [state, manifest, report] = await Promise.all([
    readJson(getRuntimeStatePath(repoRoot, changeId), null),
    readJson(getTaskManifestPath(repoRoot, changeId), null),
    readJson(getReportCardPath(repoRoot, changeId), null)
  ]);

  return { state, manifest, report };
}

module.exports = {
  normalizeStage,
  stageIndex,
  hasUnresolvedTasks,
  loadState,
  getApprovalState,
  isExecutionApproved
};
