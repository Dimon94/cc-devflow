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
  getReportCardPath
} = require('../store');
const { parseManifest, parseReportCard } = require('../schemas');

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

async function runReviewGate({ repoRoot, strict, skipReview }) {
  if (!strict) {
    return {
      status: 'skipped',
      details: 'Strict mode disabled'
    };
  }

  if (skipReview) {
    return {
      status: 'skipped',
      details: 'Skipped by --skip-review'
    };
  }

  const hasCodex = await runCommand('command -v codex', { cwd: repoRoot });
  if (hasCodex.code !== 0) {
    return {
      status: 'fail',
      details: 'codex binary not found; rerun with --skip-review if intentional'
    };
  }

  const review = await runCommand('codex review --base main', {
    cwd: repoRoot,
    timeoutMs: 30 * 60 * 1000
  });

  if (review.code !== 0) {
    return {
      status: 'fail',
      details: (review.stderr || review.stdout || 'codex review failed').trim().slice(0, 400)
    };
  }

  return {
    status: 'pass',
    details: 'codex review passed'
  };
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

  if (reviewGate.status === 'fail') {
    findings.push(`review: ${reviewGate.details}`);
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

  const review = await runReviewGate({ repoRoot, strict, skipReview });
  const blockingFindings = collectBlockingFindings(manifest, quickGates, strictGates, review);
  const hasFailures = blockingFindings.length > 0;

  const report = parseReportCard({
    changeId,
    overall: hasFailures ? 'fail' : 'pass',
    quickGates,
    strictGates,
    review,
    blockingFindings,
    timestamp: nowIso()
  });

  const outputPath = getReportCardPath(repoRoot, changeId);
  await writeJson(outputPath, report);

  return {
    changeId,
    outputPath,
    overall: report.overall,
    blockingFindings: report.blockingFindings
  };
}

module.exports = {
  runVerify
};
