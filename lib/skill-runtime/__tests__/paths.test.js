const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildChangeKey,
  getChangePaths,
  getChangeSlug,
  nextChangeKey
} = require('../paths');

describe('change directory naming', () => {
  test('builds new change keys with uppercase REQ/FIX prefixes', () => {
    expect(buildChangeKey('REQ-123', { goal: 'Plan folder contract' }))
      .toBe('REQ-123-plan-folder-contract');
    expect(buildChangeKey('FIX-123', { goal: '修复 目录 命名' }))
      .toBe('FIX-123-修复-目录-命名');
  });

  test('rejects change ids and explicit keys outside the canonical prefix contract', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-paths-'));

    expect(() => buildChangeKey('BUG-123', { goal: 'legacy bug id' }))
      .toThrow(/REQ-<number> or FIX-<number>/);
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
