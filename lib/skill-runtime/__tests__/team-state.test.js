const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  getTeamStatePath,
  readTeamState,
  writeTeamState
} = require('../team-state');

describe('team-state', () => {
  test('writes and reads the canonical truth state', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-team-state-'));
    fs.writeFileSync(path.join(repoRoot, 'package.json'), JSON.stringify({ name: 'team-state-smoke', version: '1.0.0' }, null, 2));

    await writeTeamState(repoRoot, 'REQ-123', {
      status: 'delegated',
      phase: 'delegate',
      branch: 'main',
      planVersion: 4,
      team: {
        mode: 'parallel',
        lead: 'main-agent',
        teammates: [
          {
            id: 'delegate-01',
            role: 'dev-implementer',
            status: 'idle',
            currentTask: null,
            completedTasks: [],
            lastActiveAt: '2026-03-26T00:00:00.000Z'
          }
        ],
        taskAssignments: {
          T001: 'delegate-01'
        },
        createdAt: '2026-03-26T00:00:00.000Z',
        updatedAt: '2026-03-26T00:00:00.000Z'
      }
    });

    const truth = JSON.parse(fs.readFileSync(getTeamStatePath(repoRoot, 'REQ-123'), 'utf8'));
    const state = await readTeamState(repoRoot, 'REQ-123');

    expect(truth.changeId).toBe('REQ-123');
    expect(truth.team.taskAssignments.T001).toBe('delegate-01');
    expect(state.changeId).toBe('REQ-123');
    expect(state.planVersion).toBe(4);
    expect(state.phase).toBe('delegate');
  });
});
