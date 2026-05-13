/**
 * [INPUT]: 依赖 scripts/benchmark-skills.js 导出的 runBenchmarkSkills 和临时 skill fixture。
 * [OUTPUT]: 验证 benchmark:skills 对 SKILL.md 入口体积执行 byte/line 预算。
 * [POS]: skill 入口瘦身基准的 Red/Green 证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { runBenchmarkSkills } = require('../../../scripts/benchmark-skills');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const BENCHMARK_SCRIPT = path.join(REPO_ROOT, 'scripts', 'benchmark-skills.js');

function writeSkill(repoRoot, skillName, body) {
  const filePath = path.join(repoRoot, '.claude', 'skills', skillName, 'SKILL.md');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body);
}

function skillBody({ version = '1.0.0', filler = '' } = {}) {
  return [
    '---',
    'name: cc-plan',
    `version: ${version}`,
    'description: fixture',
    '---',
    '',
    '# Fixture',
    '',
    'Thin entrypoint.',
    filler
  ].join('\n');
}

function investigateSkillBody({ filler = '' } = {}) {
  return skillBody().replace('name: cc-plan', 'name: cc-investigate') + filler;
}

describe('benchmark:skills', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-benchmark-skills-'));
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('passes when cc-plan stays under the thin entrypoint budget', () => {
    writeSkill(repoRoot, 'cc-plan', skillBody());

    const result = runBenchmarkSkills(repoRoot);

    expect(result.code).toBe(0);
    expect(result.rows[0]).toMatchObject({
      skill: 'cc-plan',
      max_bytes: 16000,
      max_lines: 360,
      correctness_pass: true
    });
  });

  test('passes when cc-investigate stays under the thin entrypoint budget', () => {
    writeSkill(repoRoot, 'cc-investigate', investigateSkillBody());

    const result = runBenchmarkSkills(repoRoot);

    expect(result.rows[0]).toMatchObject({
      skill: 'cc-investigate',
      max_bytes: 16000,
      max_lines: 360,
      correctness_pass: true
    });
  });

  test('exits 1 when cc-plan grows past the byte budget', () => {
    writeSkill(repoRoot, 'cc-plan', skillBody({ filler: 'x'.repeat(17000) }));

    const result = runBenchmarkSkills(repoRoot);

    expect(result.code).toBe(1);
    expect(result.rows[0]).toMatchObject({
      skill: 'cc-plan',
      correctness_pass: false,
      note: 'skill entrypoint exceeds context budget'
    });
  });

  test('CLI prints stdout JSON array', () => {
    writeSkill(repoRoot, 'cc-plan', skillBody());

    const result = spawnSync(process.execPath, [BENCHMARK_SCRIPT, repoRoot], { encoding: 'utf8' });
    const rows = JSON.parse(result.stdout);

    expect(result.status).toBe(0);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0]).toHaveProperty('estimated_tokens');
  });

  test('package.json exposes npm run benchmark:skills', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['benchmark:skills']).toBe('node scripts/benchmark-skills.js');
  });
});
