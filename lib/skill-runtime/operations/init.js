/**
 * [INPUT]: 依赖 store 提供 repo/change 路径与读写能力，接收 changeId/goal 初始化参数。
 * [OUTPUT]: 写入 canonical devflow 目录与 change-state.json，返回初始化摘要。
 * [POS]: skill runtime Stage-1 初始化入口，供内部初始化链路复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  ensureDir,
  writeJson,
  readJson,
  getChangeDir,
  getRuntimeChangeDir,
  getRuntimeStatePath,
  syncChangeIndex
} = require('../store');
const { getChangePaths } = require('../paths');

async function runInit({ repoRoot, changeId, goal }) {
  const changePaths = getChangePaths(repoRoot, changeId, { goal });
  const changeDir = getChangeDir(repoRoot, changeId, { goal });
  const runtimeDir = getRuntimeChangeDir(repoRoot, changeId, { goal });
  const statePath = getRuntimeStatePath(repoRoot, changeId, { goal });

  await ensureDir(changeDir);
  await ensureDir(changePaths.metaDir);
  await ensureDir(changePaths.planningDir);
  await ensureDir(runtimeDir);
  await ensureDir(changePaths.tasksDir);
  await ensureDir(changePaths.workersDir);
  await ensureDir(changePaths.reviewDir);
  await ensureDir(changePaths.handoffDir);

  const index = await syncChangeIndex(repoRoot, changeId, { goal });

  const previous = (await readJson(statePath, {})) || {};
  const nextState = {
    changeId,
    changeKey: index.changeKey,
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
    changeDir,
    runtimeDir,
    changeKey: index.changeKey,
    statePath,
    status: nextState.status
  };
}

module.exports = {
  runInit
};
