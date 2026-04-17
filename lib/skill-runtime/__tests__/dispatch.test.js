const fs = require('fs');
const os = require('os');
const path = require('path');

const { runDispatch } = require('../operations/dispatch');
const { runResume } = require('../operations/resume');
const {
  getRuntimeStatePath,
  getTaskManifestPath,
  getCheckpointPath,
  getEventsPath
} = require('../store');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('runDispatch', () => {
  test('blocks execution when the current plan version has not been approved', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-dispatch-unapproved-'));
    const manifestPath = getTaskManifestPath(repoRoot, 'REQ-123');

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      changeKey: 'REQ-123-block-unapproved-execution',
      slug: 'block-unapproved-execution',
      createdAt: '2026-03-25T01:00:00.000Z',
      goal: 'Block unapproved execution',
      status: 'planned',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:01:00.000Z',
      approval: {
        status: 'pending',
        executionMode: 'delegate'
      },
      updatedAt: '2026-03-25T01:01:00.000Z'
    });

    writeJson(manifestPath, {
      changeId: 'REQ-123',
      goal: 'Block unapproved execution',
      createdAt: '2026-03-25T01:00:00.000Z',
      updatedAt: '2026-03-25T01:01:00.000Z',
      tasks: [
        {
          id: 'T001',
          title: 'Should not execute before approval',
          type: 'IMPL',
          dependsOn: [],
          touches: ['lib/skill-runtime/operations/dispatch.js'],
          run: ['echo blocked'],
          checks: [],
          status: 'pending',
          attempts: 0,
          maxRetries: 0
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    const result = await runDispatch({
      repoRoot,
      changeId: 'REQ-123',
      parallel: 1
    });

    const nextManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(result.success).toBe(false);
    expect(result.reason).toContain('cc-plan approval gate');
    expect(nextManifest.tasks[0].status).toBe('pending');
  });

  test('rejects stale results when planVersion changes during task execution and records it in checkpoint', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-dispatch-'));
    const manifestPath = getTaskManifestPath(repoRoot, 'REQ-123');

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      changeKey: 'REQ-123-reject-stale-results',
      slug: 'reject-stale-results',
      createdAt: '2026-03-25T01:00:00.000Z',
      goal: 'Reject stale results',
      status: 'planned',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:01:00.000Z',
      approval: {
        status: 'approved',
        executionMode: 'delegate',
        planVersion: 1,
        approvedAt: '2026-03-25T01:01:30.000Z'
      },
      updatedAt: '2026-03-25T01:01:00.000Z'
    });

    writeJson(manifestPath, {
      changeId: 'REQ-123',
      goal: 'Reject stale results',
      createdAt: '2026-03-25T01:00:00.000Z',
      updatedAt: '2026-03-25T01:01:00.000Z',
      tasks: [
        {
          id: 'T001',
          title: 'Mutate plan version mid-flight',
          type: 'IMPL',
          dependsOn: [],
          touches: ['lib/skill-runtime/operations/dispatch.js'],
          run: [
            `node -e "const fs=require('fs'); const p='${manifestPath.replace(/\\/g, '\\\\')}'; const data=JSON.parse(fs.readFileSync(p,'utf8')); data.metadata.planVersion=2; fs.writeFileSync(p, JSON.stringify(data, null, 2)+'\\n');"`
          ],
          checks: [],
          status: 'pending',
          attempts: 0,
          maxRetries: 0
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    const result = await runDispatch({
      repoRoot,
      changeId: 'REQ-123',
      parallel: 1
    });

    const nextManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const checkpoint = JSON.parse(fs.readFileSync(getCheckpointPath(repoRoot, 'REQ-123', 'T001'), 'utf8'));
    const events = fs.readFileSync(getEventsPath(repoRoot, 'REQ-123', 'T001'), 'utf8');

    expect(result.success).toBe(false);
    expect(nextManifest.tasks[0].status).toBe('failed');
    expect(nextManifest.tasks[0].lastError).toContain('Stale result rejected');
    expect(checkpoint.planVersion).toBe(1);
    expect(checkpoint.error).toContain('Stale result rejected');
    expect(events).toContain('task_stale_rejected');
  });

  test('restores unresolved work from the latest stable checkpoint on resume without creating handoff markdown', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-resume-stable-'));
    const changeId = 'REQ-123';
    const manifestPath = getTaskManifestPath(repoRoot, changeId);

    writeJson(getRuntimeStatePath(repoRoot, changeId), {
      changeId,
      changeKey: 'REQ-123-recover-from-stable-checkpoint',
      slug: 'recover-from-stable-checkpoint',
      createdAt: '2026-04-09T01:00:00.000Z',
      goal: 'Recover from stable checkpoint',
      status: 'in_progress',
      initializedAt: '2026-04-09T01:00:00.000Z',
      plannedAt: '2026-04-09T01:01:00.000Z',
      approval: {
        status: 'approved',
        executionMode: 'delegate',
        planVersion: 1,
        approvedAt: '2026-04-09T01:01:30.000Z'
      },
      updatedAt: '2026-04-09T01:02:00.000Z'
    });

    writeJson(manifestPath, {
      changeId,
      goal: 'Recover from stable checkpoint',
      createdAt: '2026-04-09T01:00:00.000Z',
      updatedAt: '2026-04-09T01:02:00.000Z',
      tasks: [
        {
          id: 'T001',
          title: 'Stable checkpoint task',
          type: 'TEST',
          dependsOn: [],
          touches: ['src/a.ts'],
          run: ['node -e "process.exit(0)"'],
          checks: [],
          status: 'passed',
          attempts: 1,
          maxRetries: 0
        },
        {
          id: 'T002',
          title: 'Retry-exhausted failed task',
          type: 'IMPL',
          dependsOn: ['T001'],
          touches: ['src/b.ts'],
          run: ['node -e "process.exit(0)"'],
          checks: [],
          status: 'failed',
          attempts: 2,
          maxRetries: 1,
          lastError: 'Command failed'
        },
        {
          id: 'T003',
          title: 'Task skipped by failed dependency',
          type: 'IMPL',
          dependsOn: ['T002'],
          touches: ['src/c.ts'],
          run: ['node -e "process.exit(0)"'],
          checks: [],
          status: 'skipped',
          attempts: 0,
          maxRetries: 0,
          lastError: 'Blocked by failed dependency'
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    writeJson(getCheckpointPath(repoRoot, changeId, 'T001'), {
      changeId,
      taskId: 'T001',
      sessionId: 'stable-session',
      planVersion: 1,
      status: 'passed',
      summary: 'Task passed after 1 attempt(s)',
      error: '',
      outputExcerpt: '',
      timestamp: '2026-04-09T01:05:00.000Z',
      attempt: 1
    });

    writeJson(getCheckpointPath(repoRoot, changeId, 'T002'), {
      changeId,
      taskId: 'T002',
      sessionId: 'failed-session',
      planVersion: 1,
      status: 'failed',
      summary: 'Task failed: Command failed',
      error: 'Command failed',
      outputExcerpt: 'Command failed',
      timestamp: '2026-04-09T01:06:00.000Z',
      attempt: 2
    });

    const result = await runResume({
      repoRoot,
      changeId,
      parallel: 1,
      fromCheckpoint: 'stable'
    });

    const nextManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(result.success).toBe(true);
    expect(result.restoredCheckpoint).toMatchObject({
      taskId: 'T001',
      status: 'passed'
    });
    expect(result.restoredTasks).toEqual(['T002', 'T003']);
    expect(nextManifest.tasks.map((task) => task.status)).toEqual(['passed', 'passed', 'passed']);
    expect(nextManifest.tasks[1].attempts).toBe(1);
    expect(nextManifest.tasks[2].attempts).toBe(1);
  });
});
