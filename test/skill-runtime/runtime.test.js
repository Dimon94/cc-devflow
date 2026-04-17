/**
 * [INPUT]: 依赖 skill runtime operations 与临时仓库夹具。
 * [OUTPUT]: 验证 plan/do/check/act 共享运行时主链最小可运行性。
 * [POS]: test/skill-runtime 的集成测试入口，保障 skill-first 内核回归。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

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
  readJson,
  readText
} = require('../../lib/skill-runtime/store');

describe('Skill runtime', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-runtime-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'requirements'), { recursive: true });

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

  function writeReviewArtifact(changeId, taskId, kind, verdict = 'pass') {
    const reviewPath = path.join(repoRoot, '.skill-runtime', 'runtime', changeId, taskId, `review-${kind}.md`);
    fs.mkdirSync(path.dirname(reviewPath), { recursive: true });
    fs.writeFileSync(
      reviewPath,
      [
        `# ${kind} review`,
        '',
        `- Verdict: \`${verdict}\``,
        '- Reviewer: jest',
        `- Summary: ${taskId} ${kind} review ${verdict}`
      ].join('\n')
    );
  }

  test('runs init -> snapshot -> plan -> dispatch -> verify -> release', async () => {
    const changeId = 'REQ-999';
    const reqDir = path.join(repoRoot, 'devflow', 'requirements', changeId);
    fs.mkdirSync(reqDir, { recursive: true });

    fs.writeFileSync(
      path.join(reqDir, 'TASKS.md'),
      [
        '- [ ] T001 create scaffolding (src/a.ts)',
        '- [ ] T002 [P] add docs (docs/readme.md)',
        '- [ ] T003 finalize dependsOn:T001,T002 (src/b.ts)'
      ].join('\n')
    );

    await runInit({ repoRoot, changeId, goal: 'Test skill runtime pipeline' });
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

    for (const task of manifest.tasks) {
      writeReviewArtifact(changeId, task.id, 'spec');
      writeReviewArtifact(changeId, task.id, 'code');
    }

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
    const reqDir = path.join(repoRoot, 'devflow', 'requirements', changeId);
    fs.mkdirSync(reqDir, { recursive: true });

    fs.writeFileSync(
      path.join(reqDir, 'TASKS.md'),
      [
        '- [ ] T001 [TEST] Counter behavior (src/a.test.ts)',
        '- [ ] T002 [IMPL] Counter behavior dependsOn:T001 (src/a.ts)'
      ].join('\n')
    );

    await runInit({ repoRoot, changeId, goal: 'Require task review proof' });
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
});
