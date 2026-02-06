/**
 * T001: Platform Configuration Registry (v2.0)
 *
 * [INPUT]: 无外部依赖
 * [OUTPUT]: PLATFORM_CONFIG, PLATFORMS, getPlatformConfig, isValidPlatform, getRulesEntryPath
 * [POS]: 编译器核心配置，定义四个目标平台的完整编译配置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 定义四个目标平台的编译配置:
 * - cursor: Cursor IDE (.mdc rules, subagents, hooks)
 * - codex: Codex CLI (skills/, prompts/, AGENTS.md)
 * - qwen: Qwen Code (.toml commands, agents/)
 * - antigravity: Antigravity (skills/, workflows/, rules/)
 *
 * v2.0: 支持完整功能模块 (skills, commands, agents, rules, hooks)
 */

// ============================================================
// MODULE_TYPES - 支持的模块类型
// ============================================================
const MODULE_TYPES = ['skills', 'commands', 'agents', 'rules', 'hooks'];

// ============================================================
// PLATFORM_CONFIG - 平台配置注册表 (v2.0)
// ============================================================
const PLATFORM_CONFIG = {
  // ----------------------------------------------------------
  // Codex CLI
  // ----------------------------------------------------------
  codex: {
    name: 'Codex CLI',
    folder: '.codex/',

    // Skills 配置
    skills: {
      dir: 'skills/',
      file: 'SKILL.md',
      frontmatter: 'yaml',
      supportsScripts: true,
      supportsReferences: true
    },

    // Commands → Prompts
    commands: {
      dir: 'prompts/',
      ext: '.md',
      frontmatter: 'yaml',
      argumentPattern: '$ARGUMENTS'
    },

    // Agents → AGENTS.md (项目根目录合并)
    agents: {
      outputFile: 'AGENTS.md',
      mergeMode: 'append'
    },

    // Rules → AGENTS.md (合并到 agents)
    rules: {
      outputFile: 'AGENTS.md',
      mergeMode: 'append'
    },

    // Hooks: 不支持
    hooks: {
      supported: false
    },

    // 旧版兼容字段
    rulesEntry: {
      path: 'skills/cc-devflow/SKILL.md',
      format: 'markdown'
    },
    commandsDir: 'prompts/',
    commandExt: '.md',
    argumentPattern: '$ARGUMENTS',
    hasHooks: false,
    limits: {}
  },

  // ----------------------------------------------------------
  // Cursor IDE
  // ----------------------------------------------------------
  cursor: {
    name: 'Cursor IDE',
    folder: '.cursor/',

    // Skills → Rules (.mdc)
    skills: {
      dir: 'rules/',
      ext: '.mdc',
      frontmatter: 'yaml',
      supportsGlobs: true,
      supportsAlwaysApply: true
    },

    // Commands
    commands: {
      dir: 'commands/',
      ext: '.md',
      frontmatter: null,
      argumentPattern: '$ARGUMENTS'
    },

    // Agents → Subagents
    agents: {
      dir: 'subagents/',
      ext: '.md',
      frontmatter: 'yaml',
      supportsTools: true
    },

    // Rules → Rules (.mdc)
    rules: {
      dir: 'rules/',
      ext: '.mdc',
      frontmatter: 'yaml'
    },

    // Hooks: 支持
    hooks: {
      supported: true,
      configFile: 'hooks.json',
      scriptsDir: 'hooks/',
      events: ['sessionStart', 'preToolUse', 'postToolUse', 'afterFileEdit']
    },

    // MCP 配置
    mcp: {
      supported: true,
      configFile: 'mcp.json'
    },

    // 项目级指令
    projectFile: 'AGENTS.md',

    // 旧版兼容字段
    rulesEntry: {
      path: 'rules/devflow.mdc',
      format: 'mdc'
    },
    commandsDir: 'commands/',
    commandExt: '.md',
    argumentPattern: '$ARGUMENTS',
    hasHooks: true,
    limits: {}
  },

  // ----------------------------------------------------------
  // Qwen Code
  // ----------------------------------------------------------
  qwen: {
    name: 'Qwen Code',
    folder: '.qwen/',

    // Skills → Commands (.toml)
    skills: {
      dir: 'commands/',
      ext: '.toml',
      frontmatter: 'toml',
      supportsNesting: true
    },

    // Commands (.toml)
    commands: {
      dir: 'commands/',
      ext: '.toml',
      frontmatter: 'toml',
      argumentPattern: '{{args}}'
    },

    // Agents
    agents: {
      dir: 'agents/',
      ext: '.md',
      frontmatter: 'yaml',
      supportsTemplating: true
    },

    // Rules → CONTEXT.md
    rules: {
      outputFile: 'CONTEXT.md',
      mergeMode: 'append'
    },

    // Hooks: 不支持
    hooks: {
      supported: false
    },

    // 配置文件
    configFile: 'settings.json',

    // 旧版兼容字段
    rulesEntry: {
      path: 'commands/devflow.toml',
      format: 'toml'
    },
    commandsDir: 'commands/',
    commandExt: '.toml',
    argumentPattern: '{{args}}',
    hasHooks: false,
    limits: {}
  },

  // ----------------------------------------------------------
  // Antigravity
  // ----------------------------------------------------------
  antigravity: {
    name: 'Antigravity',
    folder: '.agent/',

    // Skills
    skills: {
      dir: 'skills/',
      file: 'SKILL.md',
      frontmatter: 'yaml',
      supportsScripts: true,
      supportsReferences: true,
      supportsMetadata: true
    },

    // Commands → Workflows
    commands: {
      dir: 'workflows/',
      ext: '.md',
      frontmatter: 'yaml',
      argumentPattern: '$ARGUMENTS',
      supportsTurbo: true
    },

    // Agents → AGENTS.md
    agents: {
      outputFile: 'AGENTS.md',
      mergeMode: 'append'
    },

    // Rules
    rules: {
      dir: 'rules/',
      ext: '.md',
      frontmatter: null
    },

    // Hooks: 不支持
    hooks: {
      supported: false
    },

    // 旧版兼容字段
    rulesEntry: {
      path: 'rules/rules.md',
      format: 'markdown'
    },
    commandsDir: 'workflows/',
    commandExt: '.md',
    argumentPattern: '$ARGUMENTS',
    hasHooks: false,
    limits: {
      maxFileChars: 12000
    }
  }
};

