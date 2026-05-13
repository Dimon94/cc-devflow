/**
 * [INPUT]: 依赖 task-contract migrate operation、真实临时文件树与 CLI 子进程。
 * [OUTPUT]: 证明 opt-in migrate 会折叠 legacy design.md，并归档原文件。
 * [POS]: REQ-003-minimize-workflow-artifacts T007 的 Red/Green 证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { extractTasksContractSummary } = require('../task-contract');
const { runCompile, runMigrate } = require('../operations/task-contract');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const CLI_BIN = path.join(REPO_ROOT, 'bin/cc-devflow-cli.js');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function legacyTasks() {
  return [
    '# TASKS',
    '',
    '## Plan Meta',
    '',
    '- Requirement version: `REQ-999-legacy.v1`',
    '',
    '## Phase 1: Legacy',
    '',
    '- [ ] T001 keep old behavior',
    '  Goal: Preserve the migration source task list.',
    ''
  ].join('\n');
}

function legacyDesign() {
  return [
    '# DESIGN',
    '',
    '## Requirement Snapshot',
    '',
    '- Raw ask: Keep one source of truth.',
    '',
    '## Approved Direction',
    '',
    '- Fold legacy design into tasks.md only when explicitly requested.',
    ''
  ].join('\n');
}

describe('task-contract migrate', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-task-migrate-'));
    fs.writeFileSync(path.join(repoRoot, 'package.json'), '{"name":"tmp"}\n');
    fs.mkdirSync(path.join(repoRoot, '.git'));
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('migrate fold-design merges design.md content into tasks.md Contract Summary', async () => {
    const changeId = 'REQ-999';
    const changeKey = 'REQ-999-legacy';
    const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
    const planningDir = path.join(changeDir, 'planning');
    writeFile(path.join(planningDir, 'tasks.md'), legacyTasks());
    writeFile(path.join(planningDir, 'design.md'), legacyDesign());

    const result = await runMigrate({ repoRoot, changeId, changeKey, foldDesign: true });
    const tasksText = fs.readFileSync(path.join(planningDir, 'tasks.md'), 'utf8');
    const archivedDesign = path.join(changeDir, 'assets', 'legacy', 'design.md.bak');

    expect(result).toEqual(expect.objectContaining({
      code: 0,
      changeId,
      changeKey,
      migrated: ['design.md']
    }));
    expect(extractTasksContractSummary(tasksText).found).toBe(true);
    expect(tasksText).toContain('## Contract Summary');
    expect(tasksText).toContain('Legacy Design:');
    expect(tasksText).toContain('> # DESIGN');
    expect(tasksText).toContain('> - Fold legacy design into tasks.md only when explicitly requested.');
    expect(fs.existsSync(path.join(planningDir, 'design.md'))).toBe(false);
    expect(fs.readFileSync(archivedDesign, 'utf8')).toBe(legacyDesign());
  });

  test('compile does not auto-run fold-design migration', async () => {
    const changeId = 'REQ-998';
    const changeKey = 'REQ-998-no-auto-migrate';
    const planningDir = path.join(repoRoot, 'devflow', 'changes', changeKey, 'planning');
    writeFile(path.join(planningDir, 'tasks.md'), legacyTasks());
    writeFile(path.join(planningDir, 'design.md'), legacyDesign());

    const result = await runCompile({ repoRoot, changeId, changeKey });

    expect(result.code).toBe(3);
    expect(fs.existsSync(path.join(planningDir, 'design.md'))).toBe(true);
  });

  test('migrate returns exit code 4 when legacy design.md is unreadable', async () => {
    const changeId = 'REQ-997';
    const changeKey = 'REQ-997-unreadable-design';
    const planningDir = path.join(repoRoot, 'devflow', 'changes', changeKey, 'planning');
    writeFile(path.join(planningDir, 'tasks.md'), legacyTasks());
    fs.mkdirSync(path.join(planningDir, 'design.md'), { recursive: true });

    const result = await runMigrate({ repoRoot, changeId, changeKey, foldDesign: true });

    expect(result.code).toBe(4);
    expect(result.error).toContain('Unable to read planning/design.md');
  });

  test('CLI migrate requires an explicit fold flag', () => {
    const changeId = 'REQ-996';
    const changeKey = 'REQ-996-cli-flags';
    const planningDir = path.join(repoRoot, 'devflow', 'changes', changeKey, 'planning');
    writeFile(path.join(planningDir, 'tasks.md'), legacyTasks());
    writeFile(path.join(planningDir, 'design.md'), legacyDesign());

    const result = spawnSync(
      process.execPath,
      [CLI_BIN, 'task-contract', 'migrate', '--cwd', repoRoot, '--change', changeId, '--change-key', changeKey],
      { encoding: 'utf8' }
    );

    expect(result.status).toBe(3);
    expect(result.stderr).toContain('--fold-design');
    expect(fs.existsSync(path.join(planningDir, 'design.md'))).toBe(true);
  });
});
