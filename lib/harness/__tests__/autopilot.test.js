const fs = require('fs');
const os = require('os');
const path = require('path');

const { runAutopilot } = require('../operations/autopilot');
const { runApprove } = require('../operations/approve');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeReviewArtifact(repoRoot, changeId, taskId, kind, verdict = 'pass') {
  const reviewPath = path.join(repoRoot, '.harness', 'runtime', changeId, taskId, `review-${kind}.md`);
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

    fs.mkdirSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123'), { recursive: true });
    fs.writeFileSync(
      path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'TASKS.md'),
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

    const resumeIndex = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'resume-index.md'),
      'utf8'
    );
    const plan = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'plan.md'),
      'utf8'
    );

    expect(result.executed).toEqual(['init', 'pack', 'plan']);
    expect(result.currentStage).toBe('approve');
    expect(resumeIndex).toContain('Resume Index: REQ-123');
    expect(resumeIndex).toContain('Stage: `approve`');
    expect(resumeIndex).toContain('harness:approve');
    expect(plan).toContain('Approval');
    expect(fs.existsSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'report-card.json'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'pr-brief.md'))).toBe(false);
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

    fs.mkdirSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123'), { recursive: true });
    fs.writeFileSync(
      path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'TASKS.md'),
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

    const manifest = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'), 'utf8')
    );
    const delegatedResult = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'results', 'T002.md'),
      'utf8'
    );
    const report = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'report-card.json'), 'utf8')
    );

    expect(firstRun.executed).toEqual(expect.arrayContaining(['delegate', 'worker-run', 'dispatch', 'verify']));
    expect(firstRun.currentStage).toBe('verify');
    expect(manifest.tasks.find((task) => task.id === 'T002').status).toBe('passed');
    expect(manifest.currentTaskId).toBe(null);
    expect(manifest.activePhase).toBe(null);
    expect(delegatedResult).toContain('delegate-ok');

    expect(report.review.status).toBe('blocked');
    expect(report.blockingFindings.some((item) => item.includes('missing spec review proof'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'pr-brief.md'))).toBe(false);

    for (const task of manifest.tasks) {
      writeReviewArtifact(repoRoot, 'REQ-123', task.id, 'spec');
      writeReviewArtifact(repoRoot, 'REQ-123', task.id, 'code');
    }

    const secondRun = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      from: 'verify'
    });

    const prBrief = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'pr-brief.md'),
      'utf8'
    );

    expect(secondRun.executed).toEqual(expect.arrayContaining(['verify', 'prepare-pr']));
    expect(secondRun.currentStage).toBe('prepare-pr');
    expect(prBrief).toContain('artifacts/results/T002.md');
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

    fs.mkdirSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123'), { recursive: true });
    fs.writeFileSync(
      path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'TASKS.md'),
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

    const manifest = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'), 'utf8')
    );
    const report = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'report-card.json'), 'utf8')
    );

    expect(firstRun.currentStage).toBe('verify');
    expect(report.review.status).toBe('blocked');
    expect(fs.existsSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'RELEASE_NOTE.md'))).toBe(false);

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

    const harnessState = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'harness-state.json'), 'utf8')
    );
    const releaseNote = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'RELEASE_NOTE.md'),
      'utf8'
    );

    expect(result.executed).toEqual(expect.arrayContaining(['verify', 'prepare-pr', 'release']));
    expect(result.lifecycleStatus).toBe('released');
    expect(harnessState.status).toBe('released');
    expect(releaseNote).toContain('Release Note - REQ-123');
  });
});
