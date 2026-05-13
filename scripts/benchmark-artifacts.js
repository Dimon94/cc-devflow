#!/usr/bin/env node

/**
 * [INPUT]: 接收 repo root，读取 devflow/changes 的 legacy baseline 与 minimized candidate artifacts。
 * [OUTPUT]: 输出每个 minimized change 的 token savings JSON row；低于 profile 阈值时 exit 1。
 * [POS]: REQ-003 benchmark:artifacts 入口；量化 artifact minimization 是否继续成立。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

const BASELINE_PREFIXES = ['REQ-001-', 'REQ-002-'];
const PROFILE_THRESHOLDS = {
  tiny: 60,
  standard: 30,
  deep: 30
};
const LEGACY_FILES = [
  'planning/design.md',
  'planning/analysis.md',
  'planning/tasks.md',
  'planning/task-manifest.json',
  'change-meta.json',
  'review/cc-review-plan.md',
  'review/cc-review-report.md',
  'review/cc-review-ledger.jsonl',
  'review/cc-review-findings.json',
  'review/report-card.json'
];
const MINIMIZED_FILES = [
  'planning/tasks.md',
  'planning/task-manifest.json',
  'change-meta.json',
  'review/review-ledger.jsonl',
  'review/review-findings.json',
  'review/report-card.json'
];

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function fileTokens(changeDir, relativePaths) {
  return relativePaths.reduce((total, relativePath) => (
    total + estimateTokens(readText(path.join(changeDir, relativePath)))
  ), 0);
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

function hasFile(changeDir, relativePath) {
  const filePath = path.join(changeDir, relativePath);
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function hasLegacyDefault(changeDir) {
  return [
    'planning/design.md',
    'planning/analysis.md',
    'review/cc-review-plan.md',
    'review/cc-review-report.md'
  ].some((relativePath) => hasFile(changeDir, relativePath));
}

function hasContractSummary(changeDir) {
  return /^## Contract Summary\b/m.test(readText(path.join(changeDir, 'planning', 'tasks.md')));
}

function profileFor(changeDir) {
  const match = readText(path.join(changeDir, 'planning', 'tasks.md')).match(/^Profile:\s*([a-z]+)\s*$/mi);
  return match ? match[1].toLowerCase() : 'standard';
}

function average(values) {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function pctSavings(candidateTokens, baselineTokens) {
  if (!baselineTokens || baselineTokens <= 0) {
    return null;
  }
  return Math.round(((baselineTokens - candidateTokens) / baselineTokens) * 1000) / 10;
}

function baselineRows(rootDir, changeKeys) {
  return changeKeys
    .filter((changeKey) => BASELINE_PREFIXES.some((prefix) => changeKey.startsWith(prefix)))
    .map((changeKey) => {
      const changeDir = path.join(rootDir, 'devflow', 'changes', changeKey);
      return {
        changeKey,
        tokens: fileTokens(changeDir, LEGACY_FILES)
      };
    })
    .filter((row) => row.tokens > 0);
}

function candidateRows(rootDir, changeKeys) {
  return changeKeys
    .map((changeKey) => ({
      changeKey,
      changeDir: path.join(rootDir, 'devflow', 'changes', changeKey)
    }))
    .filter(({ changeDir }) => !hasLegacyDefault(changeDir) && hasContractSummary(changeDir))
    .map(({ changeKey, changeDir }) => ({
      changeKey,
      profile: profileFor(changeDir),
      tokens: fileTokens(changeDir, MINIMIZED_FILES)
    }))
    .filter((row) => row.tokens > 0);
}

function benchmarkRows(rootDir) {
  const changeKeys = listChangeKeys(rootDir);
  const baselines = baselineRows(rootDir, changeKeys);
  const baselineTokens = average(baselines.map((row) => row.tokens));

  return candidateRows(rootDir, changeKeys).map((candidate) => {
    const threshold = PROFILE_THRESHOLDS[candidate.profile] ?? PROFILE_THRESHOLDS.standard;
    const savings = pctSavings(candidate.tokens, baselineTokens);
    const correctness = savings === null || savings >= threshold;

    return {
      changeKey: candidate.changeKey,
      profile: candidate.profile,
      candidate_tokens: candidate.tokens,
      baseline_tokens: baselineTokens,
      baseline_change_count: baselines.length,
      savings_vs_baseline_pct: savings,
      threshold_pct: threshold,
      correctness_pass: correctness,
      note: baselineTokens === null ? 'no baseline changes found' : ''
    };
  });
}

function runBenchmarkArtifacts(rootDir = process.cwd()) {
  const rows = benchmarkRows(path.resolve(rootDir));
  return {
    code: rows.some((row) => row.correctness_pass === false) ? 1 : 0,
    rows
  };
}

function main(argv = process.argv.slice(2)) {
  const rootDir = argv[0] || process.cwd();
  const result = runBenchmarkArtifacts(rootDir);
  process.stdout.write(`${JSON.stringify(result.rows, null, 2)}\n`);
  process.exit(result.code);
}

if (require.main === module) {
  main();
}

module.exports = {
  estimateTokens,
  runBenchmarkArtifacts
};
