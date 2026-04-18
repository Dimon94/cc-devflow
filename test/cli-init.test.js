const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'cc-devflow-cli.js');

describe('cc-devflow init', () => {
  test('installs cc-simplify with the distributed .claude pack', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-init-'));

    const result = spawnSync(process.execPath, [CLI, 'init', '--dir', tempDir], {
      cwd: ROOT,
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(
      fs.existsSync(path.join(tempDir, '.claude', 'skills', 'cc-simplify', 'SKILL.md'))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tempDir, '.claude', 'skills', 'docs-sync', 'SKILL.md'))
    ).toBe(false);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('force preserves unrelated .claude files while upgrading managed skills', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-force-'));
    const customCommandPath = path.join(tempDir, '.claude', 'commands', 'custom.md');
    const customSkillPath = path.join(tempDir, '.claude', 'skills', 'custom-skill', 'SKILL.md');
    const managedSkillPath = path.join(tempDir, '.claude', 'skills', 'cc-plan', 'SKILL.md');
    const sourceManagedSkillPath = path.join(ROOT, '.claude', 'skills', 'cc-plan', 'SKILL.md');

    fs.mkdirSync(path.dirname(customCommandPath), { recursive: true });
    fs.mkdirSync(path.dirname(customSkillPath), { recursive: true });
    fs.mkdirSync(path.dirname(managedSkillPath), { recursive: true });
    fs.writeFileSync(customCommandPath, 'custom command\n');
    fs.writeFileSync(customSkillPath, 'custom skill\n');
    fs.writeFileSync(managedSkillPath, 'stale managed skill\n');

    const result = spawnSync(process.execPath, [CLI, 'init', '--dir', tempDir, '--force'], {
      cwd: ROOT,
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(fs.readFileSync(customCommandPath, 'utf8')).toBe('custom command\n');
    expect(fs.readFileSync(customSkillPath, 'utf8')).toBe('custom skill\n');
    expect(fs.readFileSync(managedSkillPath, 'utf8')).toBe(fs.readFileSync(sourceManagedSkillPath, 'utf8'));

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
