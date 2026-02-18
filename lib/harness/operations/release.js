/**
 * [INPUT]: 依赖 report-card 与 task-manifest 的最终状态。
 * [OUTPUT]: 在 requirement 目录生成 RELEASE_NOTE.md，并更新 harness-state 为 released。
 * [POS]: harness 发布收尾入口，被 CLI `harness:release` 调用。
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
  getHarnessStatePath
} = require('../store');
const { parseReportCard, parseManifest } = require('../schemas');

function formatReleaseNote({ changeId, manifest, report }) {
  const passedTasks = manifest.tasks.filter((task) => task.status === 'passed');
  const failedTasks = manifest.tasks.filter((task) => task.status === 'failed');

  return [
    `# Release Note - ${changeId}`,
    '',
    `- Released At: ${nowIso()}`,
    `- Verification: ${report.overall.toUpperCase()}`,
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
  const statePath = getHarnessStatePath(repoRoot, changeId);

  const report = parseReportCard(await readJson(reportPath));
  const manifest = parseManifest(await readJson(manifestPath));

  if (report.overall !== 'pass') {
    throw new Error('Release blocked: report-card overall is not pass');
  }

  const note = formatReleaseNote({ changeId, manifest, report });
  const releaseNotePath = getReleaseNotePath(repoRoot, changeId);

  await writeText(releaseNotePath, note);
  await writeJson(statePath, {
    changeId,
    goal: manifest.goal,
    status: 'released',
    releasedAt: nowIso(),
    updatedAt: nowIso()
  });

  return {
    changeId,
    releaseNotePath,
    status: 'released'
  };
}

module.exports = {
  runRelease
};
