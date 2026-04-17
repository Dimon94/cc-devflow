/**
 * [INPUT]: 依赖 report-card 与 task-manifest 的最终状态。
 * [OUTPUT]: 在 handoff 目录生成 release-note.md，并更新 change-state 为 released。
 * [POS]: skill runtime 发布收尾入口，供内部收尾链路复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  readJson,
  writeText,
  writeJson,
  getReportCardPath,
  getTaskManifestPath,
  getReleaseNotePath,
  getRuntimeStatePath
} = require('../store');
const { parseReportCard, parseManifest } = require('../schemas');
const { syncIntentMemory } = require('../intent');

function formatReleaseNote({ changeId, manifest, report }) {
  const passedTasks = manifest.tasks.filter((task) => task.status === 'passed');
  const failedTasks = manifest.tasks.filter((task) => task.status === 'failed');

  return [
    `# Release Note - ${changeId}`,
    '',
    `- Released At: ${nowIso()}`,
    `- Verdict: ${(report.verdict || report.overall).toUpperCase()}`,
    `- Verification: ${report.overall.toUpperCase()}`,
    `- Review: ${(report.review?.status || 'skipped').toUpperCase()}`,
    '',
    '## Task Summary',
    '',
    `- Passed: ${passedTasks.length}`,
    `- Failed: ${failedTasks.length}`,
    '',
    '## Completed Tasks',
    '',
    ...(passedTasks.length > 0
      ? passedTasks.map((task) => `- ${task.id}: ${task.title}`)
      : ['- (none)']),
    '',
    '## Blocking Findings',
    '',
    ...(report.blockingFindings.length > 0
      ? report.blockingFindings.map((item) => `- ${item}`)
      : ['- None']),
    ''
  ].join('\n');
}

async function runRelease({ repoRoot, changeId }) {
  const reportPath = getReportCardPath(repoRoot, changeId);
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const statePath = getRuntimeStatePath(repoRoot, changeId);

  const report = parseReportCard(await readJson(reportPath));
  const manifest = parseManifest(await readJson(manifestPath));
  const previousState = await readJson(statePath, null);

  if (report.overall !== 'pass') {
    throw new Error('Release blocked: report-card overall is not pass');
  }

  const note = formatReleaseNote({ changeId, manifest, report });
  const releaseNotePath = getReleaseNotePath(repoRoot, changeId);

  await writeText(releaseNotePath, note);
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
    releaseNotePath,
    status: 'released'
  };
}

module.exports = {
  runRelease
};
