/**
 * [INPUT]: 依赖 harness operations 与临时仓库夹具。
 * [OUTPUT]: 验证 init/pack/plan/dispatch/verify/release 主链最小可运行性。
 * [POS]: test/harness 的集成测试入口，保障 PR-1 内核回归。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const { runInit } = require('../../lib/harness/operations/init');
const { runPack } = require('../../lib/harness/operations/pack');
const { runPlan } = require('../../lib/harness/operations/plan');
const { runDispatch } = require('../../lib/harness/operations/dispatch');
const { runVerify } = require('../../lib/harness/operations/verify');
const { runRelease } = require('../../lib/harness/operations/release');
const {
  getTaskManifestPath,
  getReportCardPath,
  getReleaseNotePath,
  readJson,
  readText
} = require('../../lib/harness/store');

describe('Harness runtime', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-runtime-'));
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

  test('runs init -> pack -> plan -> dispatch -> verify -> release', async () => {
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

    await runInit({ repoRoot, changeId, goal: 'Test harness pipeline' });
    await runPack({ repoRoot, changeId });

    const planResult = await runPlan({ repoRoot, changeId, overwrite: true });
    expect(planResult.taskCount).toBe(3);

    const dispatchResult = await runDispatch({
      repoRoot,
      changeId,
      parallel: 2,
      maxRetries: 0
    });
    expect(dispatchResult.success).toBe(true);

    const manifest = await readJson(getTaskManifestPath(repoRoot, changeId));
    expect(manifest.tasks.every((task) => task.status === 'passed')).toBe(true);

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
});
