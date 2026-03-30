const fs = require('fs');
const os = require('os');
const path = require('path');

const { runDispatch } = require('../operations/dispatch');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('runDispatch', () => {
  test('rejects stale results when planVersion changes during task execution', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-dispatch-'));
    const manifestPath = path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json');

    writeJson(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'harness-state.json'), {
      changeId: 'REQ-123',
      goal: 'Reject stale results',
      status: 'planned',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:01:00.000Z',
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
          touches: ['lib/harness/operations/dispatch.js', 'lib/harness/intent.js'],
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
    const resultNote = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'results', 'T001.md'),
      'utf8'
    );

    expect(result.success).toBe(false);
    expect(nextManifest.tasks[0].status).toBe('failed');
    expect(nextManifest.tasks[0].lastError).toContain('Stale result rejected');
    expect(resultNote).toContain('Plan Version: 1');
    expect(resultNote).toContain('Stale result rejected');
  });
});
