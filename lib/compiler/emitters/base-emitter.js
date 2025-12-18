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
    const outputDir = this.outputDir;
    const ext = this.fileExtension;
    const filePath = path.join(outputDir, `${filename}${ext}`);

    // 确保输出目录存在
    await fs.promises.mkdir(outputDir, { recursive: true });

    // 写入文件
    await fs.promises.writeFile(filePath, content, 'utf8');

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
