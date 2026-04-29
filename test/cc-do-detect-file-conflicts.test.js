const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, '.claude/skills/cc-do/scripts/detect-file-conflicts.sh');

function runDetector(payload) {
  const result = spawnSync('bash', [scriptPath], {
    cwd: repoRoot,
    input: JSON.stringify(payload),
    encoding: 'utf8'
  });

  return {
    ...result,
    json: JSON.parse(result.stdout)
  };
}

describe('cc-do detect-file-conflicts', () => {
  test('treats nested touched paths as the same execution surface', () => {
    const result = runDetector({
      parallelCandidates: [
        { id: 'T001', parallel: true, touches: ['packages/billing'] },
        { id: 'T002', parallel: true, touches: ['packages/billing/src/invoices.js'] }
      ]
    });

    expect(result.status).toBe(0);
    expect(result.json.hasConflicts).toBe(true);
    expect(result.json.fileConflicts).toEqual([
      {
        tasks: ['T001', 'T002'],
        sharedTouches: ['packages/billing']
      }
    ]);
  });

  test('reports submodule touches without blocking unrelated parallel tasks', () => {
    const result = runDetector({
      submodulePaths: ['vendor/payment-gateway'],
      parallelCandidates: [
        { id: 'T010', parallel: true, touches: ['docs/payment.md'] },
        { id: 'T011', parallel: true, touches: ['vendor/payment-gateway/src/client.js'] }
      ]
    });

    expect(result.status).toBe(0);
    expect(result.json.hasConflicts).toBe(false);
    expect(result.json.safeTaskIds).toEqual(['T010', 'T011']);
    expect(result.json.submoduleTouches).toEqual([
      {
        task: 'T011',
        submodulePath: 'vendor/payment-gateway',
        touches: ['vendor/payment-gateway/src/client.js']
      }
    ]);
  });
});
