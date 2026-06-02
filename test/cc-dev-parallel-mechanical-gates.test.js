const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const AUDIT_SCRIPT = path.join(
  ROOT,
  '.claude/skills/cc-dev/scripts/audit-child-integration.sh'
);

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with ${result.status}`,
      result.stdout,
      result.stderr
    ].join('\n'));
  }

  return result;
}

function exec(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8'
  });
}

function field(output, key) {
  const line = output.split('\n').find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : '';
}

function createRepo() {
  const repoRoot = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-child-audit-'))
  );
  run('git', ['init', '-b', 'main'], repoRoot);
  run('git', ['config', 'user.name', 'Test User'], repoRoot);
  run('git', ['config', 'user.email', 'test@example.com'], repoRoot);
  fs.mkdirSync(path.join(repoRoot, 'src'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'src/app.js'), 'module.exports = 1;\n');
  run('git', ['add', 'src/app.js'], repoRoot);
  run('git', ['commit', '-m', 'feat: seed fixture'], repoRoot);
  return repoRoot;
}

function createChildCommit(repoRoot, relativePath = 'src/app.js') {
  const childPath = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-child-worktree-'))
  );
  fs.rmdirSync(childPath);
  run('git', ['worktree', 'add', '-b', 'child/env-001', childPath], repoRoot);
  const target = path.join(childPath, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.appendFileSync(target, 'module.exports.changed = true;\n');
  run('git', ['add', relativePath], childPath);
  run('git', ['commit', '-m', 'test: child environment commit'], childPath);
  const commit = run('git', ['rev-parse', 'HEAD'], childPath).stdout.trim();
  return { childPath, commit };
}

function audit(repoRoot, args) {
  const result = exec('bash', [AUDIT_SCRIPT, ...args], repoRoot);
  return {
    ...result,
    get: (key) => field(result.stdout, key)
  };
}

describe('cc-dev parallel mechanical gates', () => {
  test('Codex orchestration requires real thread discovery tools before dispatch', () => {
    const skill = read('.claude/skills/cc-dev/SKILL.md');
    const codex = read('.claude/skills/cc-dev/references/codex-thread-orchestration.md');
    const parallel = read('.claude/skills/cc-dev/references/parallel-orchestration.md');
    const packet = read('.claude/skills/cc-dev/assets/CHILD_DISPATCH_PACKET.md');

    expect(skill).toContain('scripts/audit-child-integration.sh');
    expect(skill).toContain('assets/CHILD_DISPATCH_PACKET.md');
    expect(skill).toContain('create_thread`, `list_threads`, `read_thread`');
    expect(codex).toContain('`list_threads`: discover a real child thread id');
    expect(codex).toContain('Before entering Codex App parallel mode, discover all five tools');
    expect(codex).toContain('do not claim `parallel-dispatched`');
    expect(codex).toContain('`assets/CHILD_DISPATCH_PACKET.md`');
    expect(codex).toContain('`scripts/audit-child-integration.sh`');
    expect(parallel).toContain('Every child receives a completed `assets/CHILD_DISPATCH_PACKET.md`');
    expect(parallel).toContain('run `scripts/audit-child-integration.sh`');
    expect(packet).toContain('Parent thread id:');
    expect(packet).toContain('Allowed touched paths:');
    expect(packet).toContain('Mutable resources:');
    expect(packet).toContain('Final report format:');
  });

  test('task template defines durable execution environment statuses', () => {
    const template = read('.claude/skills/cc-plan/assets/TASKS_TEMPLATE.md');
    const doSkill = read('.claude/skills/cc-do/SKILL.md');

    expect(template).toContain('Status enum:');
    expect(template).toContain('| pending-thread | cc-dev |');
    expect(template).toContain('| integrated | cc-dev |');
    expect(template).toContain('`pendingWorktreeId` is not a thread id');
    expect(template).toContain('`dispatched` requires a real child');
    expect(template).toContain('`integrated` requires audit evidence');

    expect(doSkill).toContain('scripts/select-ready-tasks.sh');
    expect(doSkill).toContain('scripts/mark-task-complete.sh');
    expect(doSkill).toContain('scripts/check-task-status.sh');
    expect(doSkill).toContain('scripts/detect-file-conflicts.sh');
    expect(doSkill).toContain('scripts/cc-do-common.sh');
  });

  test('audit script recommends integration for clean in-scope child commit', () => {
    const repoRoot = createRepo();
    const { childPath, commit } = createChildCommit(repoRoot);

    const result = audit(repoRoot, [
      '--child-worktree',
      childPath,
      '--commit',
      commit,
      '--parent-branch',
      'main',
      '--allowed-path',
      'src'
    ]);

    expect(result.status).toBe(0);
    expect(result.get('CHILD_WORKTREE_EXISTS')).toBe('yes');
    expect(result.get('CHILD_CLEAN')).toBe('yes');
    expect(result.get('COMMIT_EXISTS')).toBe('yes');
    expect(result.get('COMMIT_IN_PARENT')).toBe('no');
    expect(result.get('SCOPE_DRIFT')).toBe('no');
    expect(result.get('RECOMMENDATION')).toBe('integrate');
  });

  test('audit script preserves dirty child worktrees', () => {
    const repoRoot = createRepo();
    const { childPath, commit } = createChildCommit(repoRoot);
    fs.writeFileSync(path.join(childPath, 'scratch.txt'), 'dirty\n');

    const result = audit(repoRoot, [
      '--child-worktree',
      childPath,
      '--commit',
      commit,
      '--parent-branch',
      'main',
      '--allowed-path',
      'src'
    ]);

    expect(result.status).toBe(0);
    expect(result.get('CHILD_CLEAN')).toBe('no');
    expect(result.get('UNTRACKED_FILES')).toBe('scratch.txt');
    expect(result.get('RECOMMENDATION')).toBe('preserve');
  });

  test('audit script blocks scope drift', () => {
    const repoRoot = createRepo();
    const { childPath, commit } = createChildCommit(repoRoot, 'docs/out-of-scope.md');

    const result = audit(repoRoot, [
      '--child-worktree',
      childPath,
      '--commit',
      commit,
      '--parent-branch',
      'main',
      '--allowed-path',
      'src'
    ]);

    expect(result.status).toBe(0);
    expect(result.get('SCOPE_DRIFT')).toBe('yes');
    expect(result.get('OUT_OF_SCOPE_PATHS')).toBe('docs/out-of-scope.md');
    expect(result.get('RECOMMENDATION')).toBe('blocked');
  });

  test('audit script avoids duplicate integration when commit is already present', () => {
    const repoRoot = createRepo();
    const { childPath, commit } = createChildCommit(repoRoot);
    run('git', ['merge', '--ff-only', commit], repoRoot);

    const result = audit(repoRoot, [
      '--child-worktree',
      childPath,
      '--commit',
      commit,
      '--parent-branch',
      'main',
      '--allowed-path',
      'src'
    ]);

    expect(result.status).toBe(0);
    expect(result.get('COMMIT_IN_PARENT')).toBe('yes');
    expect(result.get('RECOMMENDATION')).toBe('preserve');
  });
});
