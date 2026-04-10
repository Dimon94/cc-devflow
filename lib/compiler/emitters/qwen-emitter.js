/**
 * T034: QwenEmitter - Qwen 平台输出
 *
 * 输出格式: TOML
 * 目录: .qwen/commands/
 * 字段: description, prompt
 */
const toml = require('@iarna/toml');
const BaseEmitter = require('./base-emitter.js');

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
}

module.exports = QwenEmitter;
