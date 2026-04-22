/**
 * [INPUT]: 依赖 skill runtime operations 与临时仓库夹具。
 * [OUTPUT]: 验证 plan/do/check/act 共享运行时主链最小可运行性。
 * [POS]: lib/skill-runtime/__tests__ 的集成测试入口，保障 skill-first 内核回归。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../../..');

const { runInit } = require('../operations/init');
const { runPlanningSnapshot } = require('../operations/snapshot');
const { runPlan } = require('../operations/plan');
const { runApprove } = require('../operations/approve');
const { runDispatch } = require('../operations/dispatch');
const { runVerify } = require('../operations/verify');
const { runRelease } = require('../operations/release');
const {
  getTaskManifestPath,
  getReportCardPath,
  getReleaseNotePath,
  getTasksMarkdownPath,
  readJson,
  readText
} = require('../store');
const { getChangePaths } = require('../paths');

const WRITE_TASK_CHECKPOINT = path.join(
  REPO_ROOT,
  '.claude/skills/cc-do/scripts/write-task-checkpoint.sh'
);
const RECORD_REVIEW_DECISION = path.join(
  REPO_ROOT,
  '.claude/skills/cc-do/scripts/record-review-decision.sh'
);
const VERIFY_TASK_GATES = path.join(
  REPO_ROOT,
  '.claude/skills/cc-do/scripts/verify-task-gates.sh'
);
const SELECT_READY_TASKS = path.join(
  REPO_ROOT,
  '.claude/skills/cc-do/scripts/select-ready-tasks.sh'
);
const BUILD_TASK_CONTEXT = path.join(
  REPO_ROOT,
  '.claude/skills/cc-do/scripts/build-task-context.sh'
);
const MARK_TASK_COMPLETE = path.join(
  REPO_ROOT,
  '.claude/skills/cc-do/scripts/mark-task-complete.sh'
);
const VERIFY_ACT_GATE = path.join(
  REPO_ROOT,
  '.claude/skills/cc-act/scripts/verify-act-gate.sh'
);
const SYNC_ACT_DOCS = path.join(
  REPO_ROOT,
  '.claude/skills/cc-act/scripts/sync-act-docs.sh'
);
const VALIDATE_SPEC_LINKS = path.join(
  REPO_ROOT,
  '.claude/skills/cc-spec-init/scripts/validate-spec-links.sh'
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

  test('mark-task-complete updates only the first matching task line on Darwin-compatible userlands', () => {
    const tasksPath = path.join(repoRoot, 'tasks.md');
    fs.writeFileSync(
      tasksPath,
      [
        '- [ ] **T001** first task',
        '- [ ] T001 second task',
        '- [ ] T002 untouched'
      ].join('\n')
    );

    const result = spawnSync(MARK_TASK_COMPLETE, [
      '--tasks',
      tasksPath,
      '--task',
      'T001'
    ], { encoding: 'utf8' });

    expect(result.status).toBe(0);
    expect(fs.readFileSync(tasksPath, 'utf8').trimEnd()).toBe(
      [
        '- [x] **T001** first task',
        '- [ ] T001 second task',
        '- [ ] T002 untouched'
      ].join('\n')
    );
  });

  test('select-ready-tasks blocks external dependencies and build-task-context surfaces the blocker', async () => {
    const changeId = 'REQ-2002';
    await runInit({ repoRoot, changeId, goal: 'Surface external dependency blockers' });

    const change = getChangePaths(repoRoot, changeId, { goal: 'Surface external dependency blockers' });
    const manifestPath = getTaskManifestPath(repoRoot, changeId, { goal: 'Surface external dependency blockers' });
    fs.writeFileSync(
      manifestPath,
      `${JSON.stringify(
        {
          changeId,
          tasks: [
            {
              id: 'T001',
              title: 'Wait for upstream fixture',
              status: 'pending',
              phase: 0,
              externalDep: ['REQ-BASE:T009'],
              externalBlocker: 'fixture seed must finish first'
            }
          ]
        },
        null,
        2
      )}\n`
    );

    const selectResult = spawnSync(SELECT_READY_TASKS, [
      '--manifest',
      manifestPath
    ], { encoding: 'utf8' });

    expect(selectResult.status).toBe(0);
    const readySummary = JSON.parse(selectResult.stdout);
    expect(readySummary.readyTasks).toHaveLength(0);
    expect(readySummary.blockedTasks).toHaveLength(1);
    expect(readySummary.blockedTasks[0].waitingOnExternal).toEqual(['REQ-BASE:T009']);

    const contextResult = spawnSync(BUILD_TASK_CONTEXT, [
      '--dir',
      change.changeDir,
      '--task',
      'T001'
    ], { encoding: 'utf8' });

    expect(contextResult.status).toBe(0);
    expect(contextResult.stdout).toContain('## External Dependencies');
    expect(contextResult.stdout).toContain('REQ-BASE:T009');
    expect(contextResult.stdout).toContain('fixture seed must finish first');
  });

  test('validate-spec-links fails on dangling secondary capabilities and spec files', () => {
    const specsDir = path.join(repoRoot, 'devflow', 'specs');
    const capabilitiesDir = path.join(specsDir, 'capabilities');
    const changeDir = path.join(repoRoot, 'devflow', 'changes', 'req-3001');

    fs.mkdirSync(capabilitiesDir, { recursive: true });
    fs.mkdirSync(changeDir, { recursive: true });

    fs.writeFileSync(
      path.join(specsDir, 'INDEX.md'),
      [
        '# Spec Index',
        '',
        '## Capability Map',
        '',
        '| Capability ID | Summary |',
        '| --- | --- |',
        '| core-auth | Core auth flows |',
        '',
        '## Active Change Links',
        '',
        '| Change | Capability |',
        '| --- | --- |',
        '| REQ-3001 | core-auth |'
      ].join('\n')
    );
    fs.writeFileSync(path.join(capabilitiesDir, 'core-auth.md'), '# Core Auth\n');
    fs.writeFileSync(
      path.join(changeDir, 'change-meta.json'),
      `${JSON.stringify(
        {
          changeId: 'REQ-3001',
          spec: {
            primaryCapability: 'core-auth',
            secondaryCapabilities: ['billing-ledger'],
            specFiles: ['devflow/specs/capabilities/missing-capability.md']
          }
        },
        null,
        2
      )}\n`
    );

    const result = spawnSync(VALIDATE_SPEC_LINKS, [], {
      cwd: repoRoot,
      encoding: 'utf8'
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Dangling secondary capability');
    expect(result.stderr).toContain('Dangling spec file');
  });

  test('cc-act helpers accept report-card quick/strict gate schema', async () => {
    const changeId = 'REQ-2003';
    await runInit({ repoRoot, changeId, goal: 'Ship with quick and strict gates' });

    const change = getChangePaths(repoRoot, changeId, { goal: 'Ship with quick and strict gates' });
    const manifestPath = getTaskManifestPath(repoRoot, changeId, { goal: 'Ship with quick and strict gates' });
    const tasksPath = getTasksMarkdownPath(repoRoot, changeId, { goal: 'Ship with quick and strict gates' });

    fs.writeFileSync(
      manifestPath,
      `${JSON.stringify(
        {
          changeId,
          tasks: [
            {
              id: 'T001',
              title: 'Close out verified change',
              status: 'completed',
              verification: ['npm run test']
            }
          ]
        },
        null,
        2
      )}\n`
    );
    fs.writeFileSync(tasksPath, '- [x] T001 close out verified change\n');
    fs.writeFileSync(
      getReportCardPath(repoRoot, changeId, { goal: 'Ship with quick and strict gates' }),
      `${JSON.stringify(
        {
          verdict: 'pass',
          reroute: 'none',
          specSyncReady: true,
          summary: 'All gates passed for closeout.',
          gaps: [],
          quickGates: [
            {
              name: 'lint',
              status: 'pass',
              summary: 'lint ok',
              command: 'npm run lint'
            }
          ],
          strictGates: [
            {
              name: 'tests',
              status: 'pass',
              summary: 'tests ok',
              command: 'npm run test'
            }
          ]
        },
        null,
        2
      )}\n`
    );

    const gateResult = spawnSync(VERIFY_ACT_GATE, [
      '--dir',
      change.changeDir
    ], { encoding: 'utf8' });
    expect(gateResult.status).toBe(0);

    const syncResult = spawnSync(SYNC_ACT_DOCS, [
      '--dir',
      change.changeDir,
      '--repo-root',
      repoRoot
    ], { encoding: 'utf8' });
    expect(syncResult.status).toBe(0);

    const releaseNote = await readText(getReleaseNotePath(repoRoot, changeId));
    expect(releaseNote).toContain('lint: pass - lint ok');
    expect(releaseNote).toContain('tests: pass - tests ok');
    expect(releaseNote).toContain('Verify with: `npm run lint`');
    expect(releaseNote).toContain('Verify with: `npm run test`');

    const resumeIndex = fs.readFileSync(path.join(change.handoffDir, 'resume-index.md'), 'utf8');
    expect(resumeIndex).toContain('Spec sync is already closed for this handoff.');
  }, 15000);
});
