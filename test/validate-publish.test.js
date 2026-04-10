const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

describe('validate-publish', () => {
  test('passes even when npm dry-run env is inherited', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-publish.js'], {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_dry_run: 'true'
      }
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Publish validation passed.');
  });
});
