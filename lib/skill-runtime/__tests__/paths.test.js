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
});
