/**
 * [INPUT]: 依赖 scripts/verify-artifacts.js 导出的 runVerifyArtifacts 和临时 change fixture。
 * [OUTPUT]: 验证 verify:artifacts 只实现 C1-C10，返回稳定 exit code 和 JSON 报告。
 * [POS]: REQ-003-minimize-workflow-artifacts T016 的 Red/Green 证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { runVerifyArtifacts } = require('../../../scripts/verify-artifacts');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const VERIFY_SCRIPT = path.join(REPO_ROOT, 'scripts', 'verify-artifacts.js');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function tasksMarkdown({ profile = 'standard', taskCount = 1, extraBody = '' } = {}) {
  const contract = [
    '# Tasks',
    '',
    '## Contract Summary',
    '',
    'Change: REQ-900-valid-artifacts',
    'Mode: plan',
    `Profile: ${profile}`,
    'Approval: approved',
    '',
    'Goal:',
    '- Keep artifact verification deterministic.',
    '',
    'Do Not Do:',
    '- Do not add checks outside C1-C10.',
    '',
    'Approved Direction:',
    '- Verify the minimized artifact shape.',
    '',
    'Acceptance:',
    '- The verifier returns stable rule ids and exit codes.',
    '',
    'Verification:',
    '',
    '```bash',
    'npm run verify:artifacts',
    '```',
    '',
    'Risk / Escalate If:',
    '- The rule table drifts from C1-C10.',
    ''
  ];
  const tasks = Array.from({ length: taskCount }, (_, index) => [
    `- [ ] T${String(index + 1).padStart(3, '0')} validate artifacts`,
    '  Goal: Exercise one verifier rule.',
    '  Files: `scripts/verify-artifacts.js`',
    '  Verification: npm run verify:artifacts',
    `  Vertical slice: Slice ${index + 1}`,
    ''
  ].join('\n'));
  return [...contract, extraBody, '## Phase 1', '', ...tasks].join('\n');
}

function seedValidChange(repoRoot, options = {}) {
  const changeKey = options.changeKey || 'REQ-900-valid-artifacts';
  const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
  const planningDir = path.join(changeDir, 'planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, 'tasks.md'), tasksMarkdown(options));
  writeJson(path.join(planningDir, 'task-manifest.json'), {
    changeId: changeKey,
    createdAt: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
    currentTaskId: null,
    tasks: [],
    metadata: {
      source: 'tasks.md',
      generatedBy: 'cc-devflow task-contract',
      planVersion: 1
    }
  });
  writeJson(path.join(changeDir, 'change-meta.json'), {
    changeId: changeKey,
    requirementId: changeKey,
    goal: ['Verify artifacts'],
    acceptance: ['Verifier passes'],
    specReference: {
      source: 'planning/tasks.md#contract-summary',
      change: changeKey,
      mode: 'plan',
      profile: options.profile || 'standard',
      approval: 'approved'
    },
    _meta: {
      generatedBy: 'cc-devflow task-contract',
      generatedAt: '2026-05-12T00:00:00.000Z'
    }
  });
  return { changeDir, planningDir, changeKey };
}

describe('verify:artifacts', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-verify-artifacts-'));
    writeJson(path.join(repoRoot, 'package.json'), {
      name: 'verify-artifacts-fixture',
      version: '0.0.0',
      scripts: {
        'verify:artifacts': 'node scripts/verify-artifacts.js'
      }
    });
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  const ruleCases = [
    ['C1', 2, (ctx) => fs.writeFileSync(path.join(ctx.planningDir, 'design.md'), '# legacy design\n')],
    ['C2', 2, (ctx) => fs.writeFileSync(path.join(ctx.planningDir, 'analysis.md'), '# legacy analysis\n')],
    ['C3', 2, (ctx) => {
      const reviewDir = path.join(ctx.changeDir, 'review');
      fs.mkdirSync(reviewDir, { recursive: true });
      fs.writeFileSync(path.join(reviewDir, 'cc-review-report.md'), '# legacy review\n');
    }],
    ['C4', 3, (ctx) => fs.writeFileSync(path.join(ctx.planningDir, 'tasks.md'), '# Tasks\n\n- [ ] T001 no contract\n')],
    ['C5', 3, (ctx) => writeJson(path.join(ctx.planningDir, 'task-manifest.json'), {
      changeId: ctx.changeKey,
      createdAt: '2026-05-12T00:00:00.000Z',
      updatedAt: '2026-05-12T00:00:00.000Z',
      currentTaskId: null,
      tasks: [],
      metadata: { source: 'tasks.md', generatedBy: 'manual', planVersion: 1 }
    })],
    ['C6', 3, (ctx) => writeJson(path.join(ctx.changeDir, 'change-meta.json'), {
      _meta: { generatedBy: 'manual' }
    })],
    ['C7', 4, (ctx) => fs.writeFileSync(path.join(ctx.planningDir, 'tasks.md'), tasksMarkdown({
      profile: 'tiny',
      taskCount: 2
    }))],
    ['C8', 5, (ctx) => {
      const reviewDir = path.join(ctx.changeDir, 'review');
      fs.mkdirSync(reviewDir, { recursive: true });
      fs.writeFileSync(path.join(reviewDir, 'review-ledger.jsonl'), '{"event":"review-started"}\n');
    }],
    ['C9', 5, (ctx) => {
      const reviewDir = path.join(ctx.changeDir, 'review');
      fs.mkdirSync(reviewDir, { recursive: true });
      fs.writeFileSync(path.join(reviewDir, 'report-card.json'), '{"overall":"pass"}\n');
    }],
    ['C10', 6, (ctx) => fs.writeFileSync(path.join(ctx.planningDir, 'tasks.md'), tasksMarkdown({
      profile: 'standard',
      extraBody: 'x'.repeat(12000)
    }))]
  ];

  test.each(ruleCases)('%s returns exit code %i with JSON report', async (ruleId, exitCode, mutate) => {
    const ctx = seedValidChange(repoRoot, { changeKey: `REQ-9${ruleId.slice(1).padStart(2, '0')}-${ruleId.toLowerCase()}` });
    mutate(ctx);

    const result = await runVerifyArtifacts(repoRoot);

    expect(result.code).toBe(exitCode);
    expect(result.violations[0]).toMatchObject({ ruleId, exitCode });
    expect(result.checks).toHaveLength(10);
  });

  test('passes a valid generated change and skips grandfathered legacy directories', async () => {
    seedValidChange(repoRoot);
    const legacy = seedValidChange(repoRoot, { changeKey: 'REQ-001-legacy-fallback' });
    fs.writeFileSync(path.join(legacy.planningDir, 'design.md'), '# grandfathered design\n');
    const manifest = JSON.parse(fs.readFileSync(path.join(legacy.planningDir, 'task-manifest.json'), 'utf8'));
    manifest.metadata.generatedBy = 'skill:cc-plan';
    fs.writeFileSync(path.join(legacy.planningDir, 'task-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

    const result = await runVerifyArtifacts(repoRoot);

    expect(result).toMatchObject({ code: 0, ok: true });
    expect(result.skippedLegacy.map((item) => item.changeKey)).toContain('REQ-001-legacy-fallback');
  });

  test('CLI prints stdout JSON and exits with the first violation code', () => {
    const ctx = seedValidChange(repoRoot);
    fs.writeFileSync(path.join(ctx.planningDir, 'design.md'), '# rogue design\n');

    const result = spawnSync(process.execPath, [VERIFY_SCRIPT, repoRoot], { encoding: 'utf8' });
    const report = JSON.parse(result.stdout);

    expect(result.status).toBe(2);
    expect(report.violations[0].ruleId).toBe('C1');
  });

  test('package.json exposes npm run verify:artifacts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['verify:artifacts']).toBe('node scripts/verify-artifacts.js');
  });
});
