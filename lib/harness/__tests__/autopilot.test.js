const fs = require('fs');
const os = require('os');
const path = require('path');

const { runAutopilot } = require('../operations/autopilot');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('runAutopilot', () => {
  test('drives the thin init -> plan -> dispatch -> verify loop and writes resume index', async () => {
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
    const reportCard = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'report-card.json'), 'utf8')
    );
    const workerDirs = fs.readdirSync(path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'workers'));
    const prBrief = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'pr-brief.md'),
      'utf8'
    );

    expect(result.executed).toEqual(expect.arrayContaining(['init', 'pack', 'plan', 'delegate', 'dispatch', 'verify', 'prepare-pr']));
    expect(result.currentStage).toBe('prepare-pr');
    expect(reportCard.overall).toBe('pass');
    expect(resumeIndex).toContain('Resume Index: REQ-123');
    expect(prBrief).toContain('PR Brief: REQ-123');
    expect(workerDirs.length).toBeGreaterThan(0);
  });

  test('consumes delegated workers through worker-run and keeps manifest in sync', async () => {
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

    const result = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      goal: 'Ship thin autopilot loop with delegated workers',
      workerCommand: 'printf "delegate-ok"'
    });

    const manifest = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'), 'utf8')
    );
    const delegatedResult = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'results', 'T002.md'),
      'utf8'
    );
    const prBrief = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'pr-brief.md'),
      'utf8'
    );

    expect(result.executed).toEqual(expect.arrayContaining(['delegate', 'worker-run', 'dispatch', 'verify', 'prepare-pr']));
    expect(result.currentStage).toBe('prepare-pr');
    expect(manifest.tasks.find((task) => task.id === 'T002').status).toBe('passed');
    expect(delegatedResult).toContain('delegate-ok');
    expect(prBrief).toContain('artifacts/results/T002.md');
  });

  test('runs release after prepare-pr when requested', async () => {
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

    const result = await runAutopilot({
      repoRoot,
      changeId: 'REQ-123',
      goal: 'Ship thin autopilot loop and release',
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
