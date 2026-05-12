const fs = require('fs');
const os = require('os');
const path = require('path');

const { runAutopilot } = require('../operations/autopilot');
const { runApprove } = require('../operations/approve');
const {
  getTasksMarkdownPath,
  getTaskManifestPath,
  getReportCardPath,
  getReleaseNotePath,
  getRuntimeStatePath
} = require('../store');
const {
  getIntentResumeIndexPath,
  getIntentPrBriefPath
} = require('../artifacts');
const { getChangePaths } = require('../paths');

jest.setTimeout(20000);

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function markManifestReviewsPassed(repoRoot, changeId) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.tasks = manifest.tasks.map((task) => ({
    ...task,
    reviews: {
      spec: 'pass',
      code: 'pass'
    }
  }));
  manifest.spec = manifest.spec || {
    primaryCapability: 'autopilot-runtime',
    specFiles: ['devflow/specs/autopilot-runtime.md']
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function writeCleanReviewLedger(repoRoot, changeId) {
  const change = getChangePaths(repoRoot, changeId);
  const ledgerPath = path.join(change.reviewDir, 'review-ledger.jsonl');
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, [
    JSON.stringify({
      schema: 'review-ledger.v2',
      change: change.changeKey,
      reviewId: 'RVW-20260512-001',
      createdAt: '2026-05-12T00:00:00.000Z',
      createdBy: 'cc-devflow-cli',
      event: 'review-started',
      mode: 'implementation',
      scope: 'current-diff',
      baseSha: 'abc123',
      headSha: 'def456',
      selectedNodes: [],
      skippedNodes: [],
      riskLanes: []
    }),
    JSON.stringify({
      schema: 'review-ledger.v2',
      change: change.changeKey,
      reviewId: 'RVW-20260512-001',
      createdAt: '2026-05-12T00:01:00.000Z',
      createdBy: 'cc-devflow-cli',
      event: 'review-closed',
      status: 'clean',
      blockingCount: 0,
      warningCount: 0,
      next: 'cc-check'
    })
  ].join('\n'));
}

