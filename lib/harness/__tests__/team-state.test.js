const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  getTeamStatePath,
  readTeamState,
  readTeamStateSync,
  writeTeamState,
  writeTeamStateSync
} = require('../team-state');

describe('team-state', () => {
  test('writes truth state and compatibility mirror together', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-team-state-'));
    fs.writeFileSync(path.join(repoRoot, 'package.json'), JSON.stringify({ name: 'team-state-smoke', version: '1.0.0' }, null, 2));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123'), { recursive: true });

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
    const compatibility = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'orchestration_status.json'), 'utf8')
    );

    expect(truth.changeId).toBe('REQ-123');
    expect(truth.team.taskAssignments.T001).toBe('delegate-01');
    expect(compatibility.reqId).toBe('REQ-123');
    expect(compatibility.team.taskAssignments.T001).toBe('delegate-01');
  });

  test('falls back to compatibility mirror when truth state is missing', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-team-fallback-'));
    fs.writeFileSync(path.join(repoRoot, 'package.json'), JSON.stringify({ name: 'team-state-fallback', version: '1.0.0' }, null, 2));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-456'), { recursive: true });
    writeTeamStateSync(repoRoot, 'REQ-456', {
      status: 'delegated',
      phase: 'delegate',
      branch: 'main',
      planVersion: 2,
      team: {
        mode: 'sequential',
        lead: 'main-agent',
        teammates: [],
        taskAssignments: {},
        createdAt: '2026-03-26T00:00:00.000Z',
        updatedAt: '2026-03-26T00:00:00.000Z'
      }
    });

    fs.rmSync(getTeamStatePath(repoRoot, 'REQ-456'));

    const asyncState = await readTeamState(repoRoot, 'REQ-456');
    const syncState = readTeamStateSync(repoRoot, 'REQ-456');

    expect(asyncState.changeId).toBe('REQ-456');
    expect(syncState.changeId).toBe('REQ-456');
    expect(asyncState.planVersion).toBe(2);
    expect(syncState.phase).toBe('delegate');
  });
});
