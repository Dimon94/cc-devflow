const fs = require('fs');
const os = require('os');
const path = require('path');

const { archiveChange, restoreChange, listArchived, getArchiveRoot } = require('../archive-change');

function makeTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-archive-'));
  const changesDir = path.join(repoRoot, 'devflow', 'changes');
  fs.mkdirSync(changesDir, { recursive: true });
  return repoRoot;
}

afterEach(() => {});

describe('archiveChange', () => {
  test('moves change directory to archive/YYYY-MM/', () => {
    const repoRoot = makeTempRepo();
    const changeDir = path.join(repoRoot, 'devflow', 'changes', 'REQ-001-feature');
    fs.mkdirSync(changeDir, { recursive: true });
    fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# test');

    const result = archiveChange(repoRoot, 'REQ-001-feature');
    const month = new Date().toISOString().slice(0, 7);

    expect(result.month).toBe(month);
    expect(fs.existsSync(result.archived)).toBe(true);
    expect(fs.existsSync(path.join(result.archived, 'proposal.md'))).toBe(true);
    expect(fs.existsSync(changeDir)).toBe(false);

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('throws when change directory does not exist', () => {
    const repoRoot = makeTempRepo();

    expect(() => archiveChange(repoRoot, 'REQ-999-nonexistent'))
      .toThrow(/not found/);

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('throws when archive target already exists', () => {
    const repoRoot = makeTempRepo();
    const changeDir = path.join(repoRoot, 'devflow', 'changes', 'REQ-001-dup');
    fs.mkdirSync(changeDir, { recursive: true });

    const month = new Date().toISOString().slice(0, 7);
    const existingArchive = path.join(getArchiveRoot(repoRoot), month, 'REQ-001-dup');
    fs.mkdirSync(existingArchive, { recursive: true });

    expect(() => archiveChange(repoRoot, 'REQ-001-dup'))
      .toThrow(/already exists/);

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});

describe('restoreChange', () => {
  test('moves archived directory back to changes/', () => {
    const repoRoot = makeTempRepo();
    const archivedDir = path.join(repoRoot, 'devflow', 'changes', 'archive', '2026-04', 'REQ-002-restored');
    fs.mkdirSync(archivedDir, { recursive: true });
    fs.writeFileSync(path.join(archivedDir, 'task.md'), '- [ ] task');

    const result = restoreChange(repoRoot, archivedDir);

    expect(result.changeKey).toBe('REQ-002-restored');
    expect(fs.existsSync(result.restored)).toBe(true);
    expect(fs.existsSync(path.join(result.restored, 'task.md'))).toBe(true);
    expect(fs.existsSync(archivedDir)).toBe(false);

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('throws when archived directory does not exist', () => {
    const repoRoot = makeTempRepo();

    expect(() => restoreChange(repoRoot, '/tmp/nonexistent-archive-path'))
      .toThrow(/not found/);

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('throws when change already exists in active directory', () => {
    const repoRoot = makeTempRepo();
    const activeDir = path.join(repoRoot, 'devflow', 'changes', 'REQ-003-conflict');
    fs.mkdirSync(activeDir, { recursive: true });

    const archivedDir = path.join(repoRoot, 'devflow', 'changes', 'archive', '2026-03', 'REQ-003-conflict');
    fs.mkdirSync(archivedDir, { recursive: true });

    expect(() => restoreChange(repoRoot, archivedDir))
      .toThrow(/already exists/);

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});

describe('listArchived', () => {
  test('returns empty array when no archive exists', () => {
    const repoRoot = makeTempRepo();
    expect(listArchived(repoRoot)).toEqual([]);
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('lists archived changes across months', () => {
    const repoRoot = makeTempRepo();
    const archiveRoot = getArchiveRoot(repoRoot);

    fs.mkdirSync(path.join(archiveRoot, '2026-03', 'REQ-001-old'), { recursive: true });
    fs.mkdirSync(path.join(archiveRoot, '2026-04', 'FIX-002-bugfix'), { recursive: true });
    fs.mkdirSync(path.join(archiveRoot, '2026-04', 'REQ-003-another'), { recursive: true });

    const items = listArchived(repoRoot);

    expect(items).toHaveLength(3);
    expect(items[0]).toEqual(expect.objectContaining({ month: '2026-03', changeKey: 'REQ-001-old' }));
    expect(items[1]).toEqual(expect.objectContaining({ month: '2026-04', changeKey: 'FIX-002-bugfix' }));
    expect(items[2]).toEqual(expect.objectContaining({ month: '2026-04', changeKey: 'REQ-003-another' }));

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});
