#!/usr/bin/env node

/**
 * [INPUT]: 接收 repo root，扫描 devflow/changes 下的 change artifact 目录。
 * [OUTPUT]: 输出 C1-C10 artifact gate JSON 报告，并以首个违规规则的 exit code 退出。
 * [POS]: REQ-003 verify:artifacts 仓库级入口，复用 task-contract validate 的规则真相。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

const { runValidate } = require('../lib/skill-runtime/operations/task-contract');

const CHECKS = [
  ['C1', 2],
  ['C2', 2],
  ['C3', 2],
  ['C4', 3],
  ['C5', 3],
  ['C6', 3],
  ['C7', 4],
  ['C8', 5],
  ['C9', 5],
  ['C10', 6]
].map(([ruleId, exitCode]) => ({ ruleId, exitCode }));

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function listChangeKeys(rootDir) {
  const changesDir = path.join(rootDir, 'devflow', 'changes');
  if (!fs.existsSync(changesDir)) {
    return [];
  }

  return fs.readdirSync(changesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^(REQ|FIX)-\d+/.test(name))
    .sort();
}

function changeIdFromKey(changeKey) {
  const match = String(changeKey || '').match(/^(REQ|FIX)-\d+/);
  return match ? match[0] : changeKey;
}

function hasLegacyArtifact(changeDir) {
  return [
    'planning/design.md',
    'planning/analysis.md',
    'review/cc-review-report.md',
    'review/cc-review-plan.md'
  ].some((relPath) => fileExists(path.join(changeDir, relPath)));
}

function shouldSkipLegacy(changeDir) {
  if (!hasLegacyArtifact(changeDir)) {
    return false;
  }

  const manifest = readJsonSafe(path.join(changeDir, 'planning', 'task-manifest.json'));
  return manifest?.metadata?.generatedBy !== 'cc-devflow task-contract';
}

function violationChecks(violations) {
  const failed = new Set(violations.map((violation) => violation.ruleId));
  return CHECKS.map((check) => ({
    ...check,
    status: failed.has(check.ruleId) ? 'fail' : 'pass'
  }));
}

async function runVerifyArtifacts(rootDir = process.cwd()) {
  const repoRoot = path.resolve(rootDir);
  const violations = [];
  const checkedChanges = [];
  const skippedLegacy = [];

  for (const changeKey of listChangeKeys(repoRoot)) {
    const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
    if (shouldSkipLegacy(changeDir)) {
      skippedLegacy.push({
        changeKey,
        reason: 'grandfathered legacy artifacts'
      });
      continue;
    }

    const result = await runValidate({
      repoRoot,
      changeId: changeIdFromKey(changeKey),
      changeKey
    });
    checkedChanges.push(changeKey);
    violations.push(...(result.violations || []).map((violation) => ({
      ...violation,
      changeKey
    })));
  }

  const first = violations[0] || null;
  return {
    ok: violations.length === 0,
    code: first ? first.exitCode : 0,
    checks: violationChecks(violations),
    checkedChanges,
    skippedLegacy,
    violations
  };
}

async function main(argv = process.argv.slice(2)) {
  const rootDir = argv[0] || process.cwd();
  const report = await runVerifyArtifacts(rootDir);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(report.code);
}

if (require.main === module) {
  main().catch((error) => {
    const report = {
      ok: false,
      code: 1,
      checks: CHECKS.map((check) => ({ ...check, status: 'blocked' })),
      checkedChanges: [],
      skippedLegacy: [],
      violations: [{
        ruleId: 'runtime',
        exitCode: 1,
        message: error.message
      }]
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(1);
  });
}

module.exports = {
  CHECKS,
  runVerifyArtifacts
};
