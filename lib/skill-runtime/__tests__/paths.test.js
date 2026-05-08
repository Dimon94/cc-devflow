const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildChangeKey,
  getChangePaths,
  getChangeSlug
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
