const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  syncIntentMemory,
  syncIntentPrBrief
} = require('../intent');
const {
  getIntentPrBriefPath,
  getIntentResumeIndexPath
} = require('../artifacts');
const {
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath,
  getCheckpointPath
} = require('../store');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('intent handoff bridge', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-intent-'));

    writeJson(
      getRuntimeStatePath(repoRoot, 'REQ-123'),
      {
        changeId: 'REQ-123',
        changeKey: 'REQ-123-autopilot-memory-bridge',
        slug: 'autopilot-memory-bridge',
        createdAt: '2026-03-25T01:00:00.000Z',
        goal: 'Deliver autopilot memory bridge',
        status: 'verified',
        initializedAt: '2026-03-25T01:00:00.000Z',
        plannedAt: '2026-03-25T01:05:00.000Z',
        verifiedAt: '2026-03-25T01:10:00.000Z',
        approval: {
          status: 'approved',
          executionMode: 'delegate',
          planVersion: 1,
          approvedAt: '2026-03-25T01:06:00.000Z'
        },
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
          generatedBy: 'test',
          planVersion: 1
        }
      }
    );

    writeJson(
      getCheckpointPath(repoRoot, 'REQ-123', 'T001'),
      {
        changeId: 'REQ-123',
        taskId: 'T001',
        sessionId: 'T001-session',
        planVersion: 1,
        status: 'passed',
        summary: 'Task passed after 1 attempt',
        error: '',
        outputExcerpt: 'worker-ok',
        timestamp: '2026-03-25T01:11:00.000Z',
        attempt: 1
      }
    );
  });

  test('syncIntentMemory removes legacy projection files instead of writing them', async () => {
    const legacyFiles = [
      path.join(repoRoot, 'devflow/changes/REQ-123-autopilot-memory-bridge/meta/index.json'),
      path.join(repoRoot, 'devflow/changes/REQ-123-autopilot-memory-bridge/planning/facts.md'),
      path.join(repoRoot, 'devflow/changes/REQ-123-autopilot-memory-bridge/planning/decision-log.md'),
      path.join(repoRoot, 'devflow/changes/REQ-123-autopilot-memory-bridge/planning/plan.md'),
      path.join(repoRoot, 'devflow/changes/REQ-123-autopilot-memory-bridge/planning/planning-snapshot.md'),
      path.join(repoRoot, 'devflow/changes/REQ-123-autopilot-memory-bridge/execution/delegation-map.md'),
      path.join(repoRoot, 'devflow/changes/REQ-123-autopilot-memory-bridge/handoff/status.md')
    ];

    for (const filePath of legacyFiles) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, 'legacy\n');
    }

    await syncIntentMemory(repoRoot, 'REQ-123');

    for (const filePath of legacyFiles) {
      expect(fs.existsSync(filePath)).toBe(false);
    }
    expect(fs.existsSync(getIntentResumeIndexPath(repoRoot, 'REQ-123'))).toBe(false);
  });

  test('can emit a single local-handoff resume index when explicitly requested', async () => {
    writeJson(
      getReportCardPath(repoRoot, 'REQ-123'),
      {
        changeId: 'REQ-123',
        overall: 'pass',
        quickGates: [],
        strictGates: [],
        review: { status: 'pass', summary: 'review-ok', details: '', findings: [], taskReviews: {}, diffReview: {} },
        blockingFindings: [],
        timestamp: '2026-03-25T01:12:00.000Z'
      }
    );

    await syncIntentMemory(repoRoot, 'REQ-123', { handoff: 'resume' });

    const resumeIndex = fs.readFileSync(getIntentResumeIndexPath(repoRoot, 'REQ-123'), 'utf8');

    expect(resumeIndex).toContain('Resume Index: REQ-123');
    expect(resumeIndex).toContain('Durable Truth');
    expect(fs.existsSync(getIntentPrBriefPath(repoRoot, 'REQ-123'))).toBe(false);
  });

  test('writes pr brief from manifest, checkpoints, and report-card only', async () => {
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
        review: {
          status: 'pass',
          summary: 'review-ok',
          details: '',
          findings: [],
          taskReviews: { status: 'pass', required: true, summary: '', reviewers: [], findings: [] },
          diffReview: { status: 'pass', required: true, summary: '', reviewers: [], findings: [] }
        },
        blockingFindings: [],
        timestamp: '2026-03-25T01:12:00.000Z'
      }
    );

    await syncIntentPrBrief(repoRoot, 'REQ-123');

    const prBrief = fs.readFileSync(getIntentPrBriefPath(repoRoot, 'REQ-123'), 'utf8');

    expect(prBrief).toContain('PR Brief: REQ-123');
    expect(prBrief).toContain('Suggested Title: feat(req-123): Deliver autopilot memory bridge');
    expect(prBrief).toContain('execution/tasks/T001/checkpoint.json');
    expect(prBrief).not.toContain('result.md');
    expect(fs.existsSync(getIntentResumeIndexPath(repoRoot, 'REQ-123'))).toBe(false);
  });
});