describe('runAutopilot', () => {
  test('stops at the approval gate after planning without writing approval-phase handoff markdown', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-autopilot-'));

    writeJson(path.join(repoRoot, 'package.json'), {
      name: 'autopilot-smoke',
      version: '1.0.0',
      scripts: {
        lint: 'node -e "process.exit(0)"',
        typecheck: 'node -e "process.exit(0)"',
        test: 'node -e "process.exit(0)"'
      }
    });

    const goal = 'Ship thin autopilot loop';
    fs.mkdirSync(path.dirname(getTasksMarkdownPath(repoRoot, 'REQ-123', { goal })), { recursive: true });
    fs.writeFileSync(
      getTasksMarkdownPath(repoRoot, 'REQ-123', { goal }),
      [
        '- [ ] T001 启动 autopilot 闭环 (src/a.ts)',
        '- [ ] T002 多文件委派任务 [P] (src/a.ts,src/b.ts)'
      ].join('\n')
    );

    const result = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      goal
    });

    const runtimeState = JSON.parse(fs.readFileSync(getRuntimeStatePath(repoRoot, 'REQ-123'), 'utf8'));

    expect(result.executed).toEqual(['init', 'snapshot', 'plan']);
    expect(result.currentStage).toBe('approve');
    expect(runtimeState.changeKey).toBe('REQ-123-ship-thin-autopilot-loop');
    expect(fs.existsSync(getReportCardPath(repoRoot, 'REQ-123'))).toBe(false);
    expect(fs.existsSync(getIntentPrBriefPath(repoRoot, 'REQ-123'))).toBe(false);
    expect(fs.existsSync(getIntentResumeIndexPath(repoRoot, 'REQ-123'))).toBe(false);
  });

  test('resumes after approval, executes delegated work, and prepares a PR from task state', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-autopilot-workers-'));

    writeJson(path.join(repoRoot, 'package.json'), {
      name: 'autopilot-worker-smoke',
      version: '1.0.0',
      scripts: {
        lint: 'node -e "process.exit(0)"',
        typecheck: 'node -e "process.exit(0)"',
        test: 'node -e "process.exit(0)"'
      }
    });

    const goal = 'Ship thin autopilot loop with delegated workers';
    fs.mkdirSync(path.dirname(getTasksMarkdownPath(repoRoot, 'REQ-123', { goal })), { recursive: true });
    fs.writeFileSync(
      getTasksMarkdownPath(repoRoot, 'REQ-123', { goal }),
      [
        '- [ ] T001 直接执行任务 (src/a.ts)',
        '- [ ] T002 委派实现任务 [P] (src/a.ts,src/b.ts)'
      ].join('\n')
    );

    await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      goal
    });

    await runApprove({
      repoRoot,
      changeId: 'REQ-123',
      executionMode: 'delegate'
    });

    const firstRun = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      workerCommand: 'printf "delegate-ok"'
    });

    const manifest = JSON.parse(fs.readFileSync(getTaskManifestPath(repoRoot, 'REQ-123'), 'utf8'));
    const report = JSON.parse(fs.readFileSync(getReportCardPath(repoRoot, 'REQ-123'), 'utf8'));

    expect(firstRun.executed).toEqual(expect.arrayContaining(['delegate', 'worker-run', 'dispatch', 'verify']));
    expect(firstRun.currentStage).toBe('verify');
    expect(manifest.tasks.find((task) => task.id === 'T002').status).toBe('passed');
    expect(report.review.status).toBe('blocked');
    expect(fs.existsSync(getIntentPrBriefPath(repoRoot, 'REQ-123'))).toBe(false);

    markManifestReviewsPassed(repoRoot, 'REQ-123');
    writeCleanReviewLedger(repoRoot, 'REQ-123');

    const secondRun = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      from: 'verify',
      skipReview: true
    });

    const prBrief = fs.readFileSync(getIntentPrBriefPath(repoRoot, 'REQ-123'), 'utf8');

    expect(secondRun.executed).toEqual(expect.arrayContaining(['verify', 'prepare-pr']));
    expect(secondRun.currentStage).toBe('prepare-pr');
    expect(prBrief).toContain('planning/task-manifest.json');
    expect(prBrief).not.toContain('checkpoint.json');
  });

  test('runs release after prepare-pr when requested for an approved plan', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-autopilot-release-'));

    writeJson(path.join(repoRoot, 'package.json'), {
      name: 'autopilot-release-smoke',
      version: '1.0.0',
      scripts: {
        lint: 'node -e "process.exit(0)"',
        typecheck: 'node -e "process.exit(0)"',
        test: 'node -e "process.exit(0)"'
      }
    });

    const goal = 'Ship thin autopilot loop and release';
    fs.mkdirSync(path.dirname(getTasksMarkdownPath(repoRoot, 'REQ-123', { goal })), { recursive: true });
    fs.writeFileSync(
      getTasksMarkdownPath(repoRoot, 'REQ-123', { goal }),
      '- [ ] T001 发布前收尾 (src/a.ts)'
    );

    await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      goal
    });

    await runApprove({
      repoRoot,
      changeId: 'REQ-123',
      executionMode: 'direct'
    });

    const firstRun = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      release: true
    });

    const manifest = JSON.parse(fs.readFileSync(getTaskManifestPath(repoRoot, 'REQ-123'), 'utf8'));
    const report = JSON.parse(fs.readFileSync(getReportCardPath(repoRoot, 'REQ-123'), 'utf8'));

    expect(firstRun.currentStage).toBe('verify');
    expect(report.review.status).toBe('blocked');
    expect(fs.existsSync(getReleaseNotePath(repoRoot, 'REQ-123'))).toBe(false);

    markManifestReviewsPassed(repoRoot, 'REQ-123');
    writeCleanReviewLedger(repoRoot, 'REQ-123');

    const result = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      from: 'verify',
      release: true,
      skipReview: true
    });

    const runtimeState = JSON.parse(fs.readFileSync(getRuntimeStatePath(repoRoot, 'REQ-123'), 'utf8'));
    const releaseNote = fs.readFileSync(getReleaseNotePath(repoRoot, 'REQ-123'), 'utf8');

    expect(result.executed).toEqual(expect.arrayContaining(['verify', 'prepare-pr', 'release']));
    expect(result.lifecycleStatus).toBe('released');
    expect(runtimeState.status).toBe('released');
    expect(releaseNote).toContain('Release Note - REQ-123');
    expect(fs.existsSync(getIntentPrBriefPath(repoRoot, 'REQ-123'))).toBe(false);
    expect(fs.existsSync(getIntentResumeIndexPath(repoRoot, 'REQ-123'))).toBe(false);
  });
});
