/**
 * CodexRulesEmitter - Codex 规则入口文件生成
 *
 * 输出格式: SKILL.md (Markdown with YAML frontmatter)
 * 输出路径: .codex/skills/cc-devflow/SKILL.md
 *
 * Reference: REQ-006/TECH_DESIGN.md#CodexSKILL
 */
const BaseRulesEmitter = require('./base-rules-emitter');

class CodexRulesEmitter extends BaseRulesEmitter {
  // ----------------------------------------------------------
  // Platform properties
  // ----------------------------------------------------------
  get platform() {
    return 'codex';
  }

  get outputPath() {
    return '.codex/skills/cc-devflow/SKILL.md';
  }

  // ----------------------------------------------------------
  // format() - 生成 SKILL.md 格式内容
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
  buildFrontmatter(_registry) {
    const lines = [
      `name: cc-devflow`,
      `description: CC-DevFlow development workflow system`,
      `type: domain`
    ];

    return lines.join('\n') + '\n';
  }

  // ----------------------------------------------------------
  // buildBody() - 构建 Markdown 正文
  // ----------------------------------------------------------
  buildBody(registry, commands) {
    const sections = [];

    // 标题
    sections.push('# cc-devflow');
    sections.push('');
    sections.push('CC-DevFlow development workflow system for structured requirement management.');
    sections.push('');

    // 技能章节
    sections.push('## Skills');
    sections.push('');

    if (registry && registry.skills && registry.skills.length > 0) {
      sections.push('| Name | Description | Type | Enforcement | Priority |');
      sections.push('|------|-------------|------|-------------|----------|');

      for (const skill of registry.skills) {
        sections.push(
          `| ${skill.name} | ${skill.description || '-'} | ${skill.type} | ${skill.enforcement || 'suggest'} | ${skill.priority || 'medium'} |`
        );
      }
      sections.push('');
    } else {
      sections.push('No skills registered.');
      sections.push('');
    }

    // 命令章节
    sections.push('## Commands');
    sections.push('');

    if (commands && commands.length > 0) {
      sections.push('| Command | Description |');
      sections.push('|---------|-------------|');

      for (const cmd of commands) {
        sections.push(`| /${cmd.name} | ${cmd.description || '-'} |`);
      }
      sections.push('');
    } else {
      sections.push('No commands available.');
      sections.push('');
    }

    // 使用说明
    sections.push('## Usage');
    sections.push('');
    sections.push('```bash');
    sections.push('# Start a new requirement');
    sections.push('/flow-init "REQ-XXX|Title|URL"');
    sections.push('');
    sections.push('# Generate PRD');
    sections.push('/flow-prd "REQ-XXX"');
    sections.push('');
    sections.push('# Run development workflow');
    sections.push('/flow-dev "REQ-XXX"');
    sections.push('```');
    sections.push('');

    return sections.join('\n');
  }
}

module.exports = { CodexRulesEmitter };
