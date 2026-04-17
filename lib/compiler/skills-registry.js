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

// ============================================================
// Constants
// ============================================================
const REGISTRY_VERSION = '1.0';
const REGISTRY_OUTPUT_PATH = 'devflow/.generated/skills-registry.json';

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeReroutes(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const when = String(item.when || '').trim();
      const target = String(item.target || '').trim();
      if (!when || !target) {
        return null;
      }

      return { when, target };
    })
    .filter(Boolean);
}

function normalizeRecoveryModes(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const name = String(item.name || '').trim();
      const when = String(item.when || '').trim();
      const action = String(item.action || '').trim();
      if (!name || !when || !action) {
        return null;
      }

      return { name, when, action };
    })
    .filter(Boolean);
}

function normalizeToolBudget(value) {
  const source = value && typeof value === 'object' ? value : {};
  const normalized = {};

  for (const key of ['read_files', 'search_steps', 'shell_commands']) {
    const next = Number(source[key]);
    if (Number.isFinite(next) && next >= 0) {
      normalized[key] = next;
    }
  }

  return normalized;
}

// ============================================================
// generateSkillsRegistry - 保留向后兼容
// ============================================================
function generateSkillsRegistry(skillsDir) {
  const registry = [];
  const absoluteDir = path.resolve(skillsDir);

  if (!fs.existsSync(absoluteDir)) {
    return registry;
  }

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) {
      continue;
    }

    const skillDir = path.join(absoluteDir, entry.name);
    const skillMdPath = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
      continue;
    }

    try {
      const skillMdContent = fs.readFileSync(skillMdPath, 'utf8');
      const parsed = matter(skillMdContent);

      registry.push({
        name: parsed.data.name || entry.name,
        description: parsed.data.description || '',
        type: parsed.data.type || 'utility',
        path: skillDir,
        triggers: normalizeStringList(parsed.data.triggers),
        reads: normalizeStringList(parsed.data.reads),
        writes: normalizeStringList(parsed.data.writes),
        entryGate: normalizeStringList(parsed.data.entry_gate),
        exitCriteria: normalizeStringList(parsed.data.exit_criteria),
        reroutes: normalizeReroutes(parsed.data.reroutes),
        recoveryModes: normalizeRecoveryModes(parsed.data.recovery_modes),
        toolBudget: normalizeToolBudget(parsed.data.tool_budget)
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

  // 扫描技能目录
  if (!fs.existsSync(absoluteDir)) {
    return createRegistry(skills);
  }

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    // 跳过非目录和 _ 前缀目录
    if (!entry.isDirectory() || entry.name.startsWith('_')) {
      continue;
    }

    const skillDir = path.join(absoluteDir, entry.name);
    const skillMdPath = path.join(skillDir, 'SKILL.md');

    // 必须有 SKILL.md
    if (!fs.existsSync(skillMdPath)) {
      continue;
    }

    try {
      const skillEntry = parseSkillEntry(entry.name, skillDir, skillMdPath, skillRules);
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
    triggers: buildTriggers(ruleConfig, parsed.data.triggers),
    reads: normalizeStringList(parsed.data.reads),
    writes: normalizeStringList(parsed.data.writes),
    entryGate: normalizeStringList(parsed.data.entry_gate),
    exitCriteria: normalizeStringList(parsed.data.exit_criteria),
    reroutes: normalizeReroutes(parsed.data.reroutes),
    recoveryModes: normalizeRecoveryModes(parsed.data.recovery_modes),
    toolBudget: normalizeToolBudget(parsed.data.tool_budget)
  };

  return entry;
}

// ============================================================
// buildTriggers - 构建触发器结构
// ============================================================
function buildTriggers(ruleConfig, frontmatterTriggers = []) {
  const triggers = {};
  const promptKeywords = normalizeStringList(frontmatterTriggers);

  // Prompt triggers
  if (ruleConfig.promptTriggers || promptKeywords.length > 0) {
    triggers.prompt = {
      keywords: [...new Set([...(ruleConfig.promptTriggers?.keywords || []), ...promptKeywords])],
      intentPatterns: ruleConfig.promptTriggers?.intentPatterns || []
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
