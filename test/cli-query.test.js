const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'cc-devflow-cli.js');

describe('cc-devflow query', () => {
  test('lists only Git-first workflow context', () => {
    const result = spawnSync(process.execPath, [CLI, 'query', 'list'], {
      cwd: ROOT,
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim().split('\n')).toEqual(['workflow-context']);
  });

  test('prints named query errors when task.md is missing', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-cli-query-'));
    const result = spawnSync(
      process.execPath,
      [CLI, 'query', 'workflow-context', '--cwd', repoRoot, '--change', 'REQ-123'],
      {
        cwd: ROOT,
        encoding: 'utf8'
      }
    );

    const payload = JSON.parse(result.stdout);

    expect(result.status).toBe(2);
    expect(payload).toMatchObject({
      ok: false,
      queryId: 'workflow-context',
      error: {
        name: 'MissingQueryArtifactError',
        rescueAction: 'create task.md before running this query'
      },
      trace: {
        event: 'query.workflow-context.failed',
        changeId: 'REQ-123'
      }
    });
    expect(payload.error.message).toContain('task.md');
    expect(result.stdout).not.toContain('task-manifest');
    expect(result.stdout).not.toContain('change-meta');
    expect(result.stdout).not.toContain('planning/');
  });

  test('supports compact data-only workflow context from task.md and Git', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-cli-query-key-'));
    const changeKey = 'REQ-124-first-plan';
    const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
    fs.mkdirSync(path.join(changeDir, 'handoff'), { recursive: true });
    fs.writeFileSync(
      path.join(changeDir, 'task.md'),
      [
        '# REQ-124 First Plan',
        '',
        '- [x] T001 Finished task',
        '- [ ] T002 Pending task'
      ].join('\n')
    );
    fs.writeFileSync(path.join(changeDir, 'handoff', 'pr-brief.md'), '# PR Brief\n');
    spawnSync('git', ['init'], { cwd: repoRoot, encoding: 'utf8' });

    const result = spawnSync(
      process.execPath,
      [
        CLI,
        'query',
        'workflow-context',
        '--cwd',
        repoRoot,
        '--change',
        'REQ-124',
        '--change-key',
        changeKey,
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
      changeId: 'REQ-124',
      changeKey,
      nextAction: {
        skill: 'cc-do',
        taskId: 'T002'
      },
      taskSummary: {
        total: 2,
        completed: 1,
        pending: 1
      }
    });
    expect(payload.files.task).toContain('task.md');
    expect(payload.files.prBrief).toContain('pr-brief.md');
    expect(payload.trace).toBeUndefined();
    expect(payload.ok).toBeUndefined();
  });

  test('workflow context trace never asks for retired process artifacts', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-cli-query-trace-'));
    const changeKey = 'REQ-125-trace-plan';
    const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
    fs.mkdirSync(path.join(changeDir, 'handoff'), { recursive: true });
    fs.writeFileSync(
      path.join(changeDir, 'task.md'),
      [
        '# REQ-125 Trace Plan',
        '',
        '- [x] T001 Finished task'
      ].join('\n')
    );
    spawnSync('git', ['init'], { cwd: repoRoot, encoding: 'utf8' });

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
        '--change-key',
        changeKey
      ],
      {
        cwd: ROOT,
        encoding: 'utf8'
      }
    );

    const payload = JSON.parse(result.stdout);
    const serialized = JSON.stringify(payload);

    expect(result.status).toBe(0);
    expect(payload.trace.artifactRefs).toEqual([
      path.join(changeDir, 'task.md'),
      path.join(changeDir, 'handoff', 'pr-brief.md')
    ]);
    expect(serialized).not.toContain('task-manifest');
    expect(serialized).not.toContain('change-meta');
    expect(serialized).not.toContain('planning/');
  });
});
