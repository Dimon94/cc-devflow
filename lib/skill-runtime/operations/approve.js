/**
 * [INPUT]: 依赖 harness-state/task-manifest 与 intent memory，同步接收 changeId 与 executionMode。
 * [OUTPUT]: 为当前 plan_version 写入唯一 approval 真相，并返回批准摘要。
 * [POS]: skill runtime 的显式批准入口，专门负责把计划从 converge 推进到可执行态。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  readJson,
  writeJson,
  getRuntimeStatePath,
  getTaskManifestPath
} = require('../store');
const { parseRuntimeState, parseManifest } = require('../schemas');
const { syncIntentMemory } = require('../intent');
const { normalizeExecutionMode } = require('../lifecycle');

async function runApprove({ repoRoot, changeId, executionMode }) {
  const statePath = getRuntimeStatePath(repoRoot, changeId);
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const rawState = await readJson(statePath, null);
  const rawManifest = await readJson(manifestPath, null);

  if (!rawState) {
    throw new Error(`Cannot approve ${changeId}: runtime-state.json is missing`);
  }

  if (!rawManifest) {
    throw new Error(`Cannot approve ${changeId}: task-manifest.json is missing`);
  }

  const state = parseRuntimeState(rawState);
  const manifest = parseManifest(rawManifest);
  const approvedAt = nowIso();
  const nextExecutionMode = normalizeExecutionMode(executionMode || state.approval?.executionMode);

  await writeJson(statePath, {
    ...state,
    approval: {
      status: 'approved',
      executionMode: nextExecutionMode,
      planVersion: manifest.metadata?.planVersion || 1,
      approvedAt
    },
    updatedAt: approvedAt
  });

  await syncIntentMemory(repoRoot, changeId, {
    event: 'approval_granted',
    reason: `Plan version ${manifest.metadata?.planVersion || 1} approved for ${nextExecutionMode} execution`
  });

  return {
    changeId,
    statePath,
    status: 'approved',
    executionMode: nextExecutionMode,
    planVersion: manifest.metadata?.planVersion || 1,
    approvedAt
  };
}

module.exports = {
  runApprove
};
