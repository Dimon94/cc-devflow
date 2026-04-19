/**
 * [INPUT]: 依赖 store 的目录创建能力，接收 repoRoot/goalId/taskId 等工件定位参数。
 * [OUTPUT]: 对外提供 intent artifact 的路径约定与脚手架创建能力，不夹带阶段语义或下一步建议。
 * [POS]: skill runtime 的纯 artifact 定位层，把路径世界与流程叙事从 intent.js 中拆开。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { ensureDir, getReleaseNotePath } = require('./store');
const { getChangePaths, getTaskPaths } = require('./paths');

function getIntentDir(repoRoot, goalId, options = {}) {
  return getChangePaths(repoRoot, goalId, options).changeDir;
}

function getIntentArtifactsDir(repoRoot, goalId, options = {}) {
  return getChangePaths(repoRoot, goalId, options).executionDir;
}

function getIntentCheckpointsDir(repoRoot, goalId, options = {}) {
  return getChangePaths(repoRoot, goalId, options).tasksDir;
}

function getIntentResumeIndexPath(repoRoot, goalId, options = {}) {
  return `${getChangePaths(repoRoot, goalId, options).handoffDir}/resume-index.md`;
}

function getIntentPrBriefPath(repoRoot, goalId, options = {}) {
  return `${getChangePaths(repoRoot, goalId, options).handoffDir}/pr-brief.md`;
}

function getIntentStatusPath(repoRoot, goalId, options = {}) {
  return `${getChangePaths(repoRoot, goalId, options).handoffDir}/status.md`;
}

function getIntentHandoffArtifactPaths(repoRoot, goalId, options = {}) {
  return [
    getIntentPrBriefPath(repoRoot, goalId, options),
    getIntentResumeIndexPath(repoRoot, goalId, options),
    getReleaseNotePath(repoRoot, goalId, options),
    getIntentStatusPath(repoRoot, goalId, options)
  ];
}

function getLegacyIntentProjectionPaths(repoRoot, goalId, taskIds = [], options = {}) {
  const change = getChangePaths(repoRoot, goalId, options);
  const taskFiles = taskIds.flatMap((taskId) => {
    const task = getTaskPaths(repoRoot, goalId, taskId, options);
    return [
      `${task.taskDir}/brief.md`,
      `${task.taskDir}/checkpoint.md`,
      `${task.taskDir}/result.md`,
      `${task.taskDir}/review-spec.md`,
      `${task.taskDir}/review-code.md`
    ];
  });

  return [
    `${change.metaDir}/index.json`,
    `${change.planningDir}/planning-snapshot.md`,
    `${change.planningDir}/facts.md`,
    `${change.planningDir}/decision-log.md`,
    `${change.planningDir}/plan.md`,
    `${change.executionDir}/team-memory.md`,
    `${change.executionDir}/message-bus.md`,
    `${change.executionDir}/delegation-map.md`,
    getIntentStatusPath(repoRoot, goalId, options),
    ...taskFiles
  ];
}

async function ensureIntentScaffold(repoRoot, goalId) {
  const change = getChangePaths(repoRoot, goalId);

  await ensureDir(change.changeDir);
  await ensureDir(change.metaDir);
  await ensureDir(change.planningDir);
  await ensureDir(change.executionDir);
  await ensureDir(change.tasksDir);
  await ensureDir(change.reviewDir);
  await ensureDir(change.handoffDir);
}

module.exports = {
  getIntentDir,
  getIntentArtifactsDir,
  getIntentCheckpointsDir,
  getIntentResumeIndexPath,
  getIntentPrBriefPath,
  getIntentStatusPath,
  getIntentHandoffArtifactPaths,
  getLegacyIntentProjectionPaths,
  ensureIntentScaffold
};
