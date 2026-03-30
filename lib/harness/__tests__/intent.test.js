const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  syncIntentMemory,
  syncIntentCheckpoint,
  getIntentTaskBriefPath,
  getIntentTaskResultPath,
  getIntentPrBriefPath,
  syncIntentTaskResult,
  syncIntentPrBrief
} = require('../intent');

describe('intent memory bridge', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-intent-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123'), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, '.harness', 'runtime', 'REQ-123', 'T001'), { recursive: true });

    fs.writeFileSync(
      path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'harness-state.json'),
      JSON.stringify({
        changeId: 'REQ-123',
        goal: 'Deliver autopilot memory bridge',
        status: 'in_progress',
        initializedAt: '2026-03-25T01:00:00.000Z',
        plannedAt: '2026-03-25T01:05:00.000Z',
        updatedAt: '2026-03-25T01:10:00.000Z'
      }, null, 2)
    );

    fs.writeFileSync(
      path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'),
      JSON.stringify({
        changeId: 'REQ-123',
        goal: 'Deliver autopilot memory bridge',
        createdAt: '2026-03-25T01:05:00.000Z',
        updatedAt: '2026-03-25T01:10:00.000Z',
        tasks: [
          {
            id: 'T001',
            title: 'Write intent files',
            type: 'IMPL',
            dependsOn: [],
            touches: ['lib/harness/intent.js'],
            run: ['echo ok'],
            checks: [],
            status: 'passed',
            attempts: 1,
            maxRetries: 1
          }
        ],
        metadata: {
          source: 'default',
          generatedBy: 'test'
        }
      }, null, 2)
    );
  });

  test('writes summary and resume index markdown files', async () => {
    await syncIntentMemory(repoRoot, 'REQ-123', {
      event: 'dispatch_completed',
      reason: 'Test sync'
    });

    const summary = fs.readFileSync(path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'summary.md'), 'utf8');
    const resumeIndex = fs.readFileSync(path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'resume-index.md'), 'utf8');
    const decisionLog = fs.readFileSync(path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'decision-log.md'), 'utf8');

    expect(summary).toContain('Summary: REQ-123');
    expect(summary).toContain('Deliver autopilot memory bridge');
    expect(resumeIndex).toContain('Resume Index: REQ-123');
    expect(decisionLog).toContain('dispatch_completed');
  });

  test('writes markdown checkpoint note beside runtime checkpoint json', async () => {
    await syncIntentCheckpoint(repoRoot, 'REQ-123', {
      changeId: 'REQ-123',
      taskId: 'T001',
      sessionId: 'T001-session',
      status: 'passed',
      summary: 'Task passed after 1 attempt',
      timestamp: '2026-03-25T01:11:00.000Z',
      attempt: 1
    });

    const checkpointNote = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'checkpoints', 'T001.md'),
      'utf8'
    );

    expect(checkpointNote).toContain('Checkpoint: T001');
    expect(checkpointNote).toContain('Task passed after 1 attempt');
  });

  test('writes delegation briefs and terminal result artifacts', async () => {
    await syncIntentMemory(repoRoot, 'REQ-123', {
      event: 'dispatch_completed',
      reason: 'Write delegation artifacts'
    });
    await syncIntentTaskResult(repoRoot, 'REQ-123', {
      changeId: 'REQ-123',
      taskId: 'T001',
      sessionId: 'T001-session',
      planVersion: 1,
      status: 'passed',
      summary: 'Task passed after 1 attempt',
      timestamp: '2026-03-25T01:11:00.000Z',
      attempt: 1
    });

    const brief = fs.readFileSync(getIntentTaskBriefPath(repoRoot, 'REQ-123', 'T001'), 'utf8');
    const result = fs.readFileSync(getIntentTaskResultPath(repoRoot, 'REQ-123', 'T001'), 'utf8');

    expect(brief).toContain('Task Brief: T001');
    expect(brief).toContain('Plan Version: 1');
    expect(result).toContain('Task Result: T001');
    expect(result).toContain('Status: `passed`');
  });

  test('writes pr-ready brief from manifest and verification facts', async () => {
    fs.writeFileSync(
      path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'report-card.json'),
      JSON.stringify({
        changeId: 'REQ-123',
        overall: 'pass',
        quickGates: [
          { name: 'lint', status: 'pass', command: 'npm run lint', durationMs: 1200, details: '' }
        ],
        strictGates: [
          { name: 'test', status: 'pass', command: 'npm test', durationMs: 2400, details: '' }
        ],
        review: { status: 'pass', details: 'review-ok' },
        blockingFindings: [],
        timestamp: '2026-03-25T01:12:00.000Z'
      }, null, 2)
    );

    await syncIntentTaskResult(repoRoot, 'REQ-123', {
      changeId: 'REQ-123',
      taskId: 'T001',
      sessionId: 'T001-session',
      planVersion: 1,
      status: 'passed',
      summary: 'Task passed after 1 attempt',
      timestamp: '2026-03-25T01:11:00.000Z',
      attempt: 1
    });
    await syncIntentPrBrief(repoRoot, 'REQ-123');
    await syncIntentMemory(repoRoot, 'REQ-123');

    const prBrief = fs.readFileSync(getIntentPrBriefPath(repoRoot, 'REQ-123'), 'utf8');
    const resumeIndex = fs.readFileSync(path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'resume-index.md'), 'utf8');

    expect(prBrief).toContain('PR Brief: REQ-123');
    expect(prBrief).toContain('Suggested Title: feat(req-123): Deliver autopilot memory bridge');
    expect(prBrief).toContain('report-card.json');
    expect(resumeIndex).toContain('Stage: `prepare-pr`');
  });
});
