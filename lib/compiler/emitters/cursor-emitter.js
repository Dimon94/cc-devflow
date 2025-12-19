/**
 * T033: CursorEmitter - Cursor 平台输出
 *
 * 输出格式: 纯 Markdown (无 frontmatter)
 * 目录: .cursor/commands/
 */
const BaseEmitter = require('./base-emitter.js');

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
}

module.exports = CursorEmitter;
