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
  exists,
  getReportCardPath,
  getTaskManifestPath,
  getReleaseNotePath,
  getHarnessStatePath
} = require('../store');
const { parseReportCard, parseManifest } = require('../schemas');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs').promises;

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

  // v4.3: 合并 Delta specs 到项目级 specs/
  const reqDir = path.join(repoRoot, 'devflow', 'requirements', changeId);
  const deltaSpecsDir = path.join(reqDir, 'specs');
  const projectSpecsDir = path.join(repoRoot, 'devflow', 'specs');
  const hasDeltaSpecs = await exists(deltaSpecsDir);

  if (hasDeltaSpecs) {
    console.log(`[v4.3] Merging Delta specs to project-level specs/...`);

    try {
      // 遍历所有 Delta spec.md 文件
      const modules = await fs.readdir(deltaSpecsDir);
      const mergeResults = [];

      for (const module of modules) {
        const deltaSpecPath = path.join(deltaSpecsDir, module, 'spec.md');
        const projectSpecPath = path.join(projectSpecsDir, module, 'spec.md');

        if (!(await exists(deltaSpecPath))) {
          console.warn(`[v4.3] WARNING: Delta spec not found: ${deltaSpecPath}`);
          continue;
        }

        if (!(await exists(projectSpecPath))) {
          console.warn(`[v4.3] WARNING: Project spec not found: ${projectSpecPath}`);
          console.log(`[v4.3] Creating new project spec for module: ${module}`);

          // 如果项目级 spec 不存在，创建目录并复制 Delta 作为初始版本
          await fs.mkdir(path.dirname(projectSpecPath), { recursive: true });
          await fs.copyFile(deltaSpecPath, projectSpecPath);

          mergeResults.push({ module, status: 'created', newVersion: '1.0.0' });
          continue;
        }

        // 调用 delta-parser.ts merge 命令
        const deltaParserPath = path.join(repoRoot, '.claude', 'scripts', 'delta-parser.ts');

        try {
          const output = execSync(
            `npx ts-node "${deltaParserPath}" merge "${projectSpecPath}" "${deltaSpecPath}"`,
            { cwd: repoRoot, encoding: 'utf-8' }
          );

          // 解析输出获取新版本号
          const versionMatch = output.match(/New version: ([\d.]+)/);
          const newVersion = versionMatch ? versionMatch[1] : 'unknown';

          mergeResults.push({ module, status: 'merged', newVersion });
          console.log(`[v4.3] ✅ Merged ${module}: ${newVersion}`);
        } catch (mergeError) {
          console.error(`[v4.3] ❌ Failed to merge ${module}:`, mergeError.message);
          mergeResults.push({ module, status: 'failed', error: mergeError.message });
        }
      }

      // 记录合并结果到 RELEASE_NOTE
      const mergeReport = mergeResults
        .map(r => {
          if (r.status === 'merged') {
            return `- ✅ ${r.module}: merged to v${r.newVersion}`;
          } else if (r.status === 'created') {
            return `- 🆕 ${r.module}: created v${r.newVersion}`;
          } else {
            return `- ❌ ${r.module}: ${r.error}`;
          }
        })
        .join('\n');

      console.log(`[v4.3] Delta merge summary:\n${mergeReport}`);

      // 将合并结果添加到 release note
      manifest.metadata = manifest.metadata || {};
      manifest.metadata.deltaMergeResults = mergeResults;

    } catch (error) {
      console.error(`[v4.3] ERROR during Delta merge:`, error);
      throw new Error(`Delta merge failed: ${error.message}`);
    }
  } else {
    console.log(`[v4.3] No Delta specs found, skipping merge.`);
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
