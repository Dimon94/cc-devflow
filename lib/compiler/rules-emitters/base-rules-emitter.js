/**
 * BaseRulesEmitter - 规则入口文件 Emitter 基类
 *
 * 定义 RulesEmitter 接口:
 * - platform: 平台标识符
 * - outputPath: 输出文件路径
 * - format(registry, commands): 格式化规则内容
 * - emit(registry, commands): 写入规则入口文件
 *
 * Reference: REQ-006/TECH_DESIGN.md#RulesEmitter
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// SECURITY CONFIGURATION
// ============================================================
const MAX_OUTPUT_SIZE = 2 * 1024 * 1024; // 2MB limit

class BaseRulesEmitter {
  // ----------------------------------------------------------
  // Abstract properties - 子类必须覆盖
  // ----------------------------------------------------------
  get platform() {
    throw new Error('Not implemented: platform');
  }

  get outputPath() {
    throw new Error('Not implemented: outputPath');
  }

  // ----------------------------------------------------------
  // format() - 子类必须实现
  // ----------------------------------------------------------
  format(registry, commands) {
    throw new Error('Not implemented: format()');
  }

  // ----------------------------------------------------------
  // emit() - 写入规则入口文件
  // ----------------------------------------------------------
  async emit(registry, commands) {
    const content = this.format(registry, commands);
    const outputPath = this.outputPath;

    // 安全检查: 输出大小限制
    if (content.length > MAX_OUTPUT_SIZE) {
      throw new Error(
        `Output too large: ${outputPath} (${content.length} bytes > ${MAX_OUTPUT_SIZE} bytes)`
      );
    }

    // 创建输出目录
    const outputDir = path.dirname(outputPath);
    await fs.promises.mkdir(outputDir, { recursive: true, mode: 0o755 });

    // 写入文件
    await fs.promises.writeFile(outputPath, content, {
      encoding: 'utf8',
      mode: 0o644
    });

    // 计算哈希
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    return {
      path: outputPath,
      hash,
      size: content.length,
      timestamp: new Date().toISOString()
    };
  }

  // ----------------------------------------------------------
  // hashContent() - 计算内容哈希
  // ----------------------------------------------------------
  hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

module.exports = BaseRulesEmitter;
