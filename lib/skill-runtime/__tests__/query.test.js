const fs = require('fs');
const os = require('os');
const path = require('path');

const { getFullState, getNextTask } = require('../query');
const {
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath
} = require('../store');
const { getIntentPrBriefPath } = require('../artifacts');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('query helpers', () => {
  test('reports approve stage when a planned manifest exists without approval', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-approve-'));

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Expose approval gate',
      status: 'planned',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:05:00.000Z',
      approval: {
        status: 'pending',
        executionMode: 'delegate'
      },
      updatedAt: '2026-03-25T01:05:00.000Z'
    });

    writeJson(getTaskManifestPath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Expose approval gate',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      tasks: [
        {
          id: 'T001',
          title: 'Pending',
          type: 'IMPL',
          dependsOn: [],
          touches: ['src/a.ts'],
          run: ['echo ok'],
          checks: [],
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    const state = await getFullState(repoRoot, 'REQ-123');

    expect(state.lifecycle.stage).toBe('approve');
    expect(state.lifecycle.approval).toMatchObject({
      status: 'pending',
      executionMode: 'delegate',
      planVersion: 1
    });
  });

  test('reports prepare-pr stage and pr brief path when PR-ready artifact exists', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-'));

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Expose query stage',
      status: 'verified',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:05:00.000Z',
      verifiedAt: '2026-03-25T01:10:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z'
    });

    writeJson(getTaskManifestPath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Expose query stage',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      tasks: [
        {
          id: 'T001',
          title: 'Done',
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
      quickGates: [],
      strictGates: [],
      review: { status: 'pass', details: '' },
      blockingFindings: [],
      timestamp: '2026-03-25T01:11:00.000Z'
    });

    fs.mkdirSync(path.dirname(getIntentPrBriefPath(repoRoot, 'REQ-123')), { recursive: true });
    fs.writeFileSync(getIntentPrBriefPath(repoRoot, 'REQ-123'), '# PR Brief: REQ-123\n');

    const state = await getFullState(repoRoot, 'REQ-123');

    expect(state.lifecycle.stage).toBe('prepare-pr');
    expect(state.delivery.prBriefPath).toBe(getIntentPrBriefPath(repoRoot, 'REQ-123'));
  });

  test('returns the ready task instead of the first pending task', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-next-'));

    writeJson(getTaskManifestPath(repoRoot, 'REQ-124'), {
      changeId: 'REQ-124',
      goal: 'Expose dependency-aware next task',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      currentTaskId: 'T002',
      activePhase: 1,
      tasks: [
        {
          id: 'T001',
          title: 'Blocked task',
          type: 'OTHER',
          phase: 1,
          dependsOn: ['T999'],
          touches: ['src/a.ts'],
          files: [],
          run: ['echo blocked'],
          checks: [],
          acceptance: [],
          verification: [],
          evidence: [],
          context: { readFiles: [], commands: [], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        },
        {
          id: 'T002',
          title: 'Ready task',
          type: 'OTHER',
          phase: 1,
          dependsOn: [],
          touches: ['src/b.ts'],
          files: [],
          run: ['echo ready'],
          checks: [],
          acceptance: [],
          verification: [],
          evidence: [],
          context: { readFiles: [], commands: [], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    const next = await getNextTask(repoRoot, 'REQ-124');

    expect(next.id).toBe('T002');
  });
});
