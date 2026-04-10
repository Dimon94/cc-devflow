/**
 * T031: BaseEmitter - Emitter 基类
 *
 * 定义 Emitter 接口:
 * - name: 平台名称
 * - outputDir: 输出目录
 * - fileExtension: 文件扩展名
 * - format(ir, transformedContent): 格式化输出
 * - emit(filename, content): 写入文件
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// SECURITY CONFIGURATION (FINDING-003)
// ============================================================
const MAX_OUTPUT_SIZE = 2 * 1024 * 1024; // 2MB limit

class BaseEmitter {
  // ----------------------------------------------------------
  // Abstract properties - 子类必须覆盖
  // ----------------------------------------------------------
  get name() {
    throw new Error('Not implemented');
  }

  get outputDir() {
    throw new Error('Not implemented');
  }

  get fileExtension() {
    throw new Error('Not implemented');
  }

  // ----------------------------------------------------------
  // format() - 子类必须实现
  // ----------------------------------------------------------
  format(ir, transformedContent) {
    throw new Error('Not implemented');
  }

  // ----------------------------------------------------------
  // emit() - 写入文件到输出目录
  // ----------------------------------------------------------
  async emit(filename, content) {
    // ✅ SECURITY FIX (FINDING-003): Check output size
    if (content.length > MAX_OUTPUT_SIZE) {
      throw new Error(`Output too large: ${filename} (${content.length} bytes > ${MAX_OUTPUT_SIZE} bytes)`);
    }

    const outputDir = this.outputDir;
    const ext = this.fileExtension;
    const filePath = path.join(outputDir, `${filename}${ext}`);

    // ✅ SECURITY FIX (FINDING-005): Set explicit directory permissions
    await fs.promises.mkdir(outputDir, { recursive: true, mode: 0o755 });

    // ✅ SECURITY FIX (FINDING-005): Set explicit file permissions
    await fs.promises.writeFile(filePath, content, { encoding: 'utf8', mode: 0o644 });

    // 计算哈希
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    return {
      path: filePath,
      hash,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BaseEmitter;
