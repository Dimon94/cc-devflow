/**
 * T035: AntigravityEmitter - Antigravity 平台输出 (v2.0)
 *
 * [INPUT]: CommandIR, SKILL.md, agents, rules
 * [OUTPUT]: .agent/workflows/*.md, .agent/skills/*, .agent/rules/*.md, AGENTS.md
 * [POS]: Antigravity 平台编译器，支持完整功能模块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 输出格式:
 * - Commands: Markdown + YAML frontmatter -> .agent/workflows/
 * - Skills: SKILL.md (YAML frontmatter) -> .agent/skills/
 * - Agents: 合并到 AGENTS.md
 * - Rules: Markdown -> .agent/rules/
 *
 * 限制: 单文件 <= 12,000 字符，超限时自动拆分
 *
 * v2.0: 支持多模块编译
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');
const BaseEmitter = require('./base-emitter.js');
const { ContextExpander } = require('../context-expander.js');
const { discoverSkillEntries } = require('../skill-discovery.js');

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

  // ----------------------------------------------------------
  // Multi-Module Emit Methods (v2.0)
  // ----------------------------------------------------------

  /**
   * 编译 Skills 模块
   * .claude/skills/[name]/SKILL.md -> .agent/skills/[name]/SKILL.md
   */
  async emitSkills(sourceDir, targetDir) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    const skills = discoverSkillEntries(sourceDir);

    for (const skill of skills) {
      try {
        const result = await this._emitSingleSkill(
          skill.name,
          skill.skillDir,
          skill.skillMdPath,
          targetDir
        );
        results.push(result);
      } catch (error) {
        console.warn(`Warning: Failed to emit skill ${skill.name}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * 编译单个 Skill
   */
  async _emitSingleSkill(skillName, skillDir, skillMdPath, targetDir) {
    let content = await fs.promises.readFile(skillMdPath, 'utf8');
    const parsed = matter(content);

    // 展开 context.jsonl
    const contextExpanded = ContextExpander.expandFromSkillDir(skillDir, 'antigravity');

    // 构建 frontmatter (Antigravity 支持 metadata)
    const frontmatterData = {
      name: parsed.data.name || skillName,
      description: (parsed.data.description || '').substring(0, DESCRIPTION_LIMIT)
    };

    // 添加 metadata (如果有)
    if (parsed.data.metadata) {
      frontmatterData.metadata = parsed.data.metadata;
    }

    const yamlStr = yaml.dump(frontmatterData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });

    // 组合最终内容：frontmatter + context + body
    let body = parsed.content;
    if (contextExpanded) {
      body = contextExpanded + '\n' + body;
    }

    const finalContent = `---\n${yamlStr}---\n\n${body}`;

    // 输出到 .agent/skills/<skill-name>/SKILL.md
    const targetSkillDir = path.join(targetDir, skillName);
    const targetPath = path.join(targetSkillDir, 'SKILL.md');

    const result = await this.emitToPath(targetPath, finalContent);

    // 复制 scripts/ 和 references/ 目录
    try {
      await this._copySkillResources(skillDir, targetSkillDir);
    } catch (error) {
      // 资源复制失败不阻塞主 SKILL.md 产物
      console.warn(`Warning: Failed to copy resources for skill ${skillName}: ${error.message}`);
    }

    return { ...result, skillName };
  }

  /**
   * 复制 Skill 资源目录
   */
  async _copySkillResources(sourceSkillDir, targetSkillDir) {
    const resourceDirs = ['scripts', 'references', 'assets', 'examples', 'resources'];

    for (const dir of resourceDirs) {
      const sourceResDir = path.join(sourceSkillDir, dir);
      const targetResDir = path.join(targetSkillDir, dir);

      if (fs.existsSync(sourceResDir)) {
        await this._copyDir(sourceResDir, targetResDir);
      }
    }
  }

  /**
   * 递归复制目录
   */
  async _copyDir(src, dest) {
    await fs.promises.mkdir(dest, { recursive: true, mode: 0o755 });
    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this._copyDir(srcPath, destPath);
      } else if (entry.isSymbolicLink()) {
        try {
          const resolvedPath = await fs.promises.realpath(srcPath);
          const resolvedStats = await fs.promises.stat(resolvedPath);
          await fs.promises.rm(destPath, { force: true, recursive: true });

          if (resolvedStats.isDirectory()) {
            await this._copyDir(resolvedPath, destPath);
          } else {
            await fs.promises.copyFile(resolvedPath, destPath);
          }
        } catch (error) {
          console.warn(`Warning: Skip broken symlink ${srcPath}: ${error.message}`);
        }
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * 编译 Agents 模块
   * .claude/agents/[name].md -> AGENTS.md (合并)
   */
  async emitAgents(sourceDir, targetPath) {
    return this._defaultAgentsEmit(sourceDir, targetPath);
  }

  /**
   * 编译 Rules 模块
   * .claude/rules/[name].md -> .agent/rules/[name].md
   */
  async emitRules(sourceDir, targetDir) {
    const results = [];

    if (!fs.existsSync(sourceDir)) {
      return results;
    }

    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        continue;
      }

      const filePath = path.join(sourceDir, entry.name);
      const content = await fs.promises.readFile(filePath, 'utf8');
      const ruleName = entry.name.replace('.md', '');

      // Antigravity rules 是纯 Markdown
      const targetPath = path.join(targetDir, `${ruleName}.md`);
      const result = await this.emitToPath(targetPath, content);
      results.push({ ...result, ruleName });
    }

    return results;
  }
}

module.exports = AntigravityEmitter;
