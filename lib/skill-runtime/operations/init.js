/**
 * [INPUT]: 依赖 store 提供 repo/change 路径与读写能力，接收 changeId/goal 初始化参数。
 * [OUTPUT]: 写入 requirement 目录与 runtime-state.json，返回初始化摘要。
 * [POS]: skill runtime Stage-1 初始化入口，供内部初始化链路复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  ensureDir,
  writeJson,
  readJson,
  getRequirementDir,
  getRuntimeChangeDir,
  getRuntimeStatePath
} = require('../store');

async function runInit({ repoRoot, changeId, goal }) {
  const requirementDir = getRequirementDir(repoRoot, changeId);
  const runtimeDir = getRuntimeChangeDir(repoRoot, changeId);
  const statePath = getRuntimeStatePath(repoRoot, changeId);

  await ensureDir(requirementDir);
  await ensureDir(runtimeDir);

  const previous = (await readJson(statePath, {})) || {};
  const nextState = {
    changeId,
    goal: goal || previous.goal || `Deliver ${changeId} safely with auditable checkpoints.`,
    status: 'initialized',
    initializedAt: previous.initializedAt || nowIso(),
    approval: {
      status: 'pending',
      executionMode: previous.approval?.executionMode || 'delegate'
    },
    updatedAt: nowIso()
  };

  await writeJson(statePath, nextState);

  return {
    changeId,
    requirementDir,
    runtimeDir,
    statePath,
    status: nextState.status
  };
}

module.exports = {
  runInit
};
