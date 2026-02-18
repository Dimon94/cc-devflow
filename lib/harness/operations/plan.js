/**
 * [INPUT]: 依赖 planner.createTaskManifest，接收 changeId/goal/overwrite 参数。
 * [OUTPUT]: 生成并返回已校验的 task-manifest.json 摘要。
 * [POS]: harness Stage-3 计划生成入口，被 CLI `harness:plan` 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { createTaskManifest } = require('../planner');
const { getTaskManifestPath } = require('../store');

async function runPlan({ repoRoot, changeId, goal, overwrite }) {
  const manifest = await createTaskManifest({
    repoRoot,
    changeId,
    goal,
    overwrite
  });

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
