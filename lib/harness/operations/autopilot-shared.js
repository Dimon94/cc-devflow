/**
 * [INPUT]: 依赖 store 提供的 requirement 状态读取能力，接收阶段名与 repo/change 标识。
 * [OUTPUT]: 对外提供 autopilot 共享阶段工具与 snapshot 读取函数。
 * [POS]: autopilot 的共享基础层，被 core 与 execution 共同复用，避免跨层互相借实现。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  readJson,
  getHarnessStatePath,
  getTaskManifestPath,
  getReportCardPath
} = require('../store');

const STAGE_ORDER = [
  'discover',
  'converge',
  'delegate',
  'execute',
  'verify',
  'document',
  'prepare-pr'
];

function normalizeStage(stage) {
  if (!stage) {
    return null;
  }

  const aliases = {
    init: 'discover',
    pack: 'discover',
    plan: 'converge',
    spec: 'converge',
    dispatch: 'execute',
    resume: 'execute',
    release: 'prepare-pr'
  };

  return aliases[stage] || stage;
}

function stageIndex(stage) {
  const normalized = normalizeStage(stage);
  if (!normalized) {
    return 0;
  }

  const index = STAGE_ORDER.indexOf(normalized);
  if (index === -1) {
    throw new Error(`Unknown autopilot stage: ${stage}`);
  }

  return index;
}

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
    readJson(getHarnessStatePath(repoRoot, changeId), null),
    readJson(getTaskManifestPath(repoRoot, changeId), null),
    readJson(getReportCardPath(repoRoot, changeId), null)
  ]);

  return { state, manifest, report };
}

module.exports = {
  normalizeStage,
  stageIndex,
  hasUnresolvedTasks,
  loadState
};
