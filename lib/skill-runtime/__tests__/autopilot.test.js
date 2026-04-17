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
  getRuntimeStatePath,
  getTaskReviewPath
} = require('../store');
const {
  getIntentResumeIndexPath,
  getIntentPlanPath,
  getIntentPrBriefPath,
  getIntentTaskResultPath
} = require('../artifacts');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeReviewArtifact(repoRoot, changeId, taskId, kind, verdict = 'pass') {
  const reviewPath = getTaskReviewPath(repoRoot, changeId, taskId, kind);
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

describe('runAutopilot', () => {
  test('stops at the approval gate after planning and writes an approval-aware resume index', async () => {
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

    fs.mkdirSync(path.dirname(getTasksMarkdownPath(repoRoot, 'REQ-123')), { recursive: true });
    fs.writeFileSync(
      getTasksMarkdownPath(repoRoot, 'REQ-123'),
      [
        '- [ ] T001 启动 autopilot 闭环 (src/a.ts)',
        '- [ ] T002 多文件委派任务 [P] (src/a.ts,src/b.ts)'
      ].join('\n')
    );

    const result = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      goal: 'Ship thin autopilot loop'
    });

    const resumeIndex = fs.readFileSync(getIntentResumeIndexPath(repoRoot, 'REQ-123'), 'utf8');
    const plan = fs.readFileSync(getIntentPlanPath(repoRoot, 'REQ-123'), 'utf8');

    expect(result.executed).toEqual(['init', 'snapshot', 'plan']);
    expect(result.currentStage).toBe('approve');
    expect(resumeIndex).toContain('Resume Index: REQ-123');
    expect(resumeIndex).toContain('Stage: `approve`');
    expect(resumeIndex).toContain('cc-plan');
    expect(plan).toContain('Approval');
    expect(fs.existsSync(getReportCardPath(repoRoot, 'REQ-123'))).toBe(false);
    expect(fs.existsSync(getIntentPrBriefPath(repoRoot, 'REQ-123'))).toBe(false);
  });

  test('resumes after approval, consumes delegated workers through worker-run, and requires review proof before prepare-pr', async () => {
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

    fs.mkdirSync(path.dirname(getTasksMarkdownPath(repoRoot, 'REQ-123')), { recursive: true });
    fs.writeFileSync(
      getTasksMarkdownPath(repoRoot, 'REQ-123'),
      [
        '- [ ] T001 直接执行任务 (src/a.ts)',
        '- [ ] T002 委派实现任务 [P] (src/a.ts,src/b.ts)'
      ].join('\n')
    );

    await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      goal: 'Ship thin autopilot loop with delegated workers'
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
    const delegatedResult = fs.readFileSync(getIntentTaskResultPath(repoRoot, 'REQ-123', 'T002'), 'utf8');
    const report = JSON.parse(fs.readFileSync(getReportCardPath(repoRoot, 'REQ-123'), 'utf8'));

    expect(firstRun.executed).toEqual(expect.arrayContaining(['delegate', 'worker-run', 'dispatch', 'verify']));
    expect(firstRun.currentStage).toBe('verify');
    expect(manifest.tasks.find((task) => task.id === 'T002').status).toBe('passed');
    expect(manifest.currentTaskId).toBe(null);
    expect(manifest.activePhase).toBe(null);
    expect(delegatedResult).toContain('delegate-ok');

    expect(report.review.status).toBe('blocked');
    expect(report.blockingFindings.some((item) => item.includes('missing spec review proof'))).toBe(true);
    expect(fs.existsSync(getIntentPrBriefPath(repoRoot, 'REQ-123'))).toBe(false);

    for (const task of manifest.tasks) {
      writeReviewArtifact(repoRoot, 'REQ-123', task.id, 'spec');
      writeReviewArtifact(repoRoot, 'REQ-123', task.id, 'code');
    }

    const secondRun = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      from: 'verify'
    });

    const prBrief = fs.readFileSync(getIntentPrBriefPath(repoRoot, 'REQ-123'), 'utf8');

    expect(secondRun.executed).toEqual(expect.arrayContaining(['verify', 'prepare-pr']));
    expect(secondRun.currentStage).toBe('prepare-pr');
    expect(prBrief).toContain('execution/tasks/T002/result.md');
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

    fs.mkdirSync(path.dirname(getTasksMarkdownPath(repoRoot, 'REQ-123')), { recursive: true });
    fs.writeFileSync(
      getTasksMarkdownPath(repoRoot, 'REQ-123'),
      '- [ ] T001 发布前收尾 (src/a.ts)'
    );

    await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      goal: 'Ship thin autopilot loop and release'
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

    for (const task of manifest.tasks) {
      writeReviewArtifact(repoRoot, 'REQ-123', task.id, 'spec');
      writeReviewArtifact(repoRoot, 'REQ-123', task.id, 'code');
    }

    const result = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      from: 'verify',
      release: true
    });

    const runtimeState = JSON.parse(fs.readFileSync(getRuntimeStatePath(repoRoot, 'REQ-123'), 'utf8'));
    const releaseNote = fs.readFileSync(getReleaseNotePath(repoRoot, 'REQ-123'), 'utf8');

    expect(result.executed).toEqual(expect.arrayContaining(['verify', 'prepare-pr', 'release']));
    expect(result.lifecycleStatus).toBe('released');
    expect(runtimeState.status).toBe('released');
    expect(releaseNote).toContain('Release Note - REQ-123');
  });
});
