const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'cc-devflow-cli.js');

describe('cc-devflow query', () => {
  test('lists supported typed query ids', () => {
    const result = spawnSync(process.execPath, [CLI, 'query', 'list'], {
      cwd: ROOT,
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim().split('\n')).toEqual([
      'full-state',
      'next-task',
      'progress',
      'ship-readiness'
    ]);
  });

  test('prints named query errors as json and exits non-zero', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-cli-query-'));
    const result = spawnSync(
      process.execPath,
      [CLI, 'query', 'ship-readiness', '--cwd', repoRoot, '--change', 'REQ-123'],
      {
        cwd: ROOT,
        encoding: 'utf8'
      }
    );

    const payload = JSON.parse(result.stdout);

    expect(result.status).toBe(2);
    expect(payload).toMatchObject({
      ok: false,
      queryId: 'ship-readiness',
      error: {
        name: 'MissingReportCardError',
        rescueAction: 'run cc-check and create review/report-card.json before cc-act'
      },
      trace: {
        event: 'query.ship-readiness.failed',
        changeId: 'REQ-123'
      }
    });
  });
});
