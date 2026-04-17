const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  syncIntentMemory,
  syncIntentCheckpoint,
  syncIntentTaskResult,
  syncIntentPrBrief
} = require('../intent');
const {
  getIntentTaskBriefPath,
  getIntentTaskResultPath,
  getIntentPrBriefPath,
  getIntentSummaryPath,
  getIntentResumeIndexPath,
  getIntentDecisionLogPath,
  getIntentCheckpointNotePath
} = require('../artifacts');
const {
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath
} = require('../store');
const {
  getApprovalState,
  classifyDelegationMode
} = require('../lifecycle');

describe('intent memory bridge', () => {
  let repoRoot;

  function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  }

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-intent-'));

    writeJson(
      getRuntimeStatePath(repoRoot, 'REQ-123'),
      {
        changeId: 'REQ-123',
        goal: 'Deliver autopilot memory bridge',
        status: 'in_progress',
        initializedAt: '2026-03-25T01:00:00.000Z',
        plannedAt: '2026-03-25T01:05:00.000Z',
        updatedAt: '2026-03-25T01:10:00.000Z'
      }
    );

    writeJson(
      getTaskManifestPath(repoRoot, 'REQ-123'),
      {
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
            touches: ['lib/skill-runtime/intent.js'],
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
      }
    );
  });

  test('writes status and resume index markdown files', async () => {
    await syncIntentMemory(repoRoot, 'REQ-123', {
      event: 'dispatch_completed',
      reason: 'Test sync'
    });

    const status = fs.readFileSync(getIntentSummaryPath(repoRoot, 'REQ-123'), 'utf8');
    const resumeIndex = fs.readFileSync(getIntentResumeIndexPath(repoRoot, 'REQ-123'), 'utf8');
    const decisionLog = fs.readFileSync(getIntentDecisionLogPath(repoRoot, 'REQ-123'), 'utf8');

    expect(status).toContain('Status: REQ-123');
    expect(status).toContain('Deliver autopilot memory bridge');
    expect(resumeIndex).toContain('Resume Index: REQ-123');
    expect(resumeIndex).toContain('Stage: `approve`');
    expect(resumeIndex).toContain('cc-plan');
    expect(decisionLog).toContain('dispatch_completed');
  });

  test('keeps team mode opt-in and derives approval from the current plan version', () => {
    const task = {
      id: 'T900',
      title: 'Complex cross-cutting task',
      type: 'IMPL',
      dependsOn: ['T001', 'T002', 'T003'],
      touches: ['a.ts', 'b.ts', 'c.ts', 'd.ts'],
      run: ['echo one', 'echo two'],
      checks: []
    };

    expect(classifyDelegationMode(task)).toBe('delegate');
    expect(classifyDelegationMode(task, { executionMode: 'direct' })).toBe('direct');
    expect(classifyDelegationMode(task, { executionMode: 'team' })).toBe('team');

    expect(getApprovalState(
      {
        approval: {
          status: 'approved',
          executionMode: 'delegate',
          planVersion: 1,
          approvedAt: '2026-03-25T01:09:00.000Z'
        }
      },
      {
        metadata: {
          planVersion: 2
        }
      }
    )).toMatchObject({
      status: 'pending',
      executionMode: 'delegate',
      planVersion: 2
    });
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
      getIntentCheckpointNotePath(repoRoot, 'REQ-123', 'T001'),
      'utf8'
    );

    expect(checkpointNote).toContain('Checkpoint: T001');
    expect(checkpointNote).toContain('Task passed after 1 attempt');
  });

  test('writes task briefs and terminal result artifacts', async () => {
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
    writeJson(
      getReportCardPath(repoRoot, 'REQ-123'),
      {
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
      }
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
    const resumeIndex = fs.readFileSync(getIntentResumeIndexPath(repoRoot, 'REQ-123'), 'utf8');

    expect(prBrief).toContain('PR Brief: REQ-123');
    expect(prBrief).toContain('Suggested Title: feat(req-123): Deliver autopilot memory bridge');
    expect(prBrief).toContain('execution/tasks/T001/result.md');
    expect(resumeIndex).toContain('Stage: `prepare-pr`');
  });
});