// ============================================================
// PLATFORMS - 平台名称列表
// ============================================================
const PLATFORMS = Object.keys(PLATFORM_CONFIG);

// ============================================================
// getPlatformConfig - 获取平台配置
// ============================================================
function getPlatformConfig(platform) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}. Valid: ${PLATFORMS.join(', ')}`);
  }
  return config;
}

// ============================================================
// isValidPlatform - 验证平台名有效性
// ============================================================
function isValidPlatform(platform) {
  return PLATFORMS.includes(platform);
}

// ============================================================
// getRulesEntryPath - 获取规则入口文件完整路径
// ============================================================
function getRulesEntryPath(platform) {
  const config = getPlatformConfig(platform);
  return `${config.folder}${config.rulesEntry.path}`;
}

// ============================================================
// getModuleConfig - 获取特定模块的配置
// ============================================================
function getModuleConfig(platform, moduleType) {
  const config = getPlatformConfig(platform);
  const moduleConfig = config[moduleType];

  if (!moduleConfig) {
    return null;
  }

  return moduleConfig;
}

// ============================================================
// isModuleSupported - 检查平台是否支持特定模块
// ============================================================
function isModuleSupported(platform, moduleType) {
  const moduleConfig = getModuleConfig(platform, moduleType);

  if (!moduleConfig) {
    return false;
  }

  // hooks 模块需要检查 supported 字段
  if (moduleType === 'hooks') {
    return moduleConfig.supported === true;
  }

  return true;
}

// ============================================================
// getOutputPath - 获取模块输出路径
// ============================================================
function getOutputPath(platform, moduleType, filename = '') {
  const config = getPlatformConfig(platform);
  const moduleConfig = config[moduleType];

  if (!moduleConfig) {
    return null;
  }

  // 合并模式 (AGENTS.md, CONTEXT.md)
  if (moduleConfig.outputFile) {
    return moduleConfig.outputFile;
  }

  // 目录模式
  if (moduleConfig.dir) {
    const ext = moduleConfig.ext || '';
    return `${config.folder}${moduleConfig.dir}${filename}${ext}`;
  }

  return null;
}

module.exports = {
  PLATFORM_CONFIG,
  PLATFORMS,
  MODULE_TYPES,
  getPlatformConfig,
  isValidPlatform,
  getRulesEntryPath,
  getModuleConfig,
  isModuleSupported,
  getOutputPath
};
