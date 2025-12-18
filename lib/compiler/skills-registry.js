/**
 * T046: Skills Registry Generator
 *
 * 从 .claude/skills/ 生成 Skills Registry:
 * - 扫描技能目录
 * - 解析 SKILL.md frontmatter
 * - 解析 skill-rules.json triggers
 * - 输出 JSON 和 Markdown table
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// ============================================================
// generateSkillsRegistry - 生成技能注册表
// ============================================================
function generateSkillsRegistry(skillsDir) {
  const registry = [];
  const absoluteDir = path.resolve(skillsDir);

  // 检查目录是否存在
  if (!fs.existsSync(absoluteDir)) {
    return registry;
  }

  // 读取目录内容
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    // 跳过非目录
    if (!entry.isDirectory()) {
      continue;
    }

    const skillDir = path.join(absoluteDir, entry.name);
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    const skillRulesPath = path.join(skillDir, 'skill-rules.json');

    // 必须有 SKILL.md
    if (!fs.existsSync(skillMdPath)) {
      continue;
    }

    try {
      // 解析 SKILL.md frontmatter
      const skillMdContent = fs.readFileSync(skillMdPath, 'utf8');
      const parsed = matter(skillMdContent);

      const skillInfo = {
        name: parsed.data.name || entry.name,
        description: parsed.data.description || '',
        type: parsed.data.type || 'utility',
        path: skillDir,
        triggers: []
      };

      // 解析 skill-rules.json（可选）
      if (fs.existsSync(skillRulesPath)) {
        const rulesContent = fs.readFileSync(skillRulesPath, 'utf8');
        const rules = JSON.parse(rulesContent);
        skillInfo.triggers = rules.triggers || [];
      }

      registry.push(skillInfo);
    } catch (error) {
      // 跳过解析失败的技能
      console.warn(`Warning: Failed to parse skill ${entry.name}: ${error.message}`);
    }
  }

  return registry;
}

// ============================================================
// formatAsMarkdownTable - 转换为 Markdown 表格
// ============================================================
function formatAsMarkdownTable(registry) {
  if (registry.length === 0) {
    return 'No skills registered.';
  }

  const lines = [
    '| Name | Description | Type | Triggers |',
    '|------|-------------|------|----------|'
  ];

  for (const skill of registry) {
    const triggers = skill.triggers
      .map(t => t.keyword || t.pattern || 'N/A')
      .join(', ');

    lines.push(`| ${skill.name} | ${skill.description} | ${skill.type} | ${triggers || 'N/A'} |`);
  }

  return lines.join('\n');
}

module.exports = {
  generateSkillsRegistry,
  formatAsMarkdownTable
};
