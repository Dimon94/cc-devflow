/**
 * [INPUT]: 依赖 store 读取 change-state/package scripts，并通过 git 命令收集仓库事实。
 * [OUTPUT]: 返回 discover 阶段需要的仓库事实，不再落盘 planning-snapshot.md。
 * [POS]: skill runtime Stage-2 内部快照入口，被 autopilot discover 阶段调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  readJson,
  getRuntimeStatePath,
  runCommand,
  getPackageScripts
} = require('../store');

async function collectGitFacts(repoRoot) {
  const [branch, commit, status] = await Promise.all([
    runCommand('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot }),
    runCommand('git rev-parse HEAD', { cwd: repoRoot }),
    runCommand('git status --short', { cwd: repoRoot })
  ]);

  return {
    branch: branch.code === 0 ? branch.stdout.trim() : 'unknown',
    commit: commit.code === 0 ? commit.stdout.trim() : 'unknown',
    status: status.code === 0 ? status.stdout.trim() : '(clean)'
  };
}

async function runPlanningSnapshot({ repoRoot, changeId, goal }) {
  const state = (await readJson(getRuntimeStatePath(repoRoot, changeId), {})) || {};
  const effectiveGoal = goal || state.goal || `Deliver ${changeId} safely with auditable checkpoints.`;
  const gitFacts = await collectGitFacts(repoRoot);
  const scripts = await getPackageScripts(repoRoot);

  return {
    changeId,
    goal: effectiveGoal,
    gitFacts,
    scripts
  };
}

module.exports = {
  runPlanningSnapshot
};
