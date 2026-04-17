const fs = require('fs');
const os = require('os');
const path = require('path');

const { runPreparePr } = require('../operations/prepare-pr');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('runPreparePr', () => {
  test('generates pr brief and refreshes resume stage to prepare-pr', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-prepare-pr-'));

    writeJson(path.join(repoRoot, 'package.json'), {
      name: 'prepare-pr-test',
      version: '1.0.0'
    });

    writeJson(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'runtime-state.json'), {
      changeId: 'REQ-123',
      goal: 'Prepare a PR-ready brief',
      status: 'verified',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:05:00.000Z',
      verifiedAt: '2026-03-25T01:10:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z'
    });

    writeJson(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'), {
      changeId: 'REQ-123',
      goal: 'Prepare a PR-ready brief',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      tasks: [
        {
          id: 'T001',
          title: 'Finish delivery',
          type: 'IMPL',
          dependsOn: [],
          touches: ['src/a.ts'],
          run: ['echo ok'],
          checks: [],
          status: 'passed',
          attempts: 1,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    writeJson(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'report-card.json'), {
      changeId: 'REQ-123',
      overall: 'pass',
      quickGates: [
        { name: 'lint', status: 'pass', command: 'npm run lint', durationMs: 10, details: '' }
      ],
      strictGates: [
        { name: 'test', status: 'pass', command: 'npm test', durationMs: 20, details: '' }
      ],
      review: {
        status: 'pass',
        details: 'review-ok'
      },
      blockingFindings: [],
      timestamp: '2026-03-25T01:11:00.000Z'
    });

    fs.mkdirSync(path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'results'), { recursive: true });
    fs.writeFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'results', 'T001.md'),
      '# Task Result: T001\n\n- Status: `passed`\n'
    );

    const result = await runPreparePr({ repoRoot, changeId: 'REQ-123' });

    const prBrief = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'pr-brief.md'),
      'utf8'
    );
    const resumeIndex = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'resume-index.md'),
      'utf8'
    );
    const decisionLog = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'decision-log.md'),
      'utf8'
    );

    expect(result.status).toBe('prepared');
    expect(result.suggestedTitle).toBe('feat(req-123): Prepare a PR-ready brief');
    expect(prBrief).toContain('PR Brief: REQ-123');
    expect(prBrief).toContain('artifacts/results/T001.md');
    expect(resumeIndex).toContain('Stage: `prepare-pr`');
    expect(decisionLog).toContain('prepare_pr_completed');
  });
});
