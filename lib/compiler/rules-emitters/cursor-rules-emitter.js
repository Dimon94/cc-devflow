/**
 * CursorRulesEmitter - Cursor IDE 规则入口文件生成
 *
 * 输出格式: MDC (Markdown with YAML frontmatter)
 * 输出路径: .cursor/rules/devflow.mdc
 *
 * Reference: REQ-006/TECH_DESIGN.md#CursorMDC
 */
const BaseRulesEmitter = require('./base-rules-emitter');

class CursorRulesEmitter extends BaseRulesEmitter {
  // ----------------------------------------------------------
  // Platform properties
  // ----------------------------------------------------------
  get platform() {
    return 'cursor';
  }

  get outputPath() {
    return '.cursor/rules/devflow.mdc';
  }

  // ----------------------------------------------------------
  // format() - 生成 MDC 格式内容
  // ----------------------------------------------------------
  format(registry, commands) {
    const frontmatter = this.buildFrontmatter(registry);
    const body = this.buildBody(registry, commands);

    return `---
${frontmatter}---

${body}`;
  }

  // ----------------------------------------------------------
  // buildFrontmatter() - 构建 YAML frontmatter
  // ----------------------------------------------------------
  buildFrontmatter(registry) {
    const lines = [
      `description: "CC-DevFlow Rules"`,
      `globs: ["devflow/**/*", ".claude/**/*"]`,
      `alwaysApply: true`
    ];

    return lines.join('\n') + '\n';
  }

  // ----------------------------------------------------------
  // buildBody() - 构建 Markdown 正文
  // ----------------------------------------------------------
  buildBody(registry, commands) {
    const sections = [];

    // 标题
    sections.push('# CC-DevFlow Rules');
    sections.push('');

    // 技能章节
    sections.push('## Available Skills');
    sections.push('');

    if (registry && registry.skills && registry.skills.length > 0) {
      for (const skill of registry.skills) {
        sections.push(`### ${skill.name}`);
        sections.push('');
        sections.push(skill.description || 'No description');
        sections.push('');

        if (skill.triggers?.prompt?.keywords?.length > 0) {
          sections.push(`**Keywords**: ${skill.triggers.prompt.keywords.join(', ')}`);
          sections.push('');
        }
      }
    } else {
      sections.push('No skills registered.');
      sections.push('');
    }

    // 命令章节
    sections.push('## Commands');
    sections.push('');

    if (commands && commands.length > 0) {
      for (const cmd of commands) {
        sections.push(`- \`/${cmd.name}\`: ${cmd.description || 'No description'}`);
      }
      sections.push('');
    } else {
      sections.push('No commands available.');
      sections.push('');
    }

    return sections.join('\n');
  }
}

module.exports = { CursorRulesEmitter };
