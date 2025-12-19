/**
 * T001: Platform Configuration Registry
 *
 * 定义四个目标平台的编译配置:
 * - cursor: Cursor IDE (.mdc format)
 * - codex: Codex CLI (SKILL.md format)
 * - qwen: Qwen Code (.toml format)
 * - antigravity: Antigravity (.md with 12K limit)
 *
 * Reference: data-model.md#PlatformConfig
 */

// ============================================================
// PLATFORM_CONFIG - 平台配置注册表
// ============================================================
const PLATFORM_CONFIG = {
  cursor: {
    name: 'Cursor IDE',
    folder: '.cursor/',
    rulesEntry: {
      path: 'rules/devflow.mdc',
      format: 'mdc'
    },
    commandsDir: 'commands/',
    commandExt: '.md',
    argumentPattern: '$ARGUMENTS',
    hasHooks: false,
    limits: {}
  },

  codex: {
    name: 'Codex CLI',
    folder: '.codex/',
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

  qwen: {
    name: 'Qwen Code',
    folder: '.qwen/',
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

  antigravity: {
    name: 'Antigravity',
    folder: '.agent/',
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

module.exports = {
  PLATFORM_CONFIG,
  PLATFORMS,
  getPlatformConfig,
  isValidPlatform,
  getRulesEntryPath
};
