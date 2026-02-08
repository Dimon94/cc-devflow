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
 * - Agents: 索引摘要写入 AGENTS.md（保留用户内容）
 * - Rules: 索引摘要写入 AGENTS.md（保留用户内容）
 *
 * v2.0: 支持多模块编译
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');
const BaseEmitter = require('./base-emitter.js');
const { ContextExpander } = require('../context-expander.js');
const { discoverSkillEntries } = require('../skill-discovery.js');

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

    const skills = discoverSkillEntries(sourceDir);

    for (const skill of skills) {
      try {
        const result = await this._emitSingleSkill(
          skill.name,
          skill.skillDir,
          skill.skillMdPath,
          targetDir
        );
        results.push(result);
      } catch (error) {
        console.warn(`Warning: Failed to emit skill ${skill.name}: ${error.message}`);
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
    try {
      await this._copySkillResources(skillDir, targetSkillDir);
    } catch (error) {
      // 资源复制失败不阻塞主 SKILL.md 产物
      console.warn(`Warning: Failed to copy resources for skill ${skillName}: ${error.message}`);
    }

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
      } else if (entry.isSymbolicLink()) {
        try {
          const resolvedPath = await fs.promises.realpath(srcPath);
          const resolvedStats = await fs.promises.stat(resolvedPath);
          await fs.promises.rm(destPath, { force: true, recursive: true });

          if (resolvedStats.isDirectory()) {
            await this._copyDir(resolvedPath, destPath);
          } else {
            await fs.promises.copyFile(resolvedPath, destPath);
          }
        } catch (error) {
          console.warn(`Warning: Skip broken symlink ${srcPath}: ${error.message}`);
        }
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * 编译 Agents 模块
   * .claude/agents/[name].md -> AGENTS.md (短索引，受管块)
   */
  async emitAgents(sourceDir, targetPath) {
    const results = [];
    const agentNames = await this.readMarkdownEntryNames(sourceDir);

    if (agentNames.length === 0) {
      return results;
    }

    const summary = [
      '## CC-DevFlow Agents',
      '',
      '- Scope: `.claude/agents/*.md`',
      `- Count: ${agentNames.length}`,
      `- Entries: ${this.formatCompactList(agentNames)}`,
      '- Policy: Keep AGENTS.md concise as global memory; full agent specs stay in source files.'
    ].join('\n');

    const result = await this.upsertManagedBlock(targetPath, 'codex-agents', summary);
    results.push({ ...result, count: agentNames.length });

    return results;
  }

  /**
   * 编译 Rules 模块
   * .claude/rules/[name].md -> AGENTS.md (短索引，受管块)
   */
  async emitRules(sourceDir, targetPath) {
    const results = [];
    const ruleNames = await this.readMarkdownEntryNames(sourceDir);

    if (ruleNames.length === 0) {
      return results;
    }

    const summary = [
      '## CC-DevFlow Rules',
      '',
      '- Scope: `.claude/rules/*.md`',
      `- Count: ${ruleNames.length}`,
      `- Entries: ${this.formatCompactList(ruleNames)}`,
      '- Policy: AGENTS.md stores only memory-level constraints, not full rule bodies.'
    ].join('\n');

    const result = await this.upsertManagedBlock(targetPath, 'codex-rules', summary);
    results.push({ ...result, count: ruleNames.length });

    return results;
  }
}

module.exports = CodexEmitter;
