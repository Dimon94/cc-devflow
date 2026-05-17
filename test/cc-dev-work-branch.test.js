const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ENSURE_WORK_BRANCH = path.join(
  ROOT,
  '.claude',
  'skills',
  'cc-dev',
  'scripts',
  'ensure-work-branch.sh'
);
const PREPARE_CHANGE_WORKTREE = path.join(
  ROOT,
  '.claude',
  'skills',
  'cc-dev',
  'scripts',
  'prepare-change-worktree.sh'
);

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

function worktreePaths(repoRoot) {
  return run('git', ['worktree', 'list', '--porcelain'], repoRoot).stdout
    .split('\n')
    .filter((line) => line.startsWith('worktree '))
    .map((line) => line.slice('worktree '.length));
}

function createRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-work-branch-'));
  run('git', ['init', '-b', 'main'], repoRoot);
  run('git', ['config', 'user.name', 'Test User'], repoRoot);
  run('git', ['config', 'user.email', 'test@example.com'], repoRoot);
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# fixture\n');
  run('git', ['add', 'README.md'], repoRoot);
  run('git', ['commit', '-m', 'feat: seed fixture'], repoRoot);
  return repoRoot;
}

describe('cc-dev work branch anchor', () => {
  test('creates a change worktree without moving the main checkout', () => {
    const repoRoot = createRepo();
    const worktreesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-worktrees-'));

    const result = run('bash', [
      PREPARE_CHANGE_WORKTREE,
      '--change-key',
      'REQ-003-isolate-main-checkout-with-worktrees',
      '--worktrees-root',
      worktreesRoot
    ], repoRoot);

    const worktreePath = field(result.stdout, 'WORKTREE_PATH');

    expect(field(result.stdout, 'WORK_BRANCH')).toBe(
      'REQ/003-isolate-main-checkout-with-worktrees'
    );
    expect(worktreePath).toBe(path.join(
      worktreesRoot,
      'REQ-003-isolate-main-checkout-with-worktrees',
      path.basename(repoRoot)
    ));
    expect(run('git', ['branch', '--show-current'], repoRoot).stdout.trim()).toBe('main');
    expect(run('git', ['branch', '--show-current'], worktreePath).stdout.trim()).toBe(
      'REQ/003-isolate-main-checkout-with-worktrees'
    );
  });

  test('reuses a change worktree when the root path resolves through a symlink', () => {
    const repoRoot = createRepo();
    const physicalRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-worktrees-real-'));
    const linkParent = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-worktrees-link-'));
    const linkedRoot = path.join(linkParent, 'worktrees');
    fs.symlinkSync(physicalRoot, linkedRoot, 'dir');

    const first = run('bash', [
      PREPARE_CHANGE_WORKTREE,
      '--change-key',
      'REQ-004-reuse-linked-worktree',
      '--worktrees-root',
      linkedRoot
    ], repoRoot);

    const second = run('bash', [
      PREPARE_CHANGE_WORKTREE,
      '--change-key',
      'REQ-004-reuse-linked-worktree',
      '--worktrees-root',
      linkedRoot
    ], repoRoot);

    const worktreePath = field(first.stdout, 'WORKTREE_PATH');

    expect(field(first.stdout, 'WORKTREE_ACTION')).toBe('created');
    expect(field(second.stdout, 'WORKTREE_ACTION')).toBe('reused');
    expect(field(second.stdout, 'WORK_BRANCH')).toBe('REQ/004-reuse-linked-worktree');
    expect(run('git', ['branch', '--show-current'], repoRoot).stdout.trim()).toBe('main');
    expect(run('git', ['branch', '--show-current'], worktreePath).stdout.trim()).toBe(
      'REQ/004-reuse-linked-worktree'
    );
  });

  test('creates an exact-case REQ branch from detached HEAD', () => {
    const repoRoot = createRepo();
    run('git', ['switch', '--detach', 'HEAD'], repoRoot);

    const result = run('bash', [
      ENSURE_WORK_BRANCH,
      '--change-key',
      'REQ-067-unified-provider-control-plane'
    ], repoRoot);

    expect(field(result.stdout, 'BRANCH_ACTION')).toBe('created');
    expect(field(result.stdout, 'WORK_BRANCH')).toBe('REQ/067-unified-provider-control-plane');
    expect(run('git', ['branch', '--show-current'], repoRoot).stdout.trim()).toBe(
      'REQ/067-unified-provider-control-plane'
    );
  });

  test('blocks default branch anchoring before process files are written', () => {
    const repoRoot = createRepo();

    const result = exec('bash', [
      ENSURE_WORK_BRANCH,
      '--change-key',
      'REQ-067-unified-provider-control-plane'
    ], repoRoot);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('refusing to anchor work on default branch main');
  });

  test('does not register a change worktree when branch preflight fails', () => {
    const repoRoot = createRepo();
    const worktreesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-worktrees-'));
    run('git', ['switch', '-c', 'req/003-isolate-main-checkout-with-worktrees'], repoRoot);
    run('git', ['switch', 'main'], repoRoot);

    const result = exec('bash', [
      PREPARE_CHANGE_WORKTREE,
      '--change-key',
      'REQ-003-isolate-main-checkout-with-worktrees',
      '--worktrees-root',
      worktreesRoot
    ], repoRoot);

    const targetPath = path.join(
      worktreesRoot,
      'REQ-003-isolate-main-checkout-with-worktrees',
      path.basename(repoRoot)
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('case-variant branch already exists');
    expect(fs.existsSync(targetPath)).toBe(false);
    expect(worktreePaths(repoRoot)).not.toContain(targetPath);
  });

  test('fails closed when HEAD uses REQ case but only req branch exists', () => {
    const repoRoot = createRepo();
    run('git', ['switch', '-c', 'req/067-unified-provider-control-plane'], repoRoot);
    run('git', ['pack-refs', '--all', '--prune'], repoRoot);
    run('git', ['symbolic-ref', 'HEAD', 'refs/heads/REQ/067-unified-provider-control-plane'], repoRoot);

    const result = exec('bash', [
      ENSURE_WORK_BRANCH,
      '--change-key',
      'REQ-067-unified-provider-control-plane'
    ], repoRoot);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('case-variant branch already exists: req/067-unified-provider-control-plane');
    expect(result.stderr).toContain('Expected exact branch: REQ/067-unified-provider-control-plane');
  });
});
