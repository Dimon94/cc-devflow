/**
 * T033: CursorEmitter - Cursor 平台输出 (v2.0)
 *
 * [INPUT]: CommandIR, SKILL.md, agents/*.md, rules/*.md, hooks/*.ts
 * [OUTPUT]: .cursor/commands/*.md, .cursor/rules/*.mdc, .cursor/subagents/*.md, hooks.json
 * [POS]: Cursor IDE 平台编译器，支持完整功能模块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 输出格式:
 * - Commands: 纯 Markdown → .cursor/commands/
 * - Skills: MDC (YAML frontmatter) → .cursor/rules/
 * - Agents: Subagents (YAML frontmatter) → .cursor/subagents/
 * - Rules: MDC → .cursor/rules/
 * - Hooks: hooks.json + hooks/*.sh
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

class CursorEmitter extends BaseEmitter {
  get name() {
    return 'cursor';
  }

  get outputDir() {
    return '.cursor/commands';
  }

  get fileExtension() {
    return '.md';
  }

  /**
   * 格式化为 Cursor 格式
   * - 纯 Markdown，无 frontmatter
   */
  format(ir, transformedContent) {
    return transformedContent;
  }

  // ----------------------------------------------------------
  // Multi-Module Emit Methods (v2.0)
  // ----------------------------------------------------------

  /**
   * 编译 Skills 模块
   * .claude/skills/[name]/SKILL.md -> .cursor/rules/[name].mdc
   */
  async emitSkills(sourceDir, targetDir) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    const skills = discoverSkillEntries(sourceDir);

    for (const skill of skills) {
      try {
        const result = await this._emitSkillAsRule(
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
   * 将 Skill 转换为 Cursor Rule (.mdc)
   */
  async _emitSkillAsRule(skillName, skillDir, skillMdPath, targetDir) {
    let content = await fs.promises.readFile(skillMdPath, 'utf8');
    const parsed = matter(content);

    // 展开 context.jsonl (Cursor 使用 @file 引用)
    const contextExpanded = ContextExpander.expandFromSkillDir(skillDir, 'cursor');

    // 构建 MDC frontmatter
    const frontmatterData = {
      description: parsed.data.description || `${skillName} skill`,
      globs: this._inferGlobs(skillName, parsed.data),
      alwaysApply: parsed.data.alwaysApply || false
    };

    const yamlStr = yaml.dump(frontmatterData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });

    // 组合最终内容
    let body = parsed.content;
    if (contextExpanded) {
      body = contextExpanded + '\n' + body;
    }

    const finalContent = `---\n${yamlStr}---\n\n${body}`;

    // 输出到 .cursor/rules/<skill-name>.mdc
    const targetPath = path.join(targetDir, `${skillName}.mdc`);
    const result = await this.emitToPath(targetPath, finalContent);

    return { ...result, skillName };
  }

  /**
   * 推断 globs 模式
   */
  _inferGlobs(skillName, frontmatter) {
    if (frontmatter.globs) {
      return frontmatter.globs;
    }

    // 根据技能名推断
    if (skillName.includes('flow-')) {
      return ['devflow/**/*', '.claude/**/*'];
    }

    return ['**/*'];
  }

  /**
   * 编译 Agents 模块
   * .claude/agents/[name].md -> .cursor/subagents/[name].md
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

      // 构建 Cursor subagent frontmatter
      const frontmatterData = {
        name: parsed.data.name || agentName,
        description: parsed.data.description || `${agentName} agent`
      };

      // 添加 tools 字段（如果有）
      if (parsed.data.tools) {
        frontmatterData.tools = parsed.data.tools;
      }

      const yamlStr = yaml.dump(frontmatterData, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false
      });

      const finalContent = `---\n${yamlStr}---\n\n${parsed.content}`;

      const targetPath = path.join(targetDir, `${agentName}.md`);
      const result = await this.emitToPath(targetPath, finalContent);
      results.push({ ...result, agentName });
    }

    return results;
  }

  /**
   * 编译 Rules 模块
   * .claude/rules/[name].md -> .cursor/rules/[name].mdc
   */
  async emitRules(sourceDir, targetDir) {
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
      const ruleName = entry.name.replace('.md', '');

      // 构建 MDC frontmatter
      const frontmatterData = {
        description: parsed.data.description || `${ruleName} rule`,
        alwaysApply: parsed.data.alwaysApply || true
      };

      if (parsed.data.globs) {
        frontmatterData.globs = parsed.data.globs;
      }

      const yamlStr = yaml.dump(frontmatterData, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false
      });

      const finalContent = `---\n${yamlStr}---\n\n${parsed.content}`;

      const targetPath = path.join(targetDir, `${ruleName}.mdc`);
      const result = await this.emitToPath(targetPath, finalContent);
      results.push({ ...result, ruleName });
    }

    return results;
  }

  /**
   * 编译 Hooks 模块
   * .claude/hooks/[name].ts -> .cursor/hooks.json + .cursor/hooks/[name].sh
   */
  async emitHooks(sourceDir, targetDir) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
    const hooksConfig = { version: 1, hooks: {} };

    // Claude hook 事件 → Cursor hook 事件映射
    const eventMap = {
      'PreToolUse': 'preToolUse',
      'PostToolUse': 'postToolUse',
      'UserPromptSubmit': 'sessionStart'
    };

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      // 跳过 TypeScript 类型定义文件
      if (entry.name.endsWith('.d.ts')) {
        continue;
      }

      const filePath = path.join(sourceDir, entry.name);
      const hookName = entry.name.replace(/\.(ts|js)$/, '');

      // 尝试从文件名推断事件类型
      let event = null;
      for (const [claudeEvent, cursorEvent] of Object.entries(eventMap)) {
        if (hookName.toLowerCase().includes(claudeEvent.toLowerCase())) {
          event = cursorEvent;
          break;
        }
      }

      if (!event) {
        // 默认为 sessionStart
        event = 'sessionStart';
      }

      // 创建 shell wrapper
      const shellScript = `#!/bin/bash
# Auto-generated from ${entry.name}
# Original hook: ${filePath}

# Note: TypeScript hooks need to be manually converted
echo "Hook ${hookName} triggered"
`;

      const shellPath = path.join(targetDir, 'hooks', `${hookName}.sh`);
      await this.emitToPath(shellPath, shellScript);

      // 添加到 hooks.json
      if (!hooksConfig.hooks[event]) {
        hooksConfig.hooks[event] = [];
      }
      hooksConfig.hooks[event].push({
        command: `./hooks/${hookName}.sh`
      });
    }

    // 写入 hooks.json
    if (Object.keys(hooksConfig.hooks).length > 0) {
      const configPath = path.join(targetDir, 'hooks.json');
      const configContent = JSON.stringify(hooksConfig, null, 2);
      const result = await this.emitToPath(configPath, configContent);
      results.push(result);
    }

    return results;
  }
}

module.exports = CursorEmitter;
