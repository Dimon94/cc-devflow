/**
 * [INPUT]: 依赖 store 的目录创建能力，接收 repoRoot/goalId/taskId 等工件定位参数。
 * [OUTPUT]: 对外提供 intent artifact 的路径约定与脚手架创建能力，不夹带阶段语义或下一步建议。
 * [POS]: skill runtime 的纯 artifact 定位层，把路径世界与流程叙事从 intent.js 中拆开。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const path = require('path');
const { ensureDir } = require('./store');

function getIntentDir(repoRoot, goalId) {
  return path.join(repoRoot, 'devflow', 'intent', goalId);
}

function getIntentArtifactsDir(repoRoot, goalId) {
  return path.join(getIntentDir(repoRoot, goalId), 'artifacts');
}

function getIntentCheckpointsDir(repoRoot, goalId) {
  return path.join(getIntentDir(repoRoot, goalId), 'checkpoints');
}

function getIntentSummaryPath(repoRoot, goalId) {
  return path.join(getIntentDir(repoRoot, goalId), 'summary.md');
}

function getIntentFactsPath(repoRoot, goalId) {
  return path.join(getIntentDir(repoRoot, goalId), 'facts.md');
}

function getIntentDecisionLogPath(repoRoot, goalId) {
  return path.join(getIntentDir(repoRoot, goalId), 'decision-log.md');
}

function getIntentPlanPath(repoRoot, goalId) {
  return path.join(getIntentDir(repoRoot, goalId), 'plan.md');
}

function getIntentDelegationMapPath(repoRoot, goalId) {
  return path.join(getIntentDir(repoRoot, goalId), 'delegation-map.md');
}

function getIntentResumeIndexPath(repoRoot, goalId) {
  return path.join(getIntentDir(repoRoot, goalId), 'resume-index.md');
}

function getIntentCheckpointNotePath(repoRoot, goalId, taskId) {
  return path.join(getIntentCheckpointsDir(repoRoot, goalId), `${taskId}.md`);
}

function getIntentBriefsDir(repoRoot, goalId) {
  return path.join(getIntentArtifactsDir(repoRoot, goalId), 'briefs');
}

function getIntentResultsDir(repoRoot, goalId) {
  return path.join(getIntentArtifactsDir(repoRoot, goalId), 'results');
}

function getIntentTaskBriefPath(repoRoot, goalId, taskId) {
  return path.join(getIntentBriefsDir(repoRoot, goalId), `${taskId}.md`);
}

function getIntentTaskResultPath(repoRoot, goalId, taskId) {
  return path.join(getIntentResultsDir(repoRoot, goalId), `${taskId}.md`);
}

function getIntentPrBriefPath(repoRoot, goalId) {
  return path.join(getIntentArtifactsDir(repoRoot, goalId), 'pr-brief.md');
}

async function ensureIntentScaffold(repoRoot, goalId) {
  await ensureDir(getIntentDir(repoRoot, goalId));
  await ensureDir(getIntentArtifactsDir(repoRoot, goalId));
  await ensureDir(getIntentCheckpointsDir(repoRoot, goalId));
  await ensureDir(getIntentBriefsDir(repoRoot, goalId));
  await ensureDir(getIntentResultsDir(repoRoot, goalId));
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
