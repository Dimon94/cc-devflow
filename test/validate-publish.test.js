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

  test('CLI only exposes workflow-context as a runtime query', () => {
    const result = spawnSync(process.execPath, ['bin/cc-devflow-cli.js', 'query', 'list'], {
      cwd: ROOT,
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('workflow-context');
  });
});
