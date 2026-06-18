const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

describe('validate-publish', () => {
  test('publish validation passes', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-publish.js'], {
      cwd: ROOT,
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('validate-publish: ok');
  });

  test('package scripts no longer expose retired artifact validators', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const retired = ['verify', 'benchmark'].map((prefix) => `${prefix}:artifacts`);

    expect(pkg.scripts).not.toHaveProperty(retired[0]);
    expect(pkg.scripts).not.toHaveProperty(retired[1]);
    expect(pkg.scripts).not.toHaveProperty(['benchmark', 'workflow-context'].join(':'));
  });

  test('chain contracts are distributable without becoming public', () => {
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/distributable-skills.json'), 'utf8'));
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    for (const skillName of [
      'task-contract',
      'workflow-chain-contract',
      'quality-gate-contract',
      'execution-environment-contract'
    ]) {
      expect(config.distributedSkills).toContain(skillName);
      expect(config.publicSkills).not.toContain(skillName);
      expect(pkg.files).toContain(`.claude/skills/${skillName}/`);
    }
  });

  test('retired task-contract artifacts remain banned', () => {
    const script = fs.readFileSync(path.join(ROOT, 'scripts/validate-publish.js'), 'utf8');

    expect(script).toContain('/task-contract|review-records|benchmark-artifacts|verify-artifacts/');
    expect(script).toContain("['task-contract', ' review ', 'compile ', 'validate ']");
  });

  test('CLI no longer exposes runtime queries', () => {
    const result = spawnSync(process.execPath, ['bin/cc-devflow-cli.js', '--help'], {
      cwd: ROOT,
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('query ');
  });

  test('retired query command fails closed instead of using adapter fallback', () => {
    const result = spawnSync(process.execPath, ['bin/cc-devflow-cli.js', 'query', 'list'], {
      cwd: ROOT,
      encoding: 'utf8'
    });

    expect(result.status).toBe(3);
    expect(result.stderr).toContain('cc-devflow query has been removed');
    expect(result.stderr).not.toContain('Codex executed');
  });

  test('top-level options fail closed instead of using adapter fallback', () => {
    const result = spawnSync(process.execPath, ['bin/cc-devflow-cli.js', '--cwd', ROOT], {
      cwd: ROOT,
      encoding: 'utf8'
    });

    expect(result.status).toBe(3);
    expect(result.stderr).toContain('Unknown top-level option: --cwd');
    expect(result.stderr).not.toContain('Codex executed');
  });

  test('skill contracts do not tell agents to switch or push main directly', () => {
    const forbidden = [
      /\bgit\s+(checkout|switch)\s+main\b/,
      /\bgit\s+push\s+origin\s+main\b/,
      /On branch main/,
      /Not on main branch/
    ];
    const skillRoot = path.join(ROOT, '.claude', 'skills');

    function walk(target) {
      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        return fs.readdirSync(target).flatMap((entry) => walk(path.join(target, entry)));
      }
      return /\.(md|sh)$/.test(target) ? [target] : [];
    }

    const offenders = walk(skillRoot).flatMap((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return forbidden
        .filter((pattern) => pattern.test(text))
        .map((pattern) => `${path.relative(ROOT, file)} matched ${pattern}`);
    });

    expect(offenders).toEqual([]);
  });
});
