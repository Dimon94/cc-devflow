const fs = require('fs');
const os = require('os');
const path = require('path');

const { runPreparePr } = require('../operations/prepare-pr');
const {
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath,
  getCheckpointPath
} = require('../store');
const {
  getIntentPrBriefPath,
  getIntentResumeIndexPath
} = require('../artifacts');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('runPreparePr', () => {
  test('generates pr brief and keeps it as the only handoff artifact', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-prepare-pr-'));

    writeJson(path.join(repoRoot, 'package.json'), {
      name: 'prepare-pr-test',
      version: '1.0.0'
    });

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      changeKey: 'REQ-123-prepare-a-pr-ready-brief',
      slug: 'prepare-a-pr-ready-brief',
      createdAt: '2026-03-25T01:00:00.000Z',
      goal: 'Prepare a PR-ready brief',
      status: 'verified',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:05:00.000Z',
      verifiedAt: '2026-03-25T01:10:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z'
    });

    writeJson(getTaskManifestPath(repoRoot, 'REQ-123'), {
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

    writeJson(getReportCardPath(repoRoot, 'REQ-123'), {
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
        summary: 'review-ok',
        details: '',
        findings: [],
        taskReviews: { status: 'pass', required: true, summary: '', reviewers: [], findings: [] },
        diffReview: { status: 'pass', required: true, summary: '', reviewers: [], findings: [] }
      },
      blockingFindings: [],
      timestamp: '2026-03-25T01:11:00.000Z'
    });

    writeJson(getCheckpointPath(repoRoot, 'REQ-123', 'T001'), {
      changeId: 'REQ-123',
      taskId: 'T001',
      sessionId: 'task-session',
      planVersion: 1,
      status: 'passed',
      summary: 'Task passed after 1 attempt',
      error: '',
      outputExcerpt: 'ok',
      timestamp: '2026-03-25T01:09:00.000Z',
      attempt: 1
    });

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      ...JSON.parse(fs.readFileSync(getRuntimeStatePath(repoRoot, 'REQ-123'), 'utf8')),
      approval: {
        status: 'approved',
        executionMode: 'direct',
        planVersion: 1,
        approvedAt: '2026-03-25T01:06:00.000Z'
      }
    });

    const result = await runPreparePr({ repoRoot, changeId: 'REQ-123' });

    const prBrief = fs.readFileSync(getIntentPrBriefPath(repoRoot, 'REQ-123'), 'utf8');

    expect(result.status).toBe('prepared');
    expect(result.suggestedTitle).toBe('feat(req-123): Prepare a PR-ready brief');
    expect(prBrief).toContain('PR Brief: REQ-123');
    expect(prBrief).toContain('execution/tasks/T001/checkpoint.json');
    expect(prBrief).not.toContain('result.md');
    expect(fs.existsSync(getIntentResumeIndexPath(repoRoot, 'REQ-123'))).toBe(false);
  });
});
