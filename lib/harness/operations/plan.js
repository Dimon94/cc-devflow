/**
 * [INPUT]: 依赖 planner.createTaskManifest，接收 changeId/goal/overwrite 参数。
 * [OUTPUT]: 生成并返回已校验的 task-manifest.json 摘要。
 * [POS]: harness Stage-3 计划生成入口，被 CLI `harness:plan` 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { createTaskManifest } = require('../planner');
const { getIntentPrBriefPath } = require('../intent');
const {
  getTaskManifestPath,
  getHarnessStatePath,
  getReportCardPath,
  exists,
  readJson,
  writeJson,
  removePath
} = require('../store');

async function runPlan({ repoRoot, changeId, goal, overwrite }) {
  const manifest = await createTaskManifest({
    repoRoot,
    changeId,
    goal,
    overwrite
  });

  // Update harness-state.json with plannedAt timestamp
  const statePath = getHarnessStatePath(repoRoot, changeId);
  if (await exists(statePath)) {
    const state = await readJson(statePath);
    state.status = 'planned';
    state.plannedAt = new Date().toISOString();
    state.approval = {
      status: 'pending',
      executionMode: state.approval?.executionMode || 'delegate'
    };
    delete state.verifiedAt;
    delete state.releasedAt;
    state.updatedAt = new Date().toISOString();
    await writeJson(statePath, state);
  }

  await Promise.all([
    removePath(getReportCardPath(repoRoot, changeId)),
    removePath(getIntentPrBriefPath(repoRoot, changeId))
  ]);

  return {
    changeId,
    manifestPath: getTaskManifestPath(repoRoot, changeId),
    taskCount: manifest.tasks.length,
    source: manifest.metadata.source
  };
}

module.exports = {
  runPlan
};
