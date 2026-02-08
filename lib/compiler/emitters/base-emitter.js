/**
 * T031: BaseEmitter - Emitter 基类 (v2.0)
 *
 * [INPUT]: 平台配置 (platforms.js)
 * [OUTPUT]: 编译后的文件
 * [POS]: 编译器核心，定义 Emitter 接口和多模块编译能力
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 定义 Emitter 接口:
 * - name: 平台名称
 * - outputDir: 输出目录
 * - fileExtension: 文件扩展名
 * - format(ir, transformedContent): 格式化输出
 * - emit(filename, content): 写入文件
 *
 * v2.0: 支持多模块编译 (skills, commands, agents, rules, hooks)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// SECURITY CONFIGURATION (FINDING-003)
// ============================================================
const MAX_OUTPUT_SIZE = 2 * 1024 * 1024; // 2MB limit
const MANAGED_BLOCK_PREFIX = 'cc-devflow';

// ============================================================
// MODULE_TYPES - 支持的模块类型
// ============================================================
const MODULE_TYPES = {
  SKILLS: 'skills',
  COMMANDS: 'commands',
  AGENTS: 'agents',
  RULES: 'rules',
  HOOKS: 'hooks'
};

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
  // format() - 子类必须实现 (Commands 格式化)
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
    const fileDir = path.dirname(filePath);

    // ✅ SECURITY FIX (FINDING-005): Set explicit directory permissions
    // 支持带子路径的文件名（例如 flow/new）
    await fs.promises.mkdir(fileDir, { recursive: true, mode: 0o755 });

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

  // ----------------------------------------------------------
  // emitToPath() - 写入文件到指定路径
  // ----------------------------------------------------------
  async emitToPath(filePath, content) {
    if (content.length > MAX_OUTPUT_SIZE) {
      throw new Error(`Output too large: ${filePath} (${content.length} bytes > ${MAX_OUTPUT_SIZE} bytes)`);
    }

    const outputDir = path.dirname(filePath);
    await fs.promises.mkdir(outputDir, { recursive: true, mode: 0o755 });
    await fs.promises.writeFile(filePath, content, { encoding: 'utf8', mode: 0o644 });

    const hash = crypto.createHash('sha256').update(content).digest('hex');

    return {
      path: filePath,
      hash,
      timestamp: new Date().toISOString()
    };
  }

  // ----------------------------------------------------------
  // Multi-Module Emit Methods (v2.0)
  // 子类可覆盖以实现平台特定逻辑
  // ----------------------------------------------------------

  /**
   * 编译 Skills 模块
   * @param {string} sourceDir - 源目录 (.claude/skills/)
   * @param {string} targetDir - 目标目录
   * @returns {Promise<Array>} 编译结果
   */
  async emitSkills(sourceDir, targetDir) {
    // 默认实现: 复制 SKILL.md 文件
    return this._defaultSkillsEmit(sourceDir, targetDir);
  }

  /**
   * 编译 Commands 模块
   * @param {Array} irs - 命令 IR 数组
   * @param {string} targetDir - 目标目录
   * @returns {Promise<Array>} 编译结果
   */
  async emitCommands(irs, targetDir) {
    // 默认实现: 使用现有 format/emit 逻辑
    const results = [];
    for (const ir of irs) {
      const formatted = this.format(ir, ir.body);
      const result = await this.emit(ir.source.filename, formatted);
      results.push(result);
    }
    return results;
  }

  /**
   * 编译 Agents 模块
   * @param {string} sourceDir - 源目录 (.claude/agents/)
   * @param {string} targetPath - 目标路径 (文件或目录)
   * @returns {Promise<Array>} 编译结果
   */
  async emitAgents(sourceDir, targetPath) {
    // 默认实现: 合并到 AGENTS.md
    return this._defaultAgentsEmit(sourceDir, targetPath);
  }

  /**
   * 编译 Rules 模块
   * @param {string} sourceDir - 源目录 (.claude/rules/)
   * @param {string} targetPath - 目标路径 (文件或目录)
   * @returns {Promise<Array>} 编译结果
   */
  async emitRules(sourceDir, targetPath) {
    // 默认实现: 复制或合并
    return this._defaultRulesEmit(sourceDir, targetPath);
  }

  /**
   * 编译 Hooks 模块
   * @param {string} sourceDir - 源目录 (.claude/hooks/)
   * @param {string} targetDir - 目标目录
   * @returns {Promise<Array>} 编译结果
   */
  async emitHooks(sourceDir, targetDir) {
    // 默认实现: 不支持
    return [];
  }

  // ----------------------------------------------------------
  // Default Implementations
  // ----------------------------------------------------------

  async _defaultSkillsEmit(sourceDir, targetDir) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('_')) {
        continue;
      }

      const skillDir = path.join(sourceDir, entry.name);
      const skillMdPath = path.join(skillDir, 'SKILL.md');

      if (!fs.existsSync(skillMdPath)) {
        continue;
      }

      const content = await fs.promises.readFile(skillMdPath, 'utf8');
      const targetSkillDir = path.join(targetDir, entry.name);
      const targetPath = path.join(targetSkillDir, 'SKILL.md');

      const result = await this.emitToPath(targetPath, content);
      results.push({ ...result, skillName: entry.name });
    }

    return results;
  }

  async _defaultAgentsEmit(sourceDir, targetPath) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
    const sections = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        continue;
      }

      const filePath = path.join(sourceDir, entry.name);
      const content = await fs.promises.readFile(filePath, 'utf8');
      const agentName = entry.name.replace('.md', '');

      sections.push(`## ${agentName}\n\n${content}`);
    }

    if (sections.length > 0) {
      const merged = `# Agents\n\n${sections.join('\n\n---\n\n')}`;
      const result = await this.emitToPath(targetPath, merged);
      results.push(result);
    }

    return results;
  }

  async _defaultRulesEmit(sourceDir, targetPath) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
    const sections = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        continue;
      }

      const filePath = path.join(sourceDir, entry.name);
      const content = await fs.promises.readFile(filePath, 'utf8');
      const ruleName = entry.name.replace('.md', '');

      sections.push(`## ${ruleName}\n\n${content}`);
    }

    if (sections.length > 0) {
      const merged = `# Rules\n\n${sections.join('\n\n---\n\n')}`;
      const result = await this.emitToPath(targetPath, merged);
      results.push(result);
    }

    return results;
  }

  // ----------------------------------------------------------
  // Utility Methods
  // ----------------------------------------------------------

  /**
   * 计算内容哈希
   */
  hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 读取目录下的 Markdown 文件名（去掉 .md）
   */
  async readMarkdownEntryNames(sourceDir) {
    if (!fs.existsSync(sourceDir)) {
      return [];
    }

    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });

    return entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => entry.name.replace(/\.md$/, ''))
      .sort((a, b) => a.localeCompare(b));
  }

  /**
   * 格式化短列表，避免全局记忆文件过长
   */
  formatCompactList(items, maxItems = 12) {
    if (!items || items.length === 0) {
      return '`(none)`';
    }

    const visible = items.slice(0, maxItems).map(item => `\`${item}\``);
    const hiddenCount = items.length - visible.length;

    if (hiddenCount > 0) {
      visible.push(`... (+${hiddenCount} more)`);
    }

    return visible.join(', ');
  }

  /**
   * 受管块写入：仅替换指定区块，保留用户原有内容
   */
  async upsertManagedBlock(targetPath, blockId, body) {
    const startMarker = `<!-- ${MANAGED_BLOCK_PREFIX}:${blockId}:start -->`;
    const endMarker = `<!-- ${MANAGED_BLOCK_PREFIX}:${blockId}:end -->`;
    const managedBlock = `${startMarker}\n${body.trim()}\n${endMarker}`;

    let existing = '';
    if (fs.existsSync(targetPath)) {
      existing = await fs.promises.readFile(targetPath, 'utf8');
    }

    const merged = this._replaceManagedBlock(existing, startMarker, endMarker, managedBlock);
    return this.emitToPath(targetPath, merged);
  }

  _replaceManagedBlock(existing, startMarker, endMarker, managedBlock) {
    const startIndex = existing.indexOf(startMarker);
    const endIndex = existing.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const before = existing.slice(0, startIndex).trimEnd();
      const after = existing.slice(endIndex + endMarker.length).trimStart();

      return this._joinBlocks(before, managedBlock, after);
    }

    if (!existing.trim()) {
      return `${managedBlock}\n`;
    }

    return `${existing.trimEnd()}\n\n${managedBlock}\n`;
  }

  _joinBlocks(...blocks) {
    const validBlocks = blocks.filter(block => block && block.trim().length > 0);
    if (validBlocks.length === 0) {
      return '';
    }
    return `${validBlocks.join('\n\n')}\n`;
  }
}

module.exports = BaseEmitter;
module.exports.MODULE_TYPES = MODULE_TYPES;
