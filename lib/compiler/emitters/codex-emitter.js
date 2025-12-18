/**
 * T032: CodexEmitter - Codex 平台输出
 *
 * 输出格式: Markdown + YAML frontmatter
 * 目录: .codex/prompts/
 * Frontmatter 字段: description, argument-hint
 */
const yaml = require('js-yaml');
const BaseEmitter = require('./base-emitter.js');

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
}

module.exports = CodexEmitter;
