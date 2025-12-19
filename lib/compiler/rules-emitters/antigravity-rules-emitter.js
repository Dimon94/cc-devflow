/**
 * AntigravityRulesEmitter - Antigravity 规则入口文件生成
 *
 * 输出格式: Markdown with YAML frontmatter
 * 输出路径: .agent/rules/rules.md
 * 特殊限制: 单文件最大 12000 字符，超限时分块
 *
 * Reference: REQ-006/research.md#D06 - 12K limit
 */
const BaseRulesEmitter = require('./base-rules-emitter');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// Constants
// ============================================================
const MAX_FILE_CHARS = 12000;
const REFERENCE_LINK_RESERVE = 50; // 预留引用链接空间

class AntigravityRulesEmitter extends BaseRulesEmitter {
  // ----------------------------------------------------------
  // Platform properties
  // ----------------------------------------------------------
  get platform() {
    return 'antigravity';
  }

  get outputPath() {
    return '.agent/rules/rules.md';
  }

  // ----------------------------------------------------------
  // format() - 生成 Markdown 格式内容
  // ----------------------------------------------------------
  format(registry, commands) {
    const frontmatter = this.buildFrontmatter(registry);
    const body = this.buildBody(registry, commands);

    return `---
${frontmatter}---

${body}`;
  }

  // ----------------------------------------------------------
  // buildFrontmatter() - 构建 YAML frontmatter
  // ----------------------------------------------------------
  buildFrontmatter(_registry) {
    const lines = [`description: "CC-DevFlow Rules for Antigravity"`];

    return lines.join('\n') + '\n';
  }

  // ----------------------------------------------------------
  // buildBody() - 构建 Markdown 正文
  // ----------------------------------------------------------
  buildBody(registry, commands) {
    const sections = [];

    // 标题
    sections.push('# CC-DevFlow Rules');
    sections.push('');

    // 技能章节
    sections.push('## Skills');
    sections.push('');

    if (registry && registry.skills && registry.skills.length > 0) {
      for (const skill of registry.skills) {
        sections.push(`### ${skill.name}`);
        sections.push('');
        sections.push(`**Type**: ${skill.type || 'utility'}`);
        sections.push(`**Priority**: ${skill.priority || 'medium'}`);
        sections.push('');
        sections.push(skill.description || 'No description');
        sections.push('');
      }
    } else {
      sections.push('No skills registered.');
      sections.push('');
    }

    // 命令章节
    sections.push('## Commands');
    sections.push('');

    if (commands && commands.length > 0) {
      for (const cmd of commands) {
        sections.push(`### /${cmd.name}`);
        sections.push('');
        sections.push(cmd.description || 'No description');
        sections.push('');
      }
    } else {
      sections.push('No commands available.');
      sections.push('');
    }

    return sections.join('\n');
  }

  // ----------------------------------------------------------
  // emit() - 写入文件，超过 12K 时分块
  // ----------------------------------------------------------
  async emit(registry, commands) {
    const content = this.format(registry, commands);

    // 检查是否需要分块
    if (content.length <= MAX_FILE_CHARS) {
      // 单文件输出
      return this.emitSingleFile(content);
    }

    // 分块输出
    return this.emitMultipleFiles(content, registry, commands);
  }

  // ----------------------------------------------------------
  // emitSingleFile() - 输出单个文件
  // ----------------------------------------------------------
  async emitSingleFile(content) {
    const outputPath = this.outputPath;
    const outputDir = path.dirname(outputPath);

    await fs.promises.mkdir(outputDir, { recursive: true, mode: 0o755 });
    await fs.promises.writeFile(outputPath, content, {
      encoding: 'utf8',
      mode: 0o644
    });

    const hash = crypto.createHash('sha256').update(content).digest('hex');

    return {
      path: outputPath,
      hash,
      size: content.length,
      timestamp: new Date().toISOString()
    };
  }

  // ----------------------------------------------------------
  // emitMultipleFiles() - 分块输出多个文件
  // ----------------------------------------------------------
  async emitMultipleFiles(content, _registry, _commands) {
    // 分块时预留引用链接空间
    const effectiveMax = MAX_FILE_CHARS - REFERENCE_LINK_RESERVE;
    const chunks = this.smartChunk(content, effectiveMax);
    const results = [];
    const outputDir = path.dirname(this.outputPath);

    await fs.promises.mkdir(outputDir, { recursive: true, mode: 0o755 });

    for (let i = 0; i < chunks.length; i++) {
      const partNum = i + 1;
      const partPath = path.join(outputDir, `rules-part${partNum}.md`);

      // 添加跨 Part 引用
      let partContent = chunks[i];

      if (i < chunks.length - 1) {
        partContent += `\n\n---\n\n@rules-part${partNum + 1}.md\n`;
      }

      await fs.promises.writeFile(partPath, partContent, {
        encoding: 'utf8',
        mode: 0o644
      });

      const hash = crypto.createHash('sha256').update(partContent).digest('hex');

      results.push({
        path: partPath,
        hash,
        size: partContent.length,
        chars: partContent.length,
        content: partContent,
        timestamp: new Date().toISOString()
      });
    }

    return results;
  }

  // ----------------------------------------------------------
  // smartChunk() - 按 ## 标题智能分块
  // ----------------------------------------------------------
  smartChunk(content, maxChars) {
    const chunks = [];

    // 按 ## 标题分割
    const sections = content.split(/(?=^## )/m);

    let currentChunk = '';

    for (const section of sections) {
      // 如果当前块加上新 section 超过限制
      if (currentChunk.length + section.length > maxChars) {
        // 保存当前块（如果非空）
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }

        // 如果单个 section 超过限制，需要进一步分割
        if (section.length > maxChars) {
          const subChunks = this.forceSplit(section, maxChars);
          chunks.push(...subChunks.slice(0, -1));
          currentChunk = subChunks[subChunks.length - 1];
        } else {
          currentChunk = section;
        }
      } else {
        currentChunk += section;
      }
    }

    // 添加最后一个块
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // ----------------------------------------------------------
  // forceSplit() - 强制按字符数分割
  // ----------------------------------------------------------
  forceSplit(content, maxChars) {
    const chunks = [];
    let remaining = content;

    while (remaining.length > maxChars) {
      // 尝试在换行符处分割
      let splitPoint = remaining.lastIndexOf('\n', maxChars);

      if (splitPoint < maxChars * 0.5) {
        // 如果找不到合适的换行符，强制分割
        splitPoint = maxChars;
      }

      chunks.push(remaining.substring(0, splitPoint).trim());
      remaining = remaining.substring(splitPoint).trim();
    }

    if (remaining) {
      chunks.push(remaining);
    }

    return chunks;
  }
}

module.exports = { AntigravityRulesEmitter };
