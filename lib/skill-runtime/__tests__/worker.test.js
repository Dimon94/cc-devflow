const fs = require('fs');
const os = require('os');
const path = require('path');

const { syncDelegationRuntime } = require('../delegation');
const { runWorkerSession } = require('../operations/worker');

describe('runWorkerSession', () => {
  test('returns stable handoff bundle for a delegated worker', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-worker-session-'));
    fs.writeFileSync(path.join(repoRoot, 'package.json'), JSON.stringify({ name: 'worker-session', version: '1.0.0' }, null, 2));

    const manifest = {
      changeId: 'REQ-123',
      goal: 'Prepare worker session',
      createdAt: '2026-03-25T01:00:00.000Z',
      updatedAt: '2026-03-25T01:01:00.000Z',
      tasks: [
        {
          id: 'T002',
          title: 'Multi file delegated task',
          type: 'IMPL',
          dependsOn: [],
          touches: ['src/a.ts', 'src/b.ts'],
          run: ['echo delegated'],
          checks: [],
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 2
      }
    };

    const delegation = await syncDelegationRuntime(repoRoot, 'REQ-123', manifest);
    const workerId = delegation.assignments.find((item) => item.taskId === 'T002').workerId;
    const handoff = await runWorkerSession({
      repoRoot,
      changeId: 'REQ-123',
      workerId
    });

    const journal = fs.readFileSync(handoff.journalPath, 'utf8');
    const state = fs.readFileSync(handoff.statePath, 'utf8');

    expect(handoff.workerId).toBe(workerId);
    expect(handoff.assignmentPath).toContain('assignment.md');
    expect(handoff.taskIds).toEqual(['T002']);
    expect(journal).toContain('handoff prepared');
    expect(state).toContain('Status: `handoff_ready`');
  });
});
