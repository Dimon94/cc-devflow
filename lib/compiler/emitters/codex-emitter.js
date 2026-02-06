/**
 * T032: CodexEmitter - Codex 平台输出 (v2.0)
 *
 * [INPUT]: CommandIR, SKILL.md, agents/*.md, rules/*.md
 * [OUTPUT]: .codex/prompts/*.md, .codex/skills/*, AGENTS.md
 * [POS]: Codex CLI 平台编译器，支持完整功能模块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 输出格式:
 * - Commands: Markdown + YAML frontmatter → .codex/prompts/
 * - Skills: SKILL.md (YAML frontmatter) → .codex/skills/
 * - Agents: 合并到 AGENTS.md
 * - Rules: 合并到 AGENTS.md
 *
 * v2.0: 支持多模块编译
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');
const BaseEmitter = require('./base-emitter.js');
const { ContextExpander } = require('../context-expander.js');

class CodexEmitter extends BaseEmitter {
  get name() {
    return 'codex';
  }

  get outputDir() {
    return '.codex/prompts';
  }

  get fileExtension() {
    return '.md';
  }

  /**
   * 格式化为 Codex 格式
   * - YAML frontmatter: description, argument-hint
   * - Markdown body
   */
  format(ir, transformedContent) {
    const frontmatterData = {
      description: ir.frontmatter.description
    };

    // 添加 argument-hint（如有 scripts）
    if (ir.frontmatter.scripts) {
      const aliases = Object.keys(ir.frontmatter.scripts);
      if (aliases.length > 0) {
        frontmatterData['argument-hint'] = aliases.join(', ');
      }
    }

    const yamlStr = yaml.dump(frontmatterData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });

    return `---\n${yamlStr}---\n\n${transformedContent}`;
  }

  // ----------------------------------------------------------
  // Multi-Module Emit Methods (v2.0)
  // ----------------------------------------------------------

  /**
   * 编译 Skills 模块
   * .claude/skills/[name]/SKILL.md -> .codex/skills/[name]/SKILL.md
   */
  async emitSkills(sourceDir, targetDir) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    // 扫描技能分组目录 (workflow/, domain/, utility/, guardrail/)
    const groupDirs = await fs.promises.readdir(sourceDir, { withFileTypes: true });

    for (const groupEntry of groupDirs) {
      if (!groupEntry.isDirectory() || groupEntry.name.startsWith('_')) {
        continue;
      }

      const groupDir = path.join(sourceDir, groupEntry.name);
      const skillEntries = await fs.promises.readdir(groupDir, { withFileTypes: true });

      for (const skillEntry of skillEntries) {
        if (!skillEntry.isDirectory() || skillEntry.name.startsWith('_')) {
          continue;
        }

        const skillDir = path.join(groupDir, skillEntry.name);
        const skillMdPath = path.join(skillDir, 'SKILL.md');

        if (!fs.existsSync(skillMdPath)) {
          continue;
        }

        try {
          const result = await this._emitSingleSkill(
            skillEntry.name,
            skillDir,
            skillMdPath,
            targetDir
          );
          results.push(result);
        } catch (error) {
          console.warn(`Warning: Failed to emit skill ${skillEntry.name}: ${error.message}`);
        }
      }
    }

    return results;
  }

  /**
   * 编译单个 Skill
   */
  async _emitSingleSkill(skillName, skillDir, skillMdPath, targetDir) {
    const content = await fs.promises.readFile(skillMdPath, 'utf8');
    const parsed = matter(content);

    // 展开 context.jsonl
    const contextExpanded = ContextExpander.expandFromSkillDir(skillDir, 'codex');

    // 确保 frontmatter 格式正确
    const frontmatterData = {
      name: parsed.data.name || skillName,
      description: parsed.data.description || ''
    };

    const yamlStr = yaml.dump(frontmatterData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });

    // 组合最终内容：frontmatter + context + body
    let body = parsed.content;
    if (contextExpanded) {
      body = contextExpanded + '\n' + body;
    }

    const finalContent = `---\n${yamlStr}---\n\n${body}`;

    // 输出到 .codex/skills/<skill-name>/SKILL.md
    const targetSkillDir = path.join(targetDir, skillName);
    const targetPath = path.join(targetSkillDir, 'SKILL.md');

    const result = await this.emitToPath(targetPath, finalContent);

    // 复制 scripts/ 和 references/ 目录
    await this._copySkillResources(skillDir, targetSkillDir);

    return { ...result, skillName };
  }

  /**
   * 复制 Skill 资源目录
   */
  async _copySkillResources(sourceSkillDir, targetSkillDir) {
    const resourceDirs = ['scripts', 'references', 'assets'];

    for (const dir of resourceDirs) {
      const sourceResDir = path.join(sourceSkillDir, dir);
      const targetResDir = path.join(targetSkillDir, dir);

      if (fs.existsSync(sourceResDir)) {
        await this._copyDir(sourceResDir, targetResDir);
      }
    }
  }

  /**
   * 递归复制目录
   */
  async _copyDir(src, dest) {
    await fs.promises.mkdir(dest, { recursive: true, mode: 0o755 });
    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this._copyDir(srcPath, destPath);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * 编译 Agents 模块
   * .claude/agents/[name].md -> AGENTS.md (合并)
   */
  async emitAgents(sourceDir, targetPath) {
    return this._defaultAgentsEmit(sourceDir, targetPath);
  }

  /**
   * 编译 Rules 模块
   * .claude/rules/[name].md -> AGENTS.md (追加)
   */
  async emitRules(sourceDir, targetPath) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
    const sections = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        continue;
      }

      const filePath = path.join(sourceDir, entry.name);
      const content = await fs.promises.readFile(filePath, 'utf8');
      const ruleName = entry.name.replace('.md', '');

      sections.push(`### ${ruleName}\n\n${content}`);
    }

    if (sections.length > 0) {
      // 追加到现有 AGENTS.md
      let existingContent = '';
      if (fs.existsSync(targetPath)) {
        existingContent = await fs.promises.readFile(targetPath, 'utf8');
      }

      const rulesSection = `\n\n## Rules\n\n${sections.join('\n\n---\n\n')}`;
      const merged = existingContent + rulesSection;

      const result = await this.emitToPath(targetPath, merged);
      results.push(result);
    }

    return results;
  }
}

module.exports = CodexEmitter;
