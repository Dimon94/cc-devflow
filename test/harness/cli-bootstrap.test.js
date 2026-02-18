/**
 * [INPUT]: 依赖 child_process 调用 CLI，依赖临时仓库夹具与 package.json 读写。
 * [OUTPUT]: 验证 init/adapt 阶段会自动补齐并修复 harness npm scripts。
 * [POS]: test/harness 的 CLI 回归测试，防止 /flow:release 再次降级到 fallback-manual。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI_BIN = path.resolve(__dirname, '../../bin/cc-devflow-cli.js');
const HARNESS_BIN = path.resolve(__dirname, '../../bin/harness.js');
const HARNESS_KEYS = [
  'harness:init',
  'harness:pack',
  'harness:plan',
  'harness:dispatch',
  'harness:verify',
  'harness:release',
  'harness:resume',
  'harness:janitor'
];

function runCli(args, cwd) {
  const result = spawnSync(process.execPath, [CLI_BIN, ...args], {
    cwd,
    encoding: 'utf8'
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function readPackageJson(repoRoot) {
  const packagePath = path.join(repoRoot, 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

describe('cc-devflow cli harness bootstrap', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-cli-bootstrap-'));
    fs.writeFileSync(
      path.join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'tmp-repo',
          version: '0.0.0',
          scripts: {
            test: 'node -e "process.exit(0)"'
          }
        },
        null,
        2
      )
    );
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('init adds all required harness scripts for non-runtime repos', () => {
    const result = runCli(['init', '--dir', repoRoot], repoRoot);
    expect(result.status).toBe(0);

    const packageJson = readPackageJson(repoRoot);
    expect(packageJson.scripts.test).toBe('node -e "process.exit(0)"');

    for (const key of HARNESS_KEYS) {
      expect(packageJson.scripts[key]).toBeDefined();
      const command = key.replace('harness:', '');
      expect(packageJson.scripts[key]).toBe(`cc-devflow harness ${command}`);
    }
  });

  test('adapt backfills missing harness scripts on existing project', () => {
    expect(runCli(['init', '--dir', repoRoot], repoRoot).status).toBe(0);

    const packageJson = readPackageJson(repoRoot);
    delete packageJson.scripts['harness:release'];
    delete packageJson.scripts['harness:janitor'];
    fs.writeFileSync(path.join(repoRoot, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);

    const adaptResult = runCli(['adapt', '--platform', 'codex', '--cwd', repoRoot], repoRoot);
    expect(adaptResult.status).toBe(0);

    const nextPackageJson = readPackageJson(repoRoot);
    expect(nextPackageJson.scripts['harness:release']).toBe('cc-devflow harness release');
    expect(nextPackageJson.scripts['harness:janitor']).toBe('cc-devflow harness janitor');
  });

  test('adapt repairs legacy absolute-path harness scripts to portable commands', () => {
    expect(runCli(['init', '--dir', repoRoot], repoRoot).status).toBe(0);

    const packageJson = readPackageJson(repoRoot);
    packageJson.scripts['harness:release'] = `node "${HARNESS_BIN}" release || cc-devflow harness release`;
    packageJson.scripts['harness:janitor'] = `node "${HARNESS_BIN}" janitor`;
    fs.writeFileSync(path.join(repoRoot, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);

    const adaptResult = runCli(['adapt', '--platform', 'codex', '--cwd', repoRoot], repoRoot);
    expect(adaptResult.status).toBe(0);

    const nextPackageJson = readPackageJson(repoRoot);
    expect(nextPackageJson.scripts['harness:release']).toBe('cc-devflow harness release');
    expect(nextPackageJson.scripts['harness:janitor']).toBe('cc-devflow harness janitor');
  });

  test('init prefers local harness runtime when bin/harness.js exists', () => {
    fs.mkdirSync(path.join(repoRoot, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'bin', 'harness.js'), 'console.log("stub harness");\n');

    const result = runCli(['init', '--dir', repoRoot], repoRoot);
    expect(result.status).toBe(0);

    const packageJson = readPackageJson(repoRoot);
    expect(packageJson.scripts['harness:release']).toBe('node bin/harness.js release');
    expect(packageJson.scripts['harness:janitor']).toBe('node bin/harness.js janitor');
  });
});
