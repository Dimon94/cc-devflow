/**
 * [INPUT]: 依赖 store 的目录创建能力，接收 repoRoot/goalId/taskId 等工件定位参数。
 * [OUTPUT]: 对外提供 intent artifact 的路径约定与脚手架创建能力，不夹带阶段语义或下一步建议。
 * [POS]: skill runtime 的纯 artifact 定位层，把路径世界与流程叙事从 intent.js 中拆开。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const path = require('path');
const { ensureDir } = require('./store');
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

function getIntentSummaryPath(repoRoot, goalId, options = {}) {
  return path.join(getChangePaths(repoRoot, goalId, options).handoffDir, 'status.md');
}

function getIntentFactsPath(repoRoot, goalId, options = {}) {
  return path.join(getChangePaths(repoRoot, goalId, options).planningDir, 'facts.md');
}

function getIntentDecisionLogPath(repoRoot, goalId, options = {}) {
  return path.join(getChangePaths(repoRoot, goalId, options).planningDir, 'decision-log.md');
}

function getIntentPlanPath(repoRoot, goalId, options = {}) {
  return path.join(getChangePaths(repoRoot, goalId, options).planningDir, 'plan.md');
}

function getIntentDelegationMapPath(repoRoot, goalId, options = {}) {
  return path.join(getChangePaths(repoRoot, goalId, options).executionDir, 'delegation-map.md');
}

function getIntentResumeIndexPath(repoRoot, goalId, options = {}) {
  return path.join(getChangePaths(repoRoot, goalId, options).handoffDir, 'resume-index.md');
}

function getIntentCheckpointNotePath(repoRoot, goalId, taskId, options = {}) {
  return getTaskPaths(repoRoot, goalId, taskId, options).checkpointNotePath;
}

function getIntentBriefsDir(repoRoot, goalId, options = {}) {
  return getChangePaths(repoRoot, goalId, options).tasksDir;
}

function getIntentResultsDir(repoRoot, goalId, options = {}) {
  return getChangePaths(repoRoot, goalId, options).tasksDir;
}

function getIntentTaskBriefPath(repoRoot, goalId, taskId, options = {}) {
  return getTaskPaths(repoRoot, goalId, taskId, options).briefPath;
}

function getIntentTaskResultPath(repoRoot, goalId, taskId, options = {}) {
  return getTaskPaths(repoRoot, goalId, taskId, options).resultPath;
}

function getIntentPrBriefPath(repoRoot, goalId, options = {}) {
  return path.join(getChangePaths(repoRoot, goalId, options).handoffDir, 'pr-brief.md');
}

async function ensureIntentScaffold(repoRoot, goalId) {
  const change = getChangePaths(repoRoot, goalId);

  await ensureDir(change.changeDir);
  await ensureDir(change.metaDir);
  await ensureDir(change.planningDir);
  await ensureDir(change.executionDir);
  await ensureDir(change.tasksDir);
  await ensureDir(change.workersDir);
  await ensureDir(change.reviewDir);
  await ensureDir(change.handoffDir);
}

module.exports = {
  getIntentDir,
  getIntentArtifactsDir,
  getIntentCheckpointsDir,
  getIntentSummaryPath,
  getIntentFactsPath,
  getIntentDecisionLogPath,
  getIntentPlanPath,
  getIntentDelegationMapPath,
  getIntentResumeIndexPath,
  getIntentCheckpointNotePath,
  getIntentTaskBriefPath,
  getIntentTaskResultPath,
  getIntentPrBriefPath,
  ensureIntentScaffold
};
