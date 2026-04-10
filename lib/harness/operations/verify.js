/**
 * [INPUT]: 依赖 manifest 与 package scripts，依赖 shell gates（lint/typecheck/test/audit/review）。
 * [OUTPUT]: 生成 report-card.json，给出 quick/strict/review 门禁结论。
 * [POS]: harness 质量门禁入口，被 CLI `harness:verify` 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  getPackageScripts,
  readJson,
  writeJson,
  runCommand,
  getTaskManifestPath,
  getHarnessStatePath,
  getReportCardPath
} = require('../store');
const { parseManifest, parseReportCard } = require('../schemas');
const { runReviewSuite, summarizeOpenReviewFindings } = require('../review');

async function runGate(command, cwd, timeoutMs = 20 * 60 * 1000) {
  const result = await runCommand(command, { cwd, timeoutMs });
  return {
    status: result.code === 0 ? 'pass' : 'fail',
    durationMs: result.durationMs,
    details: result.code === 0
      ? 'ok'
      : (result.stderr || result.stdout || 'command failed').trim().slice(0, 400)
  };
}

async function runNpmScriptGate(scripts, scriptName, repoRoot) {
  if (!scripts[scriptName]) {
    return {
      name: scriptName,
      command: `npm run ${scriptName}`,
      status: 'skipped',
      durationMs: 0,
      details: `Script ${scriptName} is not defined`
    };
  }

  const result = await runGate(`npm run ${scriptName}`, repoRoot);
  return {
    name: scriptName,
    command: `npm run ${scriptName}`,
    ...result
  };
}

function deriveVerdict(manifest, quickGates, strictGates, reviewGate) {
  if (manifest.tasks.some((task) => task.status === 'failed')) {
    return 'fail';
  }

  if ([...quickGates, ...strictGates].some((gate) => gate.status === 'fail')) {
    return 'fail';
  }

  if (reviewGate.status === 'blocked') {
    return 'blocked';
  }

  if (reviewGate.status === 'fail') {
    return 'fail';
  }

  return 'pass';
}

function deriveReroute(verdict) {
  if (verdict === 'pass') {
    return 'none';
  }

  return 'req-do';
}

function buildSummary({ quickGates, strictGates, reviewGate, verdict }) {
  const gateSummary = (gates) => `${gates.filter((gate) => gate.status === 'pass').length}/${gates.length}`;
  return [
    `verdict=${verdict}`,
    `quick=${gateSummary(quickGates)}`,
    `strict=${gateSummary(strictGates)}`,
    `review=${reviewGate.status}`
  ].join(' ');
}

function collectBlockingFindings(manifest, quickGates, strictGates, reviewGate) {
  const findings = [];

  for (const task of manifest.tasks) {
    if (task.status === 'failed') {
      findings.push(`${task.id}: ${task.lastError || 'task failed'}`);
    }
  }

  for (const gate of [...quickGates, ...strictGates]) {
    if (gate.status === 'fail') {
      findings.push(`${gate.name}: ${gate.details}`);
    }
  }

  if (reviewGate.status === 'blocked' || reviewGate.status === 'fail') {
    findings.push(`review: ${reviewGate.summary || reviewGate.details || reviewGate.status}`);
  }

  for (const finding of summarizeOpenReviewFindings(reviewGate.findings)) {
    findings.push(finding);
  }

  return findings;
}

async function runVerify({ repoRoot, changeId, strict = false, skipReview = false }) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const manifest = parseManifest(await readJson(manifestPath));
  const scripts = await getPackageScripts(repoRoot);

  const quickGateNames = ['lint', 'typecheck', 'test'];
  const quickGates = [];

  for (const name of quickGateNames) {
    quickGates.push(await runNpmScriptGate(scripts, name, repoRoot));
  }

  const strictGates = [];
  if (strict) {
    strictGates.push(await runNpmScriptGate(scripts, 'test:integration', repoRoot));

    const audit = await runGate('npm audit --audit-level=high', repoRoot, 20 * 60 * 1000);
    strictGates.push({
      name: 'audit',
      command: 'npm audit --audit-level=high',
      ...audit
    });
  }

  const review = await runReviewSuite({
    repoRoot,
    changeId,
    manifest,
    strict,
    skipReview
  });
  const blockingFindings = collectBlockingFindings(manifest, quickGates, strictGates, review);
  const verdict = deriveVerdict(manifest, quickGates, strictGates, review);
  const overall = verdict === 'pass' ? 'pass' : 'fail';
  const summary = buildSummary({
    quickGates,
    strictGates,
    reviewGate: review,
    verdict
  });

  const report = parseReportCard({
    changeId,
    verdict,
    overall,
    summary,
    quickGates,
    strictGates,
    review,
    blockingFindings,
    reroute: deriveReroute(verdict),
    timestamp: nowIso()
  });

  const outputPath = getReportCardPath(repoRoot, changeId);
  await writeJson(outputPath, report);

  // Update harness-state.json with verifiedAt timestamp if passed
  if (verdict === 'pass') {
    const statePath = getHarnessStatePath(repoRoot, changeId);
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
