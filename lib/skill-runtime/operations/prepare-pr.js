/**
 * [INPUT]: 依赖 intent 的 PR brief 生成能力，接收 repoRoot 与 changeId。
 * [OUTPUT]: 生成 `devflow/changes/<goal>/handoff/pr-brief.md`，并清理冲突 handoff 文件。
 * [POS]: skill runtime 的 PR-ready 收尾入口，被 autopilot 与内部收尾链路复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { getIntentPrBriefPath } = require('../artifacts');
const { syncIntentMemory, syncIntentPrBrief } = require('../intent');

async function runPreparePr({ repoRoot, changeId }) {
  const prepared = await syncIntentPrBrief(repoRoot, changeId);
  await syncIntentMemory(repoRoot, changeId);

  return {
    changeId,
    prBriefPath: prepared.prBriefPath || getIntentPrBriefPath(repoRoot, changeId),
    suggestedTitle: prepared.suggestedTitle,
    status: 'prepared'
  };
}

module.exports = {
  runPreparePr
};
