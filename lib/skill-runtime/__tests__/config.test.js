/**
 * [INPUT]: 临时 home/repo 配置、env 覆盖与 CLI 等价写入操作。
 * [OUTPUT]: 验证运行时个人配置解析、校验、trace、policy 与写入行为。
 * [POS]: skill runtime 个人配置的单元测试。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  LOCAL_CONFIG_RELATIVE_PATH,
  PROJECT_CONFIG_RELATIVE_PATH,
  USER_CONFIG_RELATIVE_PATH,
  getConfigValue,
  resolveUserConfig,
  setConfigValue,
  writeConfigTemplate
} = require('../config.js');

describe('skill-runtime user config', () => {
  let tmpRoot;
  let homeDir;
  let repoRoot;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-runtime-config-'));
    homeDir = path.join(tmpRoot, 'home');
    repoRoot = path.join(tmpRoot, 'repo');
    fs.mkdirSync(path.join(homeDir, '.cc-devflow'), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, '.cc-devflow'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('resolves document language with default, file, env, and cli precedence trace', () => {
    fs.writeFileSync(
      path.join(homeDir, USER_CONFIG_RELATIVE_PATH),
      [
        'version: 1',
        'output:',
        '  document_language: en',
        'agent_preferences:',
        '  planning:',
        '    - Keep plans short.',
        ''
      ].join('\n')
    );
    fs.writeFileSync(
      path.join(repoRoot, PROJECT_CONFIG_RELATIVE_PATH),
      [
        'version: 1',
        'output:',
        '  document_language: zh-CN',
        ''
      ].join('\n')
    );
    fs.writeFileSync(
      path.join(repoRoot, LOCAL_CONFIG_RELATIVE_PATH),
      [
        'version: 1',
        'agent_preferences:',
        '  review:',
        '    order: severe-first',
        ''
      ].join('\n')
    );

    const result = resolveUserConfig({
      cwd: repoRoot,
      homeDir,
      env: {
        CC_DEVFLOW_DOCUMENT_LANGUAGE: 'en'
      },
      overrides: {
        output: {
          document_language: 'zh-CN'
        }
      }
    });

    expect(result.config.output.document_language).toBe('zh-CN');
    expect(result.config.agent_preferences.planning).toEqual(['Keep plans short.']);
    expect(result.config.agent_preferences.review.order).toBe('severe-first');
    expect(result.sources.map((source) => source.kind)).toEqual(['user', 'project', 'local', 'env', 'cli']);
    expect(result.trace.map((entry) => `${entry.source}:${entry.key}:${entry.value}`)).toEqual([
      'default:version:1',
      'default:output.document_language:en',
      'user:version:1',
      'user:output.document_language:en',
      'user:agent_preferences.planning:["Keep plans short."]',
      'project:version:1',
      'project:output.document_language:zh-CN',
      'local:version:1',
      'local:agent_preferences.review.order:severe-first',
      'env:output.document_language:en',
      'cli:output.document_language:zh-CN'
    ]);
    expect(result.policy).toContain('Output language: zh-CN');
    expect(result.policy).toContain('Machine-enforced fields: output.document_language');
    expect(result.policy).toContain('Agent advisory preferences');
  });

  test('rejects unsupported language and unknown top-level fields', () => {
    fs.writeFileSync(
      path.join(repoRoot, PROJECT_CONFIG_RELATIVE_PATH),
      [
        'version: 1',
        'output:',
        '  document_language: klingon',
        ''
      ].join('\n')
    );

    expect(() => resolveUserConfig({ cwd: repoRoot, homeDir })).toThrow(/output.document_language/);

    fs.writeFileSync(
      path.join(repoRoot, PROJECT_CONFIG_RELATIVE_PATH),
      [
        'version: 1',
        'preferences:',
        '  general:',
        '    - non standard root',
        ''
      ].join('\n')
    );

    expect(() => resolveUserConfig({ cwd: repoRoot, homeDir })).toThrow(/Unsupported config key/);
  });

  test('wraps invalid YAML errors with the config path', () => {
    const configPath = path.join(repoRoot, PROJECT_CONFIG_RELATIVE_PATH);
    fs.writeFileSync(configPath, 'version: 1\noutput:\n  document_language: [\n');

    expect(() => resolveUserConfig({ cwd: repoRoot, homeDir })).toThrow(configPath);
  });

  test('reads and writes config values without losing advisory preferences', () => {
    const configPath = writeConfigTemplate({ scope: 'project', cwd: repoRoot, homeDir });
    expect(configPath).toBe(path.join(repoRoot, PROJECT_CONFIG_RELATIVE_PATH));

    setConfigValue('output.document_language', 'en', { scope: 'project', cwd: repoRoot, homeDir });
    setConfigValue('agent_preferences.documentation.voice', 'direct', {
      scope: 'project',
      cwd: repoRoot,
      homeDir
    });

    const resolved = resolveUserConfig({ cwd: repoRoot, homeDir });

    expect(getConfigValue(resolved.config, 'output.document_language')).toBe('en');
    expect(getConfigValue(resolved.config, 'agent_preferences.documentation.voice')).toBe('direct');
  });

  test('rejects unknown config scopes instead of silently writing project config', () => {
    expect(() => writeConfigTemplate({ scope: 'team', cwd: repoRoot, homeDir })).toThrow(/Unknown config scope/);
  });
});
