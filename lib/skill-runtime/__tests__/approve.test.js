const fs = require('fs');
const os = require('os');
const path = require('path');

const { runApprove } = require('../operations/approve');
const {
  getRuntimeStatePath,
  getTaskManifestPath
} = require('../store');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('runApprove', () => {
  test('throws named error when change-state is missing', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-approve-missing-state-'));

    await expect(runApprove({
      repoRoot,
      changeId: 'REQ-123',
      executionMode: 'direct'
    })).rejects.toMatchObject({
      name: 'MissingChangeStateError',
      artifactRefs: [
        expect.stringContaining('change-state.json')
      ],
      rescueAction: 'run cc-roadmap or cc-plan init before approving execution'
    });
  });

  test('throws named error when task manifest is missing', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-approve-missing-manifest-'));

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Approve only concrete plans',
      status: 'planned',
      initializedAt: '2026-03-25T01:00:00.000Z',
      updatedAt: '2026-03-25T01:00:00.000Z'
    });

    await expect(runApprove({
      repoRoot,
      changeId: 'REQ-123',
      executionMode: 'direct'
    })).rejects.toMatchObject({
      name: 'MissingTaskManifestError',
      artifactRefs: [
        expect.stringContaining('task-manifest.json')
      ],
      rescueAction: 'run cc-plan to create planning/task-manifest.json before approving execution'
    });
  });

  test('approves the current manifest plan version', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-approve-pass-'));

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Approve current plan',
      status: 'planned',
      initializedAt: '2026-03-25T01:00:00.000Z',
      updatedAt: '2026-03-25T01:00:00.000Z'
    });
    writeJson(getTaskManifestPath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Approve current plan',
      createdAt: '2026-03-25T01:00:00.000Z',
      updatedAt: '2026-03-25T01:00:00.000Z',
      tasks: [],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 7
      }
    });

    const result = await runApprove({
      repoRoot,
      changeId: 'REQ-123',
      executionMode: 'direct'
    });

    expect(result).toMatchObject({
      status: 'approved',
      executionMode: 'direct',
      planVersion: 7
    });
  });
});
