/**
 * [INPUT]: 用户级、项目级、本地 YAML 配置，以及 env / CLI 覆盖。
 * [OUTPUT]: 运行时输出策略、key 级来源 trace、配置读写与 doctor 结果。
 * [POS]: skill runtime 的个人配置真相源，避免把个人偏好烘进 Skill 文件。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');

const USER_CONFIG_RELATIVE_PATH = path.join('.cc-devflow', 'config.yml');
const PROJECT_CONFIG_RELATIVE_PATH = path.join('.cc-devflow', 'config.yml');
const LOCAL_CONFIG_RELATIVE_PATH = path.join('.cc-devflow', 'config.local.yml');
const CONFIG_TEMPLATE_PATH = path.resolve(__dirname, '..', '..', 'config', 'user-config.template.yml');
const SUPPORTED_DOCUMENT_LANGUAGES = new Set(['en', 'zh-CN']);

const DEFAULT_CONFIG = {
  version: 1,
  output: {
    document_language: 'en'
  },
  agent_preferences: {}
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function traceValue(value) {
  if (Array.isArray(value) || isPlainObject(value)) {
    return JSON.stringify(value);
  }

  return String(value);
}

function readYamlConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  let parsed;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    parsed = yaml.load(content) || {};
  } catch (error) {
    throw new Error(`Failed to parse cc-devflow config ${filePath}: ${error.message}`);
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`cc-devflow config must be a YAML object: ${filePath}`);
  }

  validateConfigShape(parsed, filePath);
  return parsed;
}

function validateConfigShape(config, source = 'config') {
  const allowedRootKeys = new Set(['version', 'output', 'agent_preferences']);

  for (const key of Object.keys(config || {})) {
    if (!allowedRootKeys.has(key)) {
      throw new Error(`Unsupported config key "${key}" in ${source}. Put custom fields under agent_preferences.`);
    }
  }

  if ('version' in config && config.version !== 1) {
    throw new Error(`Unsupported config version "${config.version}" in ${source}. Expected version: 1.`);
  }

  if ('output' in config) {
    if (!isPlainObject(config.output)) {
      throw new Error(`output must be an object in ${source}`);
    }

    for (const key of Object.keys(config.output)) {
      if (key !== 'document_language') {
        throw new Error(`Unsupported output key "output.${key}" in ${source}`);
      }
    }

    if (
      'document_language' in config.output
      && !SUPPORTED_DOCUMENT_LANGUAGES.has(config.output.document_language)
    ) {
      throw new Error(
        `Unsupported output.document_language "${config.output.document_language}" in ${source}. Use en or zh-CN.`
      );
    }
  }

  if ('agent_preferences' in config && !isPlainObject(config.agent_preferences)) {
    throw new Error(`agent_preferences must be an object in ${source}`);
  }
}

function pushTrace(trace, source, sourcePath, key, value) {
  trace.push({
    key,
    value: traceValue(value),
    source,
    path: sourcePath || null
  });
}

function applyConfigLayer(base, layer, trace, source, sourcePath, prefix = '') {
  const next = Array.isArray(base) ? [...base] : { ...(base || {}) };

  for (const [key, value] of Object.entries(layer || {})) {
    const traceKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      next[key] = applyConfigLayer(
        isPlainObject(next[key]) ? next[key] : {},
        value,
        trace,
        source,
        sourcePath,
        traceKey
      );
      continue;
    }

    next[key] = Array.isArray(value) ? [...value] : value;
    pushTrace(trace, source, sourcePath, traceKey, next[key]);
  }

  return next;
}

function collectConfigSources(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const homeDir = path.resolve(options.homeDir || os.homedir());

  return [
    {
      kind: 'user',
      path: path.join(homeDir, USER_CONFIG_RELATIVE_PATH)
    },
    {
      kind: 'project',
      path: path.join(cwd, PROJECT_CONFIG_RELATIVE_PATH)
    },
    {
      kind: 'local',
      path: path.join(cwd, LOCAL_CONFIG_RELATIVE_PATH)
    }
  ];
}

function envToConfig(env = process.env) {
  const documentLanguage = env.CC_DEVFLOW_DOCUMENT_LANGUAGE
    || env.CC_DEVFLOW_OUTPUT_DOCUMENT_LANGUAGE;

  if (!documentLanguage) {
    return null;
  }

  return {
    output: {
      document_language: documentLanguage
    }
  };
}

function resolveUserConfig(options = {}) {
  const trace = [];
  const sources = [];
  let config = applyConfigLayer({}, DEFAULT_CONFIG, trace, 'default', null);

  for (const source of collectConfigSources(options)) {
    const value = readYamlConfig(source.path);
    if (!value) {
      continue;
    }

    config = applyConfigLayer(config, value, trace, source.kind, source.path);
    sources.push(source);
  }

  const envConfig = envToConfig(options.env || process.env);
  if (envConfig) {
    validateConfigShape(envConfig, 'environment');
    config = applyConfigLayer(config, envConfig, trace, 'env', null);
    sources.push({ kind: 'env', path: null });
  }

  if (options.overrides && Object.keys(options.overrides).length > 0) {
    validateConfigShape(options.overrides, 'CLI overrides');
    config = applyConfigLayer(config, options.overrides, trace, 'cli', null);
    sources.push({ kind: 'cli', path: null });
  }

  validateConfigShape(config, 'resolved config');

  return {
    enabled: sources.length > 0,
    config,
    sources,
    trace,
    policy: renderOutputPolicy(config)
  };
}

function formatPreferenceLines(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.map((item) => `- ${prefix}: ${traceValue(item)}`);
  }

  if (!isPlainObject(value)) {
    return [`- ${prefix}: ${traceValue(value)}`];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return formatPreferenceLines(child, nextPrefix);
  });
}

function renderOutputPolicy(config = DEFAULT_CONFIG) {
  const documentLanguage = config.output?.document_language || DEFAULT_CONFIG.output.document_language;
  const lines = [
    '## CC-DevFlow Output Policy',
    '',
    'Machine-enforced fields: output.document_language',
    `- Output language: ${documentLanguage}`,
    `- Durable Markdown artifacts must include \`Output language: ${documentLanguage}\` in their metadata or first screen.`,
    '',
    'Agent advisory preferences:'
  ];

  const preferences = config.agent_preferences || {};
  const preferenceLines = formatPreferenceLines(preferences);

  if (preferenceLines.length === 0) {
    lines.push('- none');
  } else {
    lines.push(...preferenceLines);
  }

  return `${lines.join('\n')}\n`;
}

function getConfigPath(scope, options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const homeDir = path.resolve(options.homeDir || os.homedir());

  if (scope === 'user') {
    return path.join(homeDir, USER_CONFIG_RELATIVE_PATH);
  }

  if (scope === 'local') {
    return path.join(cwd, LOCAL_CONFIG_RELATIVE_PATH);
  }

  if (scope !== 'project') {
    throw new Error(`Unknown config scope "${scope}". Use user, project, or local.`);
  }

  return path.join(cwd, PROJECT_CONFIG_RELATIVE_PATH);
}

function getConfigValue(config, keyPath) {
  return String(keyPath || '')
    .split('.')
    .filter(Boolean)
    .reduce((value, key) => (value == null ? undefined : value[key]), config);
}

function setNestedValue(target, keyPath, value) {
  const parts = String(keyPath || '').split('.').filter(Boolean);
  if (parts.length === 0) {
    throw new Error('Config key is required.');
  }

  let cursor = target;
  for (const key of parts.slice(0, -1)) {
    if (!isPlainObject(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }

  cursor[parts[parts.length - 1]] = value;
}

function coerceConfigValue(keyPath, value) {
  if (keyPath === 'output.document_language') {
    if (!SUPPORTED_DOCUMENT_LANGUAGES.has(value)) {
      throw new Error(`Unsupported output.document_language "${value}". Use en or zh-CN.`);
    }
  }

  return value;
}

function writeYamlConfig(filePath, config) {
  validateConfigShape(config, filePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, yaml.dump(config, { lineWidth: 100, noRefs: true }), 'utf8');
}

function setConfigValue(keyPath, value, options = {}) {
  if (keyPath !== 'output.document_language' && !keyPath.startsWith('agent_preferences.')) {
    throw new Error('Only output.document_language and agent_preferences.* can be set.');
  }

  const filePath = getConfigPath(options.scope || 'project', options);
  const config = readYamlConfig(filePath) || { version: 1 };
  setNestedValue(config, keyPath, coerceConfigValue(keyPath, value));
  writeYamlConfig(filePath, config);
  return filePath;
}

function writeConfigTemplate(options = {}) {
  const scope = options.scope || 'project';
  const filePath = getConfigPath(scope, options);

  if (fs.existsSync(filePath) && !options.force) {
    return filePath;
  }

  const template = readYamlConfig(CONFIG_TEMPLATE_PATH);

  writeYamlConfig(filePath, template);
  return filePath;
}

function isLocalConfigIgnored(repoRoot) {
  const gitignorePath = path.join(repoRoot, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    return false;
  }

  const lines = fs.readFileSync(gitignorePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  return lines.includes('.cc-devflow/config.local.yml')
    || lines.includes('/.cc-devflow/config.local.yml')
    || lines.includes('.cc-devflow/');
}

function doctorUserConfig(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const resolved = resolveUserConfig(options);
  const warnings = [];
  const localPath = path.join(cwd, LOCAL_CONFIG_RELATIVE_PATH);

  if (fs.existsSync(localPath) && !isLocalConfigIgnored(cwd)) {
    warnings.push('.cc-devflow/config.local.yml exists but is not ignored by .gitignore.');
  }

  return {
    ok: warnings.length === 0,
    warnings,
    resolved
  };
}

module.exports = {
  DEFAULT_CONFIG,
  CONFIG_TEMPLATE_PATH,
  LOCAL_CONFIG_RELATIVE_PATH,
  PROJECT_CONFIG_RELATIVE_PATH,
  SUPPORTED_DOCUMENT_LANGUAGES,
  USER_CONFIG_RELATIVE_PATH,
  doctorUserConfig,
  getConfigPath,
  getConfigValue,
  readYamlConfig,
  renderOutputPolicy,
  resolveUserConfig,
  setConfigValue,
  writeConfigTemplate
};
