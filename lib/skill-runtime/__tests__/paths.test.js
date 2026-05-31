const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  buildChangeKey,
  getChangeKeyPrefix,
  getChangePaths,
  getChangeSlug,
  nextChangeKey
} = require('../paths');

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

function createGitRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-next-git-'));
  run('git', ['init', '-b', 'main'], repoRoot);
  run('git', ['config', 'user.name', 'Test User'], repoRoot);
  run('git', ['config', 'user.email', 'test@example.com'], repoRoot);
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# fixture\n');
  run('git', ['add', 'README.md'], repoRoot);
  run('git', ['commit', '-m', 'feat: seed fixture'], repoRoot);
  return repoRoot;
}

describe('change directory naming', () => {
  test('builds new change keys with uppercase REQ/FIX prefixes', () => {
    expect(buildChangeKey('REQ-123', { goal: 'Plan folder contract' }))
      .toBe('REQ-123-plan-folder-contract');
    expect(buildChangeKey('FIX-123', { goal: '修复 目录 命名' }))
      .toBe('FIX-123-修复-目录-命名');
  });

  test('derives the numeric prefix from full change keys', () => {
    expect(getChangeKeyPrefix('REQ-123-plan-folder-contract')).toBe('REQ-123');
    expect(getChangeKeyPrefix('FIX-456-crash-on-start')).toBe('FIX-456');
  });

  test('rejects change ids and explicit keys outside the canonical prefix contract', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-paths-'));

    expect(() => buildChangeKey('BUG-123', { goal: 'legacy bug id' }))
      .toThrow(/REQ-<number>\[-description\] or FIX-<number>\[-description\]/);
    expect(() => getChangePaths(repoRoot, 'REQ-123', { changeKey: 'req-123-lowercase' }))
      .toThrow(/Expected REQ-123-<description>/);

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('resolves legacy lowercase directories without creating a second path', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-paths-'));
    const legacyDir = path.join(repoRoot, 'devflow', 'changes', 'req-123-existing-plan');
    fs.mkdirSync(legacyDir, { recursive: true });

    const paths = getChangePaths(repoRoot, 'REQ-123', { goal: 'Existing plan' });

    expect(paths.changeDir).toBe(legacyDir);
    expect(getChangeSlug('REQ-123', paths.changeKey)).toBe('existing-plan');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('allows duplicate numbers when descriptions differ', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-paths-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', 'REQ-123-existing-plan'), { recursive: true });

    const paths = getChangePaths(repoRoot, 'REQ-123', { goal: 'Another plan' });

    expect(paths.changeKey).toBe('REQ-123-another-plan');
    expect(paths.changeDir).toBe(path.join(repoRoot, 'devflow', 'changes', 'REQ-123-another-plan'));

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('requires explicit change keys when duplicate numbers already exist', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-paths-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', 'REQ-123-first-plan'), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', 'REQ-123-second-plan'), { recursive: true });

    expect(() => getChangePaths(repoRoot, 'REQ-123'))
      .toThrow(/Ambiguous changeId "REQ-123"/);
    expect(getChangePaths(repoRoot, 'REQ-123', { changeKey: 'REQ-123-second-plan' }).changeKey)
      .toBe('REQ-123-second-plan');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});

describe('nextChangeKey', () => {
  test('starts at 001 when no existing directories', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-next-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes'), { recursive: true });

    const result = nextChangeKey(repoRoot, 'REQ', 'my feature');
    expect(result.changeId).toBe('REQ-001');
    expect(result.changeKey).toBe('REQ-001-my-feature');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('increments from existing max', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-next-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', 'REQ-001-first'), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', 'REQ-002-second'), { recursive: true });

    const result = nextChangeKey(repoRoot, 'REQ', 'third feature');
    expect(result.changeId).toBe('REQ-003');
    expect(result.changeKey).toBe('REQ-003-third-feature');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('increments from existing git branches with exact-case prefix', () => {
    const repoRoot = createGitRepo();

    run('git', ['branch', 'REQ/077-dramacore-validation-read-model'], repoRoot);

    const result = nextChangeKey(repoRoot, 'REQ', 'new isolated work');
    expect(result.changeId).toBe('REQ-078');
    expect(result.changeKey).toBe('REQ-078-new-isolated-work');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('increments from lowercase git branches before exact-case branch setup', () => {
    const repoRoot = createGitRepo();

    run('git', ['branch', 'req/077-dramacore-validation-read-model'], repoRoot);

    const result = nextChangeKey(repoRoot, 'REQ', 'new isolated work');
    expect(result.changeId).toBe('REQ-078');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('increments from existing worktree change-key parent directories', () => {
    const repoRoot = createGitRepo();
    const worktreesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-next-worktrees-'));
    const linkedPath = path.join(
      worktreesRoot,
      'REQ-077-dramacore-validation-read-model',
      path.basename(repoRoot)
    );

    run('git', ['worktree', 'add', '--detach', linkedPath, 'HEAD'], repoRoot);

    const result = nextChangeKey(repoRoot, 'REQ', 'new isolated work');
    expect(result.changeId).toBe('REQ-078');

    run('git', ['worktree', 'remove', '--force', linkedPath], repoRoot);
    fs.rmSync(repoRoot, { recursive: true, force: true });
    fs.rmSync(worktreesRoot, { recursive: true, force: true });
  });

  test('REQ and FIX have independent numbering', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-next-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', 'REQ-005-feature'), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', 'FIX-002-bugfix'), { recursive: true });

    const reqResult = nextChangeKey(repoRoot, 'REQ', 'next req');
    expect(reqResult.changeId).toBe('REQ-006');

    const fixResult = nextChangeKey(repoRoot, 'FIX', 'next fix');
    expect(fixResult.changeId).toBe('FIX-003');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('preserves existing padding width', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-next-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', 'REQ-0001-wide'), { recursive: true });

    const result = nextChangeKey(repoRoot, 'REQ', 'narrow');
    expect(result.changeId).toBe('REQ-0002');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('rejects invalid prefix', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-next-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes'), { recursive: true });

    expect(() => nextChangeKey(repoRoot, 'BUG', 'test')).toThrow(/Invalid prefix/);

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('handles missing changes directory', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-next-'));

    const result = nextChangeKey(repoRoot, 'FIX', 'first ever');
    expect(result.changeId).toBe('FIX-001');
    expect(result.changeKey).toBe('FIX-001-first-ever');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('slugifies Chinese descriptions', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-next-'));
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes'), { recursive: true });

    const result = nextChangeKey(repoRoot, 'REQ', '统一配置');
    expect(result.changeId).toBe('REQ-001');
    expect(result.changeKey).toBe('REQ-001-统一配置');

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});
