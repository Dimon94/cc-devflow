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
const DETECT_WORKTREE_STATE = path.join(
  ROOT,
  '.claude',
  'skills',
  'cc-dev',
  'scripts',
  'detect-worktree-state.sh'
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
  const repoRoot = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-work-branch-'))
  );
  run('git', ['init', '-b', 'main'], repoRoot);
  run('git', ['config', 'user.name', 'Test User'], repoRoot);
  run('git', ['config', 'user.email', 'test@example.com'], repoRoot);
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# fixture\n');
  run('git', ['add', 'README.md'], repoRoot);
  run('git', ['commit', '-m', 'feat: seed fixture'], repoRoot);
  return repoRoot;
}

function commitFile(repoRoot, name, content, message) {
  fs.writeFileSync(path.join(repoRoot, name), content);
  run('git', ['add', name], repoRoot);
  run('git', ['commit', '-m', message], repoRoot);
  return run('git', ['rev-parse', 'HEAD'], repoRoot).stdout.trim();
}

function writePackedRefs(repoRoot, entries) {
  fs.writeFileSync(
    path.join(repoRoot, '.git', 'packed-refs'),
    entries.map(({ sha, ref }) => `${sha} ${ref}`).join('\n') + '\n'
  );
}

describe('cc-dev work branch anchor', () => {
  test('reports primary checkout state without mutating git', () => {
    const repoRoot = createRepo();

    const result = run('bash', [DETECT_WORKTREE_STATE], repoRoot);

    expect(field(result.stdout, 'INSIDE_WORK_TREE')).toBe('true');
    expect(field(result.stdout, 'WORKTREE_KIND')).toBe('primary');
    expect(field(result.stdout, 'IS_PRIMARY_CHECKOUT')).toBe('yes');
    expect(field(result.stdout, 'IS_SUBMODULE')).toBe('no');
    expect(field(result.stdout, 'WORKTREE_PATH')).toBe(repoRoot);
    expect(field(result.stdout, 'PRIMARY_WORKTREE_PATH')).toBe(repoRoot);
    expect(field(result.stdout, 'CURRENT_BRANCH')).toBe('main');
    expect(field(result.stdout, 'BRANCH_STATE')).toBe('branch');
    expect(field(result.stdout, 'PRIMARY_BRANCH')).toBe('main');
    expect(run('git', ['branch', '--show-current'], repoRoot).stdout.trim()).toBe('main');
  });

  test('reports linked worktree state separately from primary checkout', () => {
    const repoRoot = createRepo();
    const linkedPath = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-linked-'))
    );
    fs.rmdirSync(linkedPath);

    run('git', ['worktree', 'add', '-b', 'feature/linked-worktree', linkedPath], repoRoot);

    const result = run('bash', [DETECT_WORKTREE_STATE], linkedPath);

    expect(field(result.stdout, 'WORKTREE_KIND')).toBe('linked');
    expect(field(result.stdout, 'IS_PRIMARY_CHECKOUT')).toBe('no');
    expect(field(result.stdout, 'IS_SUBMODULE')).toBe('no');
    expect(field(result.stdout, 'WORKTREE_PATH')).toBe(linkedPath);
    expect(field(result.stdout, 'PRIMARY_WORKTREE_PATH')).toBe(repoRoot);
    expect(field(result.stdout, 'CURRENT_BRANCH')).toBe('feature/linked-worktree');
    expect(field(result.stdout, 'BRANCH_STATE')).toBe('branch');
    expect(field(result.stdout, 'PRIMARY_BRANCH')).toBe('main');
  });

  test('reports submodules before applying linked-worktree policy', () => {
    const parentRoot = createRepo();
    const submoduleSource = createRepo();
    const submodulePath = path.join(parentRoot, 'vendor', 'submodule');

    run('git', [
      '-c',
      'protocol.file.allow=always',
      'submodule',
      'add',
      submoduleSource,
      submodulePath
    ], parentRoot);
    run('git', ['commit', '-am', 'test: add submodule'], parentRoot);

    const result = run('bash', [DETECT_WORKTREE_STATE], submodulePath);

    expect(field(result.stdout, 'WORKTREE_KIND')).toBe('submodule');
    expect(field(result.stdout, 'IS_SUBMODULE')).toBe('yes');
    expect(field(result.stdout, 'SUPERPROJECT_WORKTREE')).toBe(parentRoot);
  });

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

  test('reuses existing lowercase branch layout for canonical REQ change keys', () => {
    const repoRoot = createRepo();
    const worktreesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-worktrees-'));
    run('git', ['switch', '-c', 'req/003-isolate-main-checkout-with-worktrees'], repoRoot);
    run('git', ['switch', 'main'], repoRoot);

    const result = run('bash', [
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

    expect(field(result.stdout, 'WORKTREE_ACTION')).toBe('created');
    expect(field(result.stdout, 'WORK_BRANCH')).toBe(
      'REQ/003-isolate-main-checkout-with-worktrees'
    );
    expect(fs.existsSync(targetPath)).toBe(true);
    expect(worktreePaths(repoRoot).map((entry) => fs.realpathSync(entry))).toContain(
      fs.realpathSync(targetPath)
    );
    expect(run('git', ['branch', '--show-current'], targetPath).stdout.trim()).toBe(
      'req/003-isolate-main-checkout-with-worktrees'
    );
  });

  test('refuses to prepare a nested change worktree from an unrelated linked worktree', () => {
    const repoRoot = createRepo();
    const linkedPath = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-linked-'))
    );
    const worktreesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-worktrees-'));
    fs.rmdirSync(linkedPath);
    run('git', ['worktree', 'add', '-b', 'feature/unrelated-linked', linkedPath], repoRoot);

    const result = exec('bash', [
      PREPARE_CHANGE_WORKTREE,
      '--change-key',
      'REQ-005-no-nested-linked-worktree',
      '--worktrees-root',
      worktreesRoot
    ], linkedPath);

    const targetPath = path.join(
      worktreesRoot,
      'REQ-005-no-nested-linked-worktree',
      path.basename(repoRoot)
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('already inside linked worktree on feature/unrelated-linked');
    expect(result.stderr).toContain('Run from the primary checkout on main');
    expect(fs.existsSync(targetPath)).toBe(false);
    expect(worktreePaths(repoRoot)).not.toContain(targetPath);
  });

  test('refuses to prepare worktree when primary checkout moved off main', () => {
    const repoRoot = createRepo();
    const worktreesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dev-worktrees-'));
    run('git', ['switch', '-c', 'feature/unwanted-primary-branch'], repoRoot);

    const result = exec('bash', [
      PREPARE_CHANGE_WORKTREE,
      '--change-key',
      'REQ-003-isolate-main-checkout-with-worktrees',
      '--worktrees-root',
      worktreesRoot
    ], repoRoot);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('primary checkout must remain on main');
    expect(result.stderr).toContain('Current primary branch: feature/unwanted-primary-branch');
  });

  test('accepts same-HEAD case drift for the current work branch', () => {
    const repoRoot = createRepo();
    const head = run('git', ['rev-parse', 'HEAD'], repoRoot).stdout.trim();
    writePackedRefs(repoRoot, [
      { sha: head, ref: 'refs/heads/REQ/067-unified-provider-control-plane' },
      { sha: head, ref: 'refs/heads/req/067-unified-provider-control-plane' }
    ]);
    run('git', ['symbolic-ref', 'HEAD', 'refs/heads/REQ/067-unified-provider-control-plane'], repoRoot);

    const result = run('bash', [
      ENSURE_WORK_BRANCH,
      '--change-key',
      'REQ-067-unified-provider-control-plane'
    ], repoRoot);

    expect(field(result.stdout, 'BRANCH_ACTION')).toBe('already-on-branch');
    expect(field(result.stdout, 'WORK_BRANCH')).toBe('REQ/067-unified-provider-control-plane');
  });

  test('fails closed when case-variant refs point at different commits', () => {
    const repoRoot = createRepo();
    const lowerHead = run('git', ['rev-parse', 'HEAD'], repoRoot).stdout.trim();
    const upperHead = commitFile(
      repoRoot,
      'feature.txt',
      'feature\n',
      'test: add feature commit'
    );
    writePackedRefs(repoRoot, [
      { sha: upperHead, ref: 'refs/heads/REQ/067-unified-provider-control-plane' },
      { sha: lowerHead, ref: 'refs/heads/req/067-unified-provider-control-plane' }
    ]);
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
