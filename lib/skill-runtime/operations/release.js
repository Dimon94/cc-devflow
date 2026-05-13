/**
 * [INPUT]: 依赖 report-card 与 task-manifest 的最终状态。
 * [OUTPUT]: 在 handoff/pr-brief.md 内刷新 release notes，并更新 change-state 为 released。
 * [POS]: skill runtime 发布收尾入口，供内部收尾链路复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  readJson,
  writeJson,
  getReportCardPath,
  getTaskManifestPath,
  getRuntimeStatePath
} = require('../store');
const { parseReportCard, parseManifest } = require('../schemas');
const { syncIntentMemory, syncIntentPrBrief } = require('../intent');
const { assertShipReady } = require('../readiness');

async function runRelease({ repoRoot, changeId }) {
  const reportPath = getReportCardPath(repoRoot, changeId);
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const statePath = getRuntimeStatePath(repoRoot, changeId);

  const report = parseReportCard(await readJson(reportPath));
  const manifest = parseManifest(await readJson(manifestPath));
  const previousState = await readJson(statePath, null);

  assertShipReady(report, {
    reportPath,
    errorName: 'ReleaseReadinessError',
    rescueAction: 'run cc-check until ship-readiness is ready before release'
  });

  const prepared = await syncIntentPrBrief(repoRoot, changeId);
  await writeJson(statePath, {
    ...(previousState || {}),
    changeId,
    changeKey: previousState?.changeKey,
    slug: previousState?.slug,
    createdAt: previousState?.createdAt,
    goal: manifest.goal || previousState?.goal,
    status: 'released',
    initializedAt: previousState?.initializedAt || nowIso(),
    plannedAt: previousState?.plannedAt,
    verifiedAt: previousState?.verifiedAt,
    approval: previousState?.approval,
    releasedAt: nowIso(),
    updatedAt: nowIso()
  });
  await syncIntentMemory(repoRoot, changeId);

  return {
    changeId,
    prBriefPath: prepared.prBriefPath,
    status: 'released'
  };
}

module.exports = {
  runRelease
};
