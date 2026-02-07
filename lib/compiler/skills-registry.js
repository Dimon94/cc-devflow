/**
 * Skills Registry Generator V2
 *
 * 从 .claude/skills/ 生成 Skills Registry:
 * - 扫描技能目录提取 SKILL.md frontmatter
 * - 合并 skill-rules.json 触发规则
 * - 输出标准化 SkillRegistry JSON
 *
 * Reference: REQ-006/data-model.md#SkillRegistry
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { discoverSkillEntries } = require('./skill-discovery.js');

// ============================================================
// Constants
// ============================================================
const REGISTRY_VERSION = '1.0';
const REGISTRY_OUTPUT_PATH = 'devflow/.generated/skills-registry.json';

// ============================================================
// generateSkillsRegistry - 保留向后兼容
// ============================================================
function generateSkillsRegistry(skillsDir) {
  const registry = [];
  const skillEntries = discoverSkillEntries(skillsDir);

  for (const entry of skillEntries) {
    try {
      const skillMdContent = fs.readFileSync(entry.skillMdPath, 'utf8');
      const parsed = matter(skillMdContent);

      registry.push({
        name: parsed.data.name || entry.name,
        description: parsed.data.description || '',
        type: parsed.data.type || 'utility',
        path: entry.skillDir,
        triggers: []
      });
    } catch (error) {
      console.warn(`Warning: Failed to parse skill ${entry.name}: ${error.message}`);
    }
  }

  return registry;
}

// ============================================================
// generateSkillsRegistryV2 - 合并 skill-rules.json + SKILL.md
// ============================================================
async function generateSkillsRegistryV2(skillsDir) {
  const absoluteDir = path.resolve(skillsDir);
  const skills = [];

  // 读取顶层 skill-rules.json
  const skillRulesPath = path.join(absoluteDir, 'skill-rules.json');
  let skillRules = { skills: {} };

  if (fs.existsSync(skillRulesPath)) {
    try {
      const content = fs.readFileSync(skillRulesPath, 'utf8');
      skillRules = JSON.parse(content);
    } catch (error) {
      console.warn(`Warning: Failed to parse skill-rules.json: ${error.message}`);
    }
  }

  // 扫描技能目录（支持分组与非分组结构）
  const entries = discoverSkillEntries(absoluteDir);

  for (const entry of entries) {
    try {
      const skillEntry = parseSkillEntry(entry.name, entry.skillDir, entry.skillMdPath, skillRules);
      if (skillEntry) {
        skills.push(skillEntry);
      }
    } catch (error) {
      console.warn(`Warning: Failed to parse skill ${entry.name}: ${error.message}`);
    }
  }

  return createRegistry(skills);
}

// ============================================================
// parseSkillEntry - 解析单个技能
// ============================================================
function parseSkillEntry(skillName, _skillDir, skillMdPath, skillRules) {
  const skillMdContent = fs.readFileSync(skillMdPath, 'utf8');
  const parsed = matter(skillMdContent);

  // 从 skill-rules.json 获取额外配置
  const ruleConfig = skillRules.skills?.[skillName] || {};

  // 合并 SKILL.md frontmatter 与 skill-rules.json
  const entry = {
    name: parsed.data.name || skillName,
    description: parsed.data.description || ruleConfig.description || '',
    type: ruleConfig.type || parsed.data.type || 'utility',
    enforcement: ruleConfig.enforcement || 'suggest',
    priority: ruleConfig.priority || 'medium',
    skillPath: path.relative(process.cwd(), skillMdPath),
    triggers: buildTriggers(ruleConfig)
  };

  return entry;
}

// ============================================================
// buildTriggers - 构建触发器结构
// ============================================================
function buildTriggers(ruleConfig) {
  const triggers = {};

  // Prompt triggers
  if (ruleConfig.promptTriggers) {
    triggers.prompt = {
      keywords: ruleConfig.promptTriggers.keywords || [],
      intentPatterns: ruleConfig.promptTriggers.intentPatterns || []
    };
  }

  // File triggers
  if (ruleConfig.fileTriggers) {
    triggers.file = {
      pathPatterns: ruleConfig.fileTriggers.pathPatterns || [],
      contentPatterns: ruleConfig.fileTriggers.contentPatterns || []
    };
  }

  return triggers;
}

// ============================================================
// createRegistry - 创建注册表结构
// ============================================================
function createRegistry(skills) {
  return {
    version: REGISTRY_VERSION,
    generatedAt: new Date().toISOString(),
    skills
  };
}

// ============================================================
// writeSkillsRegistry - 写入注册表文件
// ============================================================
async function writeSkillsRegistry(registry) {
  const outputDir = path.dirname(REGISTRY_OUTPUT_PATH);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(REGISTRY_OUTPUT_PATH, JSON.stringify(registry, null, 2));

  return REGISTRY_OUTPUT_PATH;
}

// ============================================================
// formatAsMarkdownTable - 转换为 Markdown 表格
// ============================================================
function formatAsMarkdownTable(registry) {
  const skills = registry.skills || registry;

  if (skills.length === 0) {
    return 'No skills registered.';
  }

  const lines = [
    '| Name | Description | Type | Enforcement | Priority |',
    '|------|-------------|------|-------------|----------|'
  ];

  for (const skill of skills) {
    lines.push(
      `| ${skill.name} | ${skill.description} | ${skill.type} | ${skill.enforcement || 'suggest'} | ${skill.priority || 'medium'} |`
    );
  }

  return lines.join('\n');
}

module.exports = {
  generateSkillsRegistry,
  generateSkillsRegistryV2,
  writeSkillsRegistry,
  formatAsMarkdownTable,
  REGISTRY_VERSION,
  REGISTRY_OUTPUT_PATH
};
