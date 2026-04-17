/**
 * [INPUT]: 依赖 skill runtime operations 与临时仓库夹具。
 * [OUTPUT]: 验证 plan/do/check/act 共享运行时主链最小可运行性。
 * [POS]: test/skill-runtime 的集成测试入口，保障 skill-first 内核回归。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { runInit } = require('../../lib/skill-runtime/operations/init');
const { runPlanningSnapshot } = require('../../lib/skill-runtime/operations/snapshot');
const { runPlan } = require('../../lib/skill-runtime/operations/plan');
const { runApprove } = require('../../lib/skill-runtime/operations/approve');
const { runDispatch } = require('../../lib/skill-runtime/operations/dispatch');
const { runVerify } = require('../../lib/skill-runtime/operations/verify');
const { runRelease } = require('../../lib/skill-runtime/operations/release');
const {
  getTaskManifestPath,
  getReportCardPath,
  getReleaseNotePath,
  getTasksMarkdownPath,
  readJson,
  readText
} = require('../../lib/skill-runtime/store');
const { getChangePaths } = require('../../lib/skill-runtime/paths');

const WRITE_TASK_CHECKPOINT = path.resolve(
  __dirname,
  '../../.claude/skills/cc-do/scripts/write-task-checkpoint.sh'
);
const RECORD_REVIEW_DECISION = path.resolve(
  __dirname,
  '../../.claude/skills/cc-do/scripts/record-review-decision.sh'
);
const VERIFY_TASK_GATES = path.resolve(
  __dirname,
  '../../.claude/skills/cc-do/scripts/verify-task-gates.sh'
);

describe('Skill runtime', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-runtime-'));

    fs.writeFileSync(
      path.join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'tmp-repo',
          version: '0.0.0',
          scripts: {
            lint: 'node -e "process.exit(0)"',
            typecheck: 'node -e "process.exit(0)"',
            test: 'node -e "process.exit(0)"'
          }
        },
        null,
        2
      )
    );

    fs.mkdirSync(path.join(repoRoot, '.git'));
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  async function markManifestReviews(changeId, verdict = 'pass') {
    const manifestPath = getTaskManifestPath(repoRoot, changeId);
    const manifest = await readJson(manifestPath);
    manifest.tasks = manifest.tasks.map((task) => ({
      ...task,
      reviews: {
        spec: verdict,
        code: verdict
      }
    }));
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  test('runs init -> snapshot -> plan -> dispatch -> verify -> release', async () => {
    const changeId = 'REQ-999';
    await runInit({ repoRoot, changeId, goal: 'Test skill runtime pipeline' });

    fs.writeFileSync(
      getTasksMarkdownPath(repoRoot, changeId),
      [
        '- [ ] T001 create scaffolding (src/a.ts)',
        '- [ ] T002 [P] add docs (docs/readme.md)',
        '- [ ] T003 finalize dependsOn:T001,T002 (src/b.ts)'
      ].join('\n')
    );

    await runPlanningSnapshot({ repoRoot, changeId });

    const planResult = await runPlan({ repoRoot, changeId, overwrite: true });
    expect(planResult.taskCount).toBe(3);
    await runApprove({ repoRoot, changeId, executionMode: 'direct' });

    const dispatchResult = await runDispatch({
      repoRoot,
      changeId,
      parallel: 2,
      maxRetries: 0
    });
    expect(dispatchResult.success).toBe(true);

    const manifest = await readJson(getTaskManifestPath(repoRoot, changeId));
    expect(manifest.tasks.every((task) => task.status === 'passed')).toBe(true);

    await markManifestReviews(changeId, 'pass');

    const verifyResult = await runVerify({
      repoRoot,
      changeId,
      strict: false,
      skipReview: true
    });
    expect(verifyResult.overall).toBe('pass');

    const report = await readJson(getReportCardPath(repoRoot, changeId));
    expect(report.overall).toBe('pass');

    const releaseResult = await runRelease({ repoRoot, changeId });
    expect(releaseResult.status).toBe('released');

    const releaseNote = await readText(getReleaseNotePath(repoRoot, changeId));
    expect(releaseNote).toContain('Release Note - REQ-999');
  });

  test('blocks verify when passed tasks are missing native review proof', async () => {
    const changeId = 'REQ-1000';
    await runInit({ repoRoot, changeId, goal: 'Require task review proof' });

    fs.writeFileSync(
      getTasksMarkdownPath(repoRoot, changeId),
      [
        '- [ ] T001 [TEST] Counter behavior (src/a.test.ts)',
        '- [ ] T002 [IMPL] Counter behavior dependsOn:T001 (src/a.ts)'
      ].join('\n')
    );

    await runPlanningSnapshot({ repoRoot, changeId });
    await runPlan({ repoRoot, changeId, overwrite: true });
    await runApprove({ repoRoot, changeId, executionMode: 'direct' });
    await runDispatch({ repoRoot, changeId, parallel: 1, maxRetries: 0 });

    const verifyResult = await runVerify({
      repoRoot,
      changeId,
      strict: false,
      skipReview: true
    });

    expect(verifyResult.overall).toBe('fail');

    const report = await readJson(getReportCardPath(repoRoot, changeId));
    expect(report.review.status).toBe('blocked');
    expect(report.blockingFindings.some((item) => item.includes('missing spec review proof'))).toBe(true);
  });

  test('cc-do shell helpers write runtime artifacts into devflow/changes instead of legacy flat paths', async () => {
    const changeId = 'REQ-2001';
    await runInit({ repoRoot, changeId, goal: 'Verify shell helper layout' });

    const change = getChangePaths(repoRoot, changeId, { goal: 'Verify shell helper layout' });
    const manifestPath = getTaskManifestPath(repoRoot, changeId, { goal: 'Verify shell helper layout' });
    fs.writeFileSync(
      manifestPath,
      `${JSON.stringify(
        {
          changeId,
          tasks: [
            {
              id: 'T001',
              title: 'Verify helper layout',
              reviews: { spec: 'pending', code: 'pending' }
            }
          ]
        },
        null,
        2
      )}\n`
    );

    const checkpoint = spawnSync(WRITE_TASK_CHECKPOINT, [
      '--dir',
      change.changeDir,
      '--task',
      'T001',
      '--status',
      'passed',
      '--summary',
      'task finished'
    ], { encoding: 'utf8' });
    expect(checkpoint.status).toBe(0);

    const specReview = spawnSync(RECORD_REVIEW_DECISION, [
      '--dir',
      change.changeDir,
      '--task',
      'T001',
      '--gate',
      'spec',
      '--verdict',
      'pass',
      '--summary',
      'spec ok'
    ], { encoding: 'utf8' });
    expect(specReview.status).toBe(0);

    const codeReview = spawnSync(RECORD_REVIEW_DECISION, [
      '--dir',
      change.changeDir,
      '--task',
      'T001',
      '--gate',
      'code',
      '--verdict',
      'pass',
      '--summary',
      'code ok'
    ], { encoding: 'utf8' });
    expect(codeReview.status).toBe(0);

    const verify = spawnSync(VERIFY_TASK_GATES, [
      '--dir',
      change.changeDir,
      '--task',
      'T001'
    ], { encoding: 'utf8' });
    expect(verify.status).toBe(0);

    expect(fs.existsSync(path.join(change.tasksDir, 'T001', 'checkpoint.json'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.harness', 'runtime', changeId))).toBe(false);
    expect(fs.existsSync(path.join(change.tasksDir, 'T001', 'checkpoint.md'))).toBe(false);
    expect(fs.existsSync(path.join(change.tasksDir, 'T001', 'review-spec.md'))).toBe(false);
    expect(fs.existsSync(path.join(change.tasksDir, 'T001', 'review-code.md'))).toBe(false);
  });
});
