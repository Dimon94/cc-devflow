/**
 * T034: QwenEmitter - Qwen 平台输出 (v2.0)
 *
 * [INPUT]: CommandIR, SKILL.md, agents, rules
 * [OUTPUT]: .qwen/commands/*.toml, .qwen/agents/*.md, CONTEXT.md
 * [POS]: Qwen Code 平台编译器，支持完整功能模块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 输出格式:
 * - Commands: TOML -> .qwen/commands/
 * - Skills: TOML -> .qwen/commands/
 * - Agents: Markdown (YAML frontmatter) -> .qwen/agents/
 * - Rules: 合并到 CONTEXT.md
 *
 * v2.0: 支持多模块编译
 */
const fs = require('fs');
const path = require('path');
const toml = require('@iarna/toml');
const matter = require('gray-matter');
const BaseEmitter = require('./base-emitter.js');
const { ContextExpander } = require('../context-expander.js');

class QwenEmitter extends BaseEmitter {
  get name() {
    return 'qwen';
  }

  get outputDir() {
    return '.qwen/commands';
  }

  get fileExtension() {
    return '.toml';
  }

  /**
   * 格式化为 Qwen TOML 格式
   * - description: 命令描述
   * - prompt: Markdown 正文
   */
  format(ir, transformedContent) {
    const tomlObj = {
      description: ir.frontmatter.description,
      prompt: transformedContent
    };

    return toml.stringify(tomlObj);
  }

  // ----------------------------------------------------------
  // Multi-Module Emit Methods (v2.0)
  // ----------------------------------------------------------

  /**
   * 编译 Skills 模块
   * .claude/skills/[name]/SKILL.md -> .qwen/commands/[name].toml
   */
  async emitSkills(sourceDir, targetDir) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    // 扫描技能分组目录
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
          const result = await this._emitSkillAsToml(
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
   * 将 Skill 转换为 Qwen TOML 命令
   */
  async _emitSkillAsToml(skillName, skillDir, skillMdPath, targetDir) {
    let content = await fs.promises.readFile(skillMdPath, 'utf8');
    const parsed = matter(content);

    // 展开 context.jsonl
    const contextExpanded = ContextExpander.expandFromSkillDir(skillDir, 'qwen');

    // 构建 TOML 对象
    let prompt = parsed.content;
    if (contextExpanded) {
      prompt = contextExpanded + '\n' + prompt;
    }

    // 替换变量占位符为 Qwen 格式
    prompt = prompt.replace(/\$ARGUMENTS/g, '{{args}}');

    const tomlObj = {
      description: parsed.data.description || `${skillName} skill`,
      prompt: prompt
    };

    const tomlContent = toml.stringify(tomlObj);

    // 输出到 .qwen/commands/<skill-name>.toml
    const targetPath = path.join(targetDir, `${skillName}.toml`);
    const result = await this.emitToPath(targetPath, tomlContent);

    return { ...result, skillName };
  }

  /**
   * 编译 Agents 模块
   * .claude/agents/[name].md -> .qwen/agents/[name].md
   */
  async emitAgents(sourceDir, targetDir) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        continue;
      }

      const filePath = path.join(sourceDir, entry.name);
      const content = await fs.promises.readFile(filePath, 'utf8');
      const parsed = matter(content);
      const agentName = entry.name.replace('.md', '');

      // Qwen agents 支持 ${variable} 模板
      let body = parsed.content;
      // 转换 $ARGUMENTS 为 ${args}
      body = body.replace(/\$ARGUMENTS/g, '${args}');

      // 重新构建带 frontmatter 的内容
      const frontmatterData = {
        name: parsed.data.name || agentName,
        description: parsed.data.description || `${agentName} agent`
      };

      if (parsed.data.tools) {
        frontmatterData.tools = parsed.data.tools;
      }

      const yaml = require('js-yaml');
      const yamlStr = yaml.dump(frontmatterData, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false
      });

      const finalContent = `---\n${yamlStr}---\n\n${body}`;

      const targetPath = path.join(targetDir, `${agentName}.md`);
      const result = await this.emitToPath(targetPath, finalContent);
      results.push({ ...result, agentName });
    }

    return results;
  }

  /**
   * 编译 Rules 模块
   * .claude/rules/[name].md -> CONTEXT.md (合并)
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
      const parsed = matter(content);
      const ruleName = entry.name.replace('.md', '');

      sections.push(`## ${ruleName}\n\n${parsed.content}`);
    }

    if (sections.length > 0) {
      const merged = `# Project Context\n\n${sections.join('\n\n---\n\n')}`;
      const result = await this.emitToPath(targetPath, merged);
      results.push(result);
    }

    return results;
  }
}

module.exports = QwenEmitter;
