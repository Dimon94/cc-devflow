const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  getReportCardPath,
  getTaskManifestPath
} = require('../lib/skill-runtime/store');

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
      'ship-readiness',
      'workflow-context'
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

  test('passes full change keys through to typed queries', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-cli-query-key-'));
    const firstKey = 'REQ-124-first-plan';
    const secondKey = 'REQ-124-second-plan';
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', firstKey), { recursive: true });
    fs.mkdirSync(path.dirname(getReportCardPath(repoRoot, 'REQ-124', { changeKey: secondKey })), { recursive: true });
    fs.writeFileSync(
      getReportCardPath(repoRoot, 'REQ-124', { changeKey: secondKey }),
      `${JSON.stringify({
        changeId: 'REQ-124',
        verdict: 'pass',
        overall: 'pass',
        reroute: 'none',
        specSyncReady: true,
        blockingFindings: [],
        timestamp: '2026-05-08T01:11:00.000Z'
      }, null, 2)}\n`
    );

    const result = spawnSync(
      process.execPath,
      [
        CLI,
        'query',
        'ship-readiness',
        '--cwd',
        repoRoot,
        '--change',
        'REQ-124',
        '--change-key',
        secondKey
      ],
      {
        cwd: ROOT,
        encoding: 'utf8'
      }
    );

    const payload = JSON.parse(result.stdout);

    expect(result.status).toBe(0);
    expect(payload).toMatchObject({
      ok: true,
      queryId: 'ship-readiness',
      data: {
        ready: true,
        verdict: 'pass'
      }
    });
  });

  test('supports compact data-only query output without trace', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-cli-query-compact-'));
    fs.mkdirSync(path.dirname(getTaskManifestPath(repoRoot, 'REQ-125')), { recursive: true });
    fs.writeFileSync(
      getTaskManifestPath(repoRoot, 'REQ-125'),
      `${JSON.stringify({
        changeId: 'REQ-125',
        tasks: [
          {
            id: 'T001',
            status: 'pending',
            verification: ['npm test -- src/feature.test.ts'],
            context: {
              commands: ['npm test -- src/feature.test.ts']
            }
          }
        ]
      }, null, 2)}\n`
    );

    const result = spawnSync(
      process.execPath,
      [
        CLI,
        'query',
        'workflow-context',
        '--cwd',
        repoRoot,
        '--change',
        'REQ-125',
        '--data-only',
        '--no-trace',
        '--compact'
      ],
      {
        cwd: ROOT,
        encoding: 'utf8'
      }
    );

    const payload = JSON.parse(result.stdout);

    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('\n  ');
    expect(payload).toMatchObject({
      changeId: 'REQ-125',
      nextAction: {
        skill: 'cc-do',
        taskId: 'T001'
      }
    });
    expect(payload.trace).toBeUndefined();
    expect(payload.ok).toBeUndefined();
  });
});
