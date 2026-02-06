/**
 * Context Expander - context.jsonl 编译时展开
 *
 * [INPUT]: context.jsonl 文件内容, 目标平台
 * [OUTPUT]: 展开后的上下文引用字符串
 * [POS]: 编译器核心模块，将 context.jsonl 转换为平台特定格式
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 功能:
 * - 解析 JSONL 格式的上下文定义
 * - 根据平台生成不同格式的上下文引用
 * - Cursor 使用 @file 引用
 * - 其他平台生成 "Required Context" 章节
 */
const fs = require('fs');
const path = require('path');

// ============================================================
// ContextExpander - 上下文展开器
// ============================================================
class ContextExpander {
  /**
   * 解析 context.jsonl 文件
   * @param {string} jsonlPath - context.jsonl 文件路径
   * @returns {Array<Object>} 上下文条目数组
   */
  static parseContextFile(jsonlPath) {
    if (!fs.existsSync(jsonlPath)) {
      return [];
    }

    const content = fs.readFileSync(jsonlPath, 'utf8');
    return ContextExpander.parseJsonl(content);
  }

  /**
   * 解析 JSONL 字符串
   * @param {string} jsonlContent - JSONL 内容
   * @returns {Array<Object>} 上下文条目数组
   */
  static parseJsonl(jsonlContent) {
    if (!jsonlContent || !jsonlContent.trim()) {
      return [];
    }

    const lines = jsonlContent.split('\n').filter(line => line.trim());
    const contexts = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.file) {
          contexts.push({
            file: entry.file,
            reason: entry.reason || '',
            optional: entry.optional || false
          });
        }
      } catch (e) {
        // 跳过无效行
        console.warn(`Warning: Invalid JSONL line: ${line}`);
      }
    }

    return contexts;
  }

  /**
   * 展开上下文为平台特定格式
   * @param {Array<Object>} contexts - 上下文条目数组
   * @param {string} platform - 目标平台
   * @returns {string} 展开后的字符串
   */
  static expand(contexts, platform) {
    if (!contexts || contexts.length === 0) {
      return '';
    }

    switch (platform) {
      case 'cursor':
        return ContextExpander.expandForCursor(contexts);
      case 'codex':
        return ContextExpander.expandForCodex(contexts);
      case 'qwen':
        return ContextExpander.expandForQwen(contexts);
      case 'antigravity':
        return ContextExpander.expandForAntigravity(contexts);
      default:
        return ContextExpander.expandDefault(contexts);
    }
  }

  /**
   * Cursor 格式: 使用 @file 引用
   */
  static expandForCursor(contexts) {
    const lines = contexts.map(c => {
      const optional = c.optional ? ' (optional)' : '';
      return `@${c.file}${optional}`;
    });

    return `\n## Context Files\n\n${lines.join('\n')}\n`;
  }

  /**
   * Codex 格式: 生成 Required Context 章节
   */
  static expandForCodex(contexts) {
    return ContextExpander.expandDefault(contexts);
  }

  /**
   * Qwen 格式: 生成 Required Context 章节
   */
  static expandForQwen(contexts) {
    return ContextExpander.expandDefault(contexts);
  }

  /**
   * Antigravity 格式: 生成 Required Context 章节
   */
  static expandForAntigravity(contexts) {
    return ContextExpander.expandDefault(contexts);
  }

  /**
   * 默认格式: 生成 Required Context 章节
   */
  static expandDefault(contexts) {
    const lines = contexts.map(c => {
      const optional = c.optional ? ' (optional)' : '';
      return `- \`${c.file}\` - ${c.reason}${optional}`;
    });

    return `
## Required Context

Before executing this skill, read the following files:
${lines.join('\n')}
`;
  }

  /**
   * 从 SKILL.md 所在目录读取并展开 context.jsonl
   * @param {string} skillDir - SKILL.md 所在目录
   * @param {string} platform - 目标平台
   * @returns {string} 展开后的字符串
   */
  static expandFromSkillDir(skillDir, platform) {
    const contextPath = path.join(skillDir, 'context.jsonl');
    const contexts = ContextExpander.parseContextFile(contextPath);
    return ContextExpander.expand(contexts, platform);
  }

  /**
   * 替换 SKILL.md 中的 {CONTEXT} 占位符
   * @param {string} content - SKILL.md 内容
   * @param {string} skillDir - SKILL.md 所在目录
   * @param {string} platform - 目标平台
   * @returns {string} 替换后的内容
   */
  static replaceContextPlaceholder(content, skillDir, platform) {
    const contextExpanded = ContextExpander.expandFromSkillDir(skillDir, platform);

    // 替换 {CONTEXT} 占位符
    if (content.includes('{CONTEXT}')) {
      return content.replace('{CONTEXT}', contextExpanded);
    }

    // 如果没有占位符但有 context.jsonl，追加到末尾
    if (contextExpanded) {
      return content + '\n' + contextExpanded;
    }

    return content;
  }
}

module.exports = { ContextExpander };
