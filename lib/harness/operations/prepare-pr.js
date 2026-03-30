/**
 * [INPUT]: 依赖 intent 的 PR brief 生成能力，接收 repoRoot 与 changeId。
 * [OUTPUT]: 生成 `devflow/intent/<goal>/artifacts/pr-brief.md`，并同步 decision-log / resume-index。
 * [POS]: harness 的 PR-ready 收尾入口，被 autopilot 与 CLI 复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { syncIntentMemory, syncIntentPrBrief } = require('../intent');

async function runPreparePr({ repoRoot, changeId }) {
  const prepared = await syncIntentPrBrief(repoRoot, changeId);

  await syncIntentMemory(repoRoot, changeId, {
    event: 'prepare_pr_completed',
    reason: 'PR-ready brief generated from manifest, verify report, and task results'
  });

  return {
    changeId,
    prBriefPath: prepared.prBriefPath,
    suggestedTitle: prepared.suggestedTitle,
    status: 'prepared'
  };
}

module.exports = {
  runPreparePr
};
