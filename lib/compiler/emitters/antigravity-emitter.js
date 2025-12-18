/**
 * T035: AntigravityEmitter - Antigravity 平台输出
 *
 * 输出格式: Markdown + YAML frontmatter
 * 目录: .agent/workflows/
 * 限制: 单文件 <= 12,000 字符
 * 超限时自动拆分
 */
const yaml = require('js-yaml');
const BaseEmitter = require('./base-emitter.js');

const CONTENT_LIMIT = 12000;
const DESCRIPTION_LIMIT = 250;

class AntigravityEmitter extends BaseEmitter {
  static CONTENT_LIMIT = CONTENT_LIMIT;

  get name() {
    return 'antigravity';
  }

  get outputDir() {
    return '.agent/workflows';
  }

  get fileExtension() {
    return '.md';
  }

  get contentLimit() {
    return CONTENT_LIMIT;
  }

  /**
   * 格式化为 Antigravity 格式
   * - YAML frontmatter: description (max 250 chars)
   * - Markdown body
   * - 超过 12K 时返回拆分数组
   */
  format(ir, transformedContent) {
    // 截断 description 到 250 字符
    const description = ir.frontmatter.description.substring(0, DESCRIPTION_LIMIT);

    const frontmatterData = { description };
    const yamlStr = yaml.dump(frontmatterData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });

    const content = `---\n${yamlStr}---\n\n${transformedContent}`;

    // 检查是否超过限制
    if (content.length > CONTENT_LIMIT) {
      return this.splitContent(ir, content);
    }

    return content;
  }

  /**
   * 拆分超长内容为多个文件
   * 策略: 按章节（# 或 ## 标题）拆分，超大章节再硬拆分
   * 所有拆分文件都带完整 frontmatter (description)
   */
  splitContent(ir, content) {
    const filename = ir.source.filename;
    const description = ir.frontmatter.description.substring(0, DESCRIPTION_LIMIT);

    // 计算 frontmatter 固定开销
    const fmOverhead = this.createFrontmatter(description, 1, 1).length;
    const maxBodySize = CONTENT_LIMIT - fmOverhead - 50; // 留 50 字符余量

    // 移除原有 frontmatter，只处理 body
    const bodyOnly = content.replace(/^---[\s\S]*?---\n*/m, '');

    // 按 # 或 ## 标题拆分章节
    const sections = bodyOnly.split(/(?=^#{1,2}\s)/m).filter(s => s.trim());

    // 如果没有章节标题，直接硬拆分
    if (sections.length <= 1) {
      return this.hardSplit(bodyOnly, filename, description, maxBodySize);
    }

    // 预处理：将超大章节先硬拆分
    const normalizedSections = [];
    for (const section of sections) {
      if (section.length > maxBodySize) {
        // 超大章节需要硬拆分
        const subParts = this.splitLargeSection(section, maxBodySize);
        normalizedSections.push(...subParts);
      } else {
        normalizedSections.push(section);
      }
    }

    // 贪心合并：尽量把多个小章节合并到一个文件
    const mergedParts = [];
    let currentPart = '';

    for (const section of normalizedSections) {
      const testContent = currentPart + section;
      if (testContent.length > maxBodySize && currentPart) {
        // 当前 part 已满，保存并开始新 part
        mergedParts.push(currentPart);
        currentPart = section;
      } else {
        currentPart = testContent;
      }
    }

    // 保存最后一个 part
    if (currentPart) {
      mergedParts.push(currentPart);
    }

    // 生成最终文件列表，带序号 frontmatter
    const totalParts = mergedParts.length;
    return mergedParts.map((body, index) => ({
      filename: totalParts === 1 ? filename : `${filename}-part${index + 1}`,
      content: this.createFrontmatter(description, index + 1, totalParts) + body
    }));
  }

  /**
   * 创建带分页信息的 frontmatter
   */
  createFrontmatter(description, partNum, totalParts) {
    let desc = description;
    if (totalParts > 1) {
      desc = `${description} (Part ${partNum}/${totalParts})`;
    }
    const fm = { description: desc };
    // lineWidth: -1 强制单行输出，避免 >- 多行格式
    return `---\n${yaml.dump(fm, { lineWidth: -1 })}---\n\n`;
  }

  /**
   * 拆分超大章节
   * 策略：直接按 maxSize 硬拆分，不尝试保持段落完整性
   * （因为按段落拆分会导致标题和内容分离等问题）
   */
  splitLargeSection(section, maxSize) {
    const parts = [];

    for (let i = 0; i < section.length; i += maxSize) {
      parts.push(section.substring(i, i + maxSize));
    }

    return parts;
  }

  /**
   * 纯硬拆分（无章节标题时的后备方案）
   */
  hardSplit(content, filename, description, maxBodySize) {
    const parts = [];

    for (let i = 0; i < content.length; i += maxBodySize) {
      parts.push(content.substring(i, i + maxBodySize));
    }

    const totalParts = parts.length;
    return parts.map((body, index) => ({
      filename: totalParts === 1 ? filename : `${filename}-part${index + 1}`,
      content: this.createFrontmatter(description, index + 1, totalParts) + body
    }));
  }
}

module.exports = AntigravityEmitter;
