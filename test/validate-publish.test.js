const path = require('path');
const fs = require('fs');
const os = require('os');
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

  test('fails when example bindings drift from current skill versions', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-bindings-'));
    const tempBindings = path.join(tempDir, 'example-bindings.json');
    const originalBindings = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'docs/examples/example-bindings.json'), 'utf8')
    );

    originalBindings.skills['cc-check'] = '9.9.9';
    fs.writeFileSync(tempBindings, JSON.stringify(originalBindings, null, 2));

    const result = spawnSync(process.execPath, ['scripts/validate-publish.js'], {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        EXAMPLE_BINDINGS_FILE: tempBindings
      }
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('example bindings check failed');
    expect(result.stderr).toContain('Binding mismatch for cc-check');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
