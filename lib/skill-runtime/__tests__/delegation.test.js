const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  syncDelegationRuntime,
  ensureWorkerWorkspace,
  getWorkerStatePath,
  getWorkerJournalPath,
  getWorkerAssignmentPath,
  getMessageBusPath,
  getTeamMemoryPath,
  getWorkerWorkspacePath
} = require('../delegation');
const { getTeamStatePath } = require('../team-state');

describe('syncDelegationRuntime', () => {
  test('writes workspace scratch files and team-state truth without polluting devflow/changes', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-delegation-'));
    fs.writeFileSync(path.join(repoRoot, 'package.json'), JSON.stringify({ name: 'delegation-smoke', version: '1.0.0' }, null, 2));

    const manifest = {
      changeId: 'REQ-123',
      goal: 'Delegate selected tasks',
      createdAt: '2026-03-25T01:00:00.000Z',
      updatedAt: '2026-03-25T01:01:00.000Z',
      tasks: [
        {
          id: 'T001',
          title: 'Single file direct task',
          type: 'IMPL',
          dependsOn: [],
          touches: ['src/a.ts'],
          run: ['echo direct'],
          checks: [],
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        },
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
        planVersion: 3
      }
    };

    const result = await syncDelegationRuntime(repoRoot, 'REQ-123', manifest);

    const teamState = JSON.parse(fs.readFileSync(getTeamStatePath(repoRoot, 'REQ-123'), 'utf8'));
    const workerId = teamState.team.taskAssignments.T002;
    const assignment = fs.readFileSync(getWorkerAssignmentPath(repoRoot, 'REQ-123', workerId), 'utf8');
    const messageBus = fs.readFileSync(getMessageBusPath(repoRoot, 'REQ-123'), 'utf8');
    const teamMemory = fs.readFileSync(getTeamMemoryPath(repoRoot, 'REQ-123'), 'utf8');
    const workerState = fs.readFileSync(getWorkerStatePath(repoRoot, 'REQ-123', workerId), 'utf8');
    const workerJournal = fs.readFileSync(getWorkerJournalPath(repoRoot, 'REQ-123', workerId), 'utf8');
    const workerWorkspace = getWorkerWorkspacePath(repoRoot, 'REQ-123', workerId);

    expect(result.delegatedCount).toBe(1);
    expect(assignment).toContain(`Assignment: ${workerId}`);
    expect(assignment).toContain('`T002` Multi file delegated task');
    expect(messageBus).toContain('queued for T002');
    expect(teamMemory).toContain('Worker Count: 1');
    expect(teamState.planVersion).toBe(3);
    expect(workerId).toMatch(/^delegate-/);
    expect(workerState).toContain('Status: `idle`');
    expect(workerJournal).toContain('Assigned Tasks: T002');
    expect(workerWorkspace).toContain('devflow/workspaces');
    expect(fs.existsSync(path.join(repoRoot, 'devflow/changes/req-123-delegate-selected-tasks/execution/workers'))).toBe(false);
  });

  test('falls back to controller workspace when git worktree is unavailable', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-no-git-'));
    const worker = await ensureWorkerWorkspace(repoRoot, 'REQ-123', {
      taskId: 'T001',
      workerId: 'delegate-01',
      role: 'dev-implementer',
      route: 'delegate'
    });

    expect(worker.mode).toBe('fallback');
    expect(worker.cwd).toBe(repoRoot);
    expect(worker.reason).toBe('git-unavailable');
  });
});
