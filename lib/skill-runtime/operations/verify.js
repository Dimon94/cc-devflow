/**
 * [INPUT]: 依赖 manifest 与 package scripts，依赖 shell gates（lint/typecheck/test/audit/review）。
 * [OUTPUT]: 生成 report-card.json，给出 quick/strict/review 门禁结论。
 * [POS]: skill runtime 质量门禁入口，供内部验证链路复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  getPackageScripts,
  readJson,
  writeJson,
  runCommand,
  getTaskManifestPath,
  getRuntimeStatePath,
  getReportCardPath
} = require('../store');
const { parseManifest, parseReportCard } = require('../schemas');
const { runReviewSuite } = require('../review');

const path = require('path');
const fs = require('fs');
const os = require('os');

const REQ_CHECK_DIR = path.join(__dirname, '..', '..', '..', '.claude', 'skills', 'cc-check');
const RUN_GATES_SCRIPT = path.join(REQ_CHECK_DIR, 'scripts', 'run-quality-gates.sh');
const RENDER_REPORT_SCRIPT = path.join(REQ_CHECK_DIR, 'scripts', 'render-report-card.js');

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

async function runGateCollection({ repoRoot, definitions }) {
  if (!definitions || definitions.length === 0) {
    return [];
  }

  const args = definitions
    .map((item) => `--gate ${shellEscape(`${item.name}::${item.command}`)}`)
    .join(' ');
  const result = await runCommand(`bash ${shellEscape(RUN_GATES_SCRIPT)} ${args}`, {
    cwd: repoRoot,
    timeoutMs: 20 * 60 * 1000
  });

  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || 'run-quality-gates.sh failed');
  }

  return JSON.parse(result.stdout || '[]');
}

async function renderReportCard({ repoRoot, changeId, manifestPath, quickGates, strictGates, review }) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-cc-check-'));
  const quickPath = path.join(tempDir, 'quick-gates.json');
  const strictPath = path.join(tempDir, 'strict-gates.json');
  const reviewPath = path.join(tempDir, 'review.json');

  try {
    fs.writeFileSync(quickPath, `${JSON.stringify(quickGates, null, 2)}\n`);
    fs.writeFileSync(strictPath, `${JSON.stringify(strictGates, null, 2)}\n`);
    fs.writeFileSync(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

    const command = [
      'node',
      shellEscape(RENDER_REPORT_SCRIPT),
      '--change-id',
      shellEscape(changeId),
      '--manifest',
      shellEscape(manifestPath),
      '--quick',
      shellEscape(quickPath),
      '--strict',
      shellEscape(strictPath),
      '--review',
      shellEscape(reviewPath),
      '--timestamp',
      shellEscape(nowIso())
    ].join(' ');

    const result = await runCommand(command, { cwd: repoRoot, timeoutMs: 20 * 60 * 1000 });
    if (result.code !== 0) {
      throw new Error(result.stderr || result.stdout || 'render-report-card.js failed');
    }

    return JSON.parse(result.stdout);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function runVerify({ repoRoot, changeId, strict = false, skipReview = false }) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const manifest = parseManifest(await readJson(manifestPath));
  const scripts = await getPackageScripts(repoRoot);

  const quickGates = await runGateCollection({
      repoRoot,
      definitions: ['lint', 'typecheck', 'test'].map((name) => ({
        name,
        command: scripts[name]
          ? `npm run ${name}`
          : `printf '__CC_DEVFLOW_SKIP__ Script ${name} is not defined\n'`
      }))
  });

  const strictGates = strict
    ? await runGateCollection({
      repoRoot,
      definitions: [
        {
          name: 'test:integration',
          command: scripts['test:integration']
            ? 'npm run test:integration'
            : "printf '__CC_DEVFLOW_SKIP__ Script test:integration is not defined\n'"
        },
        {
          name: 'audit',
          command: 'npm audit --audit-level=high'
        }
      ]
    })
    : [];

  const review = await runReviewSuite({
    repoRoot,
    changeId,
    manifest,
    strict,
    skipReview
  });
  const report = parseReportCard(
    await renderReportCard({
      repoRoot,
      changeId,
      manifestPath,
      quickGates,
      strictGates,
      review
    })
  );

  const outputPath = getReportCardPath(repoRoot, changeId);
  await writeJson(outputPath, report);

  // Update change-state.json with verifiedAt timestamp if passed
  if (report.verdict === 'pass') {
    const statePath = getRuntimeStatePath(repoRoot, changeId);
    const stateExists = require('fs').existsSync(statePath);
    if (stateExists) {
      const state = await readJson(statePath);
      state.status = 'verified';
      state.verifiedAt = nowIso();
      state.updatedAt = nowIso();
      await writeJson(statePath, state);
    }
  }

  return {
    changeId,
    outputPath,
    overall: report.overall,
    verdict: report.verdict || (report.overall === 'pass' ? 'pass' : 'fail'),
    blockingFindings: report.blockingFindings
  };
}

module.exports = {
  runVerify
};
