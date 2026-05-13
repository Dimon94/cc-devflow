/**
 * [INPUT]: 依赖 scripts/benchmark-artifacts.js 导出的 runBenchmarkArtifacts 和临时 artifact fixture。
 * [OUTPUT]: 验证 benchmark:artifacts 使用 ceil(len/4) 估算并报告 profile 阈值 savings。
 * [POS]: REQ-003-minimize-workflow-artifacts T017 的 Red/Green 证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { runBenchmarkArtifacts } = require('../../../scripts/benchmark-artifacts');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const BENCHMARK_SCRIPT = path.join(REPO_ROOT, 'scripts', 'benchmark-artifacts.js');

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function contractTasks({ changeKey, profile = 'standard', filler = '' }) {
  return [
    '# Tasks',
    '',
    '## Contract Summary',
    '',
    `Change: ${changeKey}`,
    'Mode: plan',
    `Profile: ${profile}`,
    'Approval: approved',
    '',
    'Goal:',
    '- Minimize workflow artifacts.',
    '',
    'Do Not Do:',
    '- Do not change token estimator math.',
    '',
    'Approved Direction:',
    '- Use tasks.md plus generated JSON records.',
    '',
    'Acceptance:',
    '- Benchmark savings stay above threshold.',
    '',
    'Verification:',
    '',
    '```bash',
    'npm run benchmark:artifacts',
    '```',
    '',
    'Risk / Escalate If:',
    '- Savings fall below profile threshold.',
    '',
    filler,
    '## Phase 1',
    '',
    '- [ ] T001 benchmark minimized artifact surface',
    '  Vertical slice: Slice 1',
    ''
  ].join('\n');
}

function seedLegacyBaseline(repoRoot, changeKey, size = 6000) {
  const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
  writeText(path.join(changeDir, 'planning', 'design.md'), `# Design\n\n${'d'.repeat(size)}\n`);
  writeText(path.join(changeDir, 'planning', 'analysis.md'), `# Analysis\n\n${'a'.repeat(size / 2)}\n`);
  writeText(path.join(changeDir, 'planning', 'tasks.md'), `# Tasks\n\n${'t'.repeat(size / 2)}\n`);
  writeJson(path.join(changeDir, 'planning', 'task-manifest.json'), { changeId: changeKey, tasks: [] });
  writeJson(path.join(changeDir, 'change-meta.json'), { changeId: changeKey, goal: ['legacy'] });
  writeJson(path.join(changeDir, 'review', 'report-card.json'), { overall: 'pass' });
}

function seedMinimizedChange(repoRoot, changeKey, options = {}) {
  const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
  writeText(path.join(changeDir, 'planning', 'tasks.md'), contractTasks({ changeKey, ...options }));
  writeJson(path.join(changeDir, 'planning', 'task-manifest.json'), {
    changeId: changeKey,
    metadata: { source: 'tasks.md', generatedBy: 'cc-devflow task-contract', planVersion: 1 },
    tasks: []
  });
  writeJson(path.join(changeDir, 'change-meta.json'), {
    changeId: changeKey,
    _meta: { generatedBy: 'cc-devflow task-contract' }
  });
  writeJson(path.join(changeDir, 'review', 'review-ledger.jsonl'), { note: 'counted as text by benchmark' });
  writeJson(path.join(changeDir, 'review', 'review-findings.json'), { findings: [] });
  writeJson(path.join(changeDir, 'review', 'report-card.json'), { overall: 'pass' });
}

describe('benchmark:artifacts', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-benchmark-artifacts-'));
    seedLegacyBaseline(repoRoot, 'REQ-001-legacy-baseline');
    seedLegacyBaseline(repoRoot, 'REQ-002-legacy-baseline');
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('reports standard savings >= 30% for REQ-003-example', () => {
    seedMinimizedChange(repoRoot, 'REQ-003-example', { profile: 'standard' });

    const result = runBenchmarkArtifacts(repoRoot);
    const row = result.rows.find((item) => item.changeKey === 'REQ-003-example');

    expect(result.code).toBe(0);
    expect(row).toMatchObject({
      profile: 'standard',
      threshold_pct: 30,
      correctness_pass: true
    });
    expect(row.savings_vs_baseline_pct).toBeGreaterThanOrEqual(30);
  });

  test('reports tiny savings >= 60% for tiny fixture', () => {
    seedMinimizedChange(repoRoot, 'REQ-004-tiny-example', { profile: 'tiny' });

    const result = runBenchmarkArtifacts(repoRoot);
    const row = result.rows.find((item) => item.changeKey === 'REQ-004-tiny-example');

    expect(result.code).toBe(0);
    expect(row).toMatchObject({
      profile: 'tiny',
      threshold_pct: 60,
      correctness_pass: true
    });
    expect(row.savings_vs_baseline_pct).toBeGreaterThanOrEqual(60);
  });

  test('exits 1 when savings are below the profile threshold', () => {
    seedMinimizedChange(repoRoot, 'REQ-005-bloated-example', {
      profile: 'standard',
      filler: 'x'.repeat(20000)
    });

    const result = runBenchmarkArtifacts(repoRoot);

    expect(result.code).toBe(1);
    expect(result.rows[0]).toMatchObject({ correctness_pass: false });
  });

  test('CLI prints stdout JSON array', () => {
    seedMinimizedChange(repoRoot, 'REQ-003-example', { profile: 'standard' });

    const result = spawnSync(process.execPath, [BENCHMARK_SCRIPT, repoRoot], { encoding: 'utf8' });
    const rows = JSON.parse(result.stdout);

    expect(result.status).toBe(0);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0]).toHaveProperty('savings_vs_baseline_pct');
  });

  test('package.json exposes npm run benchmark:artifacts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['benchmark:artifacts']).toBe('node scripts/benchmark-artifacts.js');
  });
});
