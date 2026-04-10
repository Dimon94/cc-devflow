/**
 * [INPUT]: 依赖 child_process 调用 CLI，依赖临时仓库夹具与 .claude 模板文件。
 * [OUTPUT]: 验证恢复后的多平台 CLI 会安装 .claude，并按原版策略覆盖差异文件。
 * [POS]: test/harness 的 CLI 分发回归测试。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI_BIN = path.resolve(__dirname, '../../bin/cc-devflow-cli.js');
const TEMPLATE_ROOT = path.resolve(__dirname, '../../.claude');

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

describe('cc-devflow cli distribution bootstrap', () => {
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

  test('init installs .claude without mutating unrelated package scripts', () => {
    const result = runCli(['init', '--dir', repoRoot], repoRoot);
    expect(result.status).toBe(0);

    const packageJson = readPackageJson(repoRoot);
    expect(packageJson.scripts.test).toBe('node -e "process.exit(0)"');
    expect(packageJson.scripts).toEqual({
      test: 'node -e "process.exit(0)"'
    });

    expect(fs.existsSync(path.join(repoRoot, '.claude', 'skills', 'roadmap', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.claude', 'skills', 'req-plan', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.claude', 'tsc-cache'))).toBe(false);
  });

  test('init overwrites diverged .claude files with packaged content', () => {
    expect(runCli(['init', '--dir', repoRoot], repoRoot).status).toBe(0);

    const targetSkill = path.join(repoRoot, '.claude', 'skills', 'roadmap', 'SKILL.md');
    fs.writeFileSync(targetSkill, '# local override\n');

    const result = runCli(['init', '--dir', repoRoot], repoRoot);
    expect(result.status).toBe(0);

    expect(fs.existsSync(`${targetSkill}.new`)).toBe(false);
    expect(fs.readFileSync(targetSkill, 'utf8')).toBe(
      fs.readFileSync(path.join(TEMPLATE_ROOT, 'skills', 'roadmap', 'SKILL.md'), 'utf8')
    );
  });

  test('force re-initialization resets .claude to the packaged template', () => {
    expect(runCli(['init', '--dir', repoRoot], repoRoot).status).toBe(0);

    const targetSkill = path.join(repoRoot, '.claude', 'skills', 'roadmap', 'SKILL.md');
    fs.writeFileSync(targetSkill, '# local override\n');

    const result = runCli(['init', '--dir', repoRoot, '--force'], repoRoot);
    expect(result.status).toBe(0);

    expect(fs.readFileSync(targetSkill, 'utf8')).toBe(
      fs.readFileSync(path.join(TEMPLATE_ROOT, 'skills', 'roadmap', 'SKILL.md'), 'utf8')
    );
    expect(fs.existsSync(`${targetSkill}.new`)).toBe(false);
  });
});
