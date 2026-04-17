/**
 * [INPUT]: 依赖 child_process 调用 CLI，依赖临时仓库夹具与 .claude 模板文件。
 * [OUTPUT]: 验证恢复后的多平台 CLI 会安装 .claude，并按原版策略覆盖差异文件。
 * [POS]: test/skill-runtime 的 CLI 分发回归测试。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const matter = require('gray-matter');

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

    expect(fs.existsSync(path.join(repoRoot, '.claude', 'skills', 'cc-roadmap', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.claude', 'skills', 'cc-plan', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.claude', 'skills', 'cc-investigate', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.claude', 'skills', 'docs-sync'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, '.claude', 'skills', 'npm-release'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, '.claude', 'tsc-cache'))).toBe(false);
  });

  test('init overwrites diverged .claude files with packaged content', () => {
    expect(runCli(['init', '--dir', repoRoot], repoRoot).status).toBe(0);

    const targetSkill = path.join(repoRoot, '.claude', 'skills', 'cc-roadmap', 'SKILL.md');
    fs.writeFileSync(targetSkill, '# local override\n');

    const result = runCli(['init', '--dir', repoRoot], repoRoot);
    expect(result.status).toBe(0);

    expect(fs.existsSync(`${targetSkill}.new`)).toBe(false);
    expect(fs.readFileSync(targetSkill, 'utf8')).toBe(
      fs.readFileSync(path.join(TEMPLATE_ROOT, 'skills', 'cc-roadmap', 'SKILL.md'), 'utf8')
    );
  });

  test('force re-initialization resets .claude to the packaged template', () => {
    expect(runCli(['init', '--dir', repoRoot], repoRoot).status).toBe(0);

    const targetSkill = path.join(repoRoot, '.claude', 'skills', 'cc-roadmap', 'SKILL.md');
    fs.writeFileSync(targetSkill, '# local override\n');

    const result = runCli(['init', '--dir', repoRoot, '--force'], repoRoot);
    expect(result.status).toBe(0);

    expect(fs.readFileSync(targetSkill, 'utf8')).toBe(
      fs.readFileSync(path.join(TEMPLATE_ROOT, 'skills', 'cc-roadmap', 'SKILL.md'), 'utf8')
    );
    expect(fs.existsSync(`${targetSkill}.new`)).toBe(false);
  });

  test('adapt mirrors public skills into .codex/skills for Codex', () => {
    expect(runCli(['init', '--dir', repoRoot], repoRoot).status).toBe(0);

    const result = runCli(['adapt', '--cwd', repoRoot, '--platform', 'codex'], repoRoot);
    expect(result.status).toBe(0);

    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'cc-devflow', 'SKILL.md'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'cc-roadmap', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'cc-plan', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'cc-investigate', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'cc-do', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'cc-check', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'cc-act', 'SKILL.md'))).toBe(true);

    const codexInvestigateSkill = fs.readFileSync(
      path.join(repoRoot, '.codex', 'skills', 'cc-investigate', 'SKILL.md'),
      'utf8'
    );
    const parsed = matter(codexInvestigateSkill);
    expect(parsed.data.reads).toContain('.codex/skills/cc-investigate/references/investigation-contract.md');
    expect(parsed.data.reads).not.toContain('references/investigation-contract.md');

    const codexDoSkill = matter(
      fs.readFileSync(path.join(repoRoot, '.codex', 'skills', 'cc-do', 'SKILL.md'), 'utf8')
    );
    expect(codexDoSkill.data.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'devflow/changes/<change-key>/execution/tasks/<task-id>/checkpoint.json',
          durability: 'durable',
          required: true
        })
      ])
    );
    expect(codexDoSkill.data.effects).toContain('code changes');

    const codexRoadmapSkill = matter(
      fs.readFileSync(path.join(repoRoot, '.codex', 'skills', 'cc-roadmap', 'SKILL.md'), 'utf8')
    );
    expect(codexRoadmapSkill.data.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'ROADMAP.md',
          durability: 'durable',
          required: true
        }),
        expect.objectContaining({
          path: 'BACKLOG.md',
          durability: 'durable',
          required: true
        })
      ])
    );
  });

  test('adapt preserves pre-existing non-public Codex skills and does not mirror new private ones', () => {
    expect(runCli(['init', '--dir', repoRoot], repoRoot).status).toBe(0);

    const privateClaudeSkill = path.join(repoRoot, '.claude', 'skills', 'skill-creator');
    const preservedCodexSkill = path.join(repoRoot, '.codex', 'skills', 'local-postmortem-gate');
    fs.mkdirSync(privateClaudeSkill, { recursive: true });
    fs.mkdirSync(preservedCodexSkill, { recursive: true });
    fs.writeFileSync(path.join(privateClaudeSkill, 'SKILL.md'), '# private skill\n');
    fs.writeFileSync(path.join(preservedCodexSkill, 'SKILL.md'), '# original codex skill\n');

    const result = runCli(['adapt', '--cwd', repoRoot, '--platform', 'codex'], repoRoot);
    expect(result.status).toBe(0);

    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'cc-roadmap', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'local-postmortem-gate', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.codex', 'skills', 'skill-creator'))).toBe(false);
  });
});
