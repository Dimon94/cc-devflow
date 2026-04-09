const fs = require('fs');
const os = require('os');
const path = require('path');

const { getFullState } = require('../query');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('query helpers', () => {
  test('reports approve stage when a planned manifest exists without approval', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-approve-'));

    writeJson(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'harness-state.json'), {
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

    writeJson(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'), {
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

    writeJson(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'harness-state.json'), {
      changeId: 'REQ-123',
      goal: 'Expose query stage',
      status: 'verified',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:05:00.000Z',
      verifiedAt: '2026-03-25T01:10:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z'
    });

    writeJson(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'), {
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

    writeJson(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'report-card.json'), {
      changeId: 'REQ-123',
      overall: 'pass',
      quickGates: [],
      strictGates: [],
      review: { status: 'pass', details: '' },
      blockingFindings: [],
      timestamp: '2026-03-25T01:11:00.000Z'
    });

    fs.mkdirSync(path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts'), { recursive: true });
    fs.writeFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'pr-brief.md'),
      '# PR Brief: REQ-123\n'
    );

    const state = await getFullState(repoRoot, 'REQ-123');

    expect(state.lifecycle.stage).toBe('prepare-pr');
    expect(state.delivery.prBriefPath).toBe(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'pr-brief.md')
    );
  });
});
