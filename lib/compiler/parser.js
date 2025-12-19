/**
 * T025: Parser Module
 *
 * Parses .claude/commands/*.md files:
 * - Extracts YAML frontmatter using gray-matter
 * - Validates frontmatter with Zod schema
 * - Detects placeholders ({SCRIPT:*}, {TEMPLATE:*}, {GUIDE:*}, {AGENT_SCRIPT}, $ARGUMENTS)
 * - Computes SHA-256 content hash
 * - Returns CommandIR structure
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matter = require('gray-matter');

const { FrontmatterSchema, CommandIRSchema } = require('./schemas.js');
const {
  MissingFrontmatterError,
  InvalidFrontmatterError,
  UnknownAliasError,
  UnknownTemplateAliasError,
  UnknownGuideAliasError
} = require('./errors.js');

// ============================================================
// SECURITY CONFIGURATION (FINDING-002, FINDING-003)
// ============================================================
const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit (FINDING-003: Resource Exhaustion)

// ============================================================
// Placeholder Detection Patterns
// ============================================================
const SCRIPT_PATTERN = /\{SCRIPT:([^}]+)\}/g;
const TEMPLATE_PATTERN = /\{TEMPLATE:([^}]+)\}/g;
const GUIDE_PATTERN = /\{GUIDE:([^}]+)\}/g;
const AGENT_SCRIPT_PATTERN = /\{AGENT_SCRIPT\}/g;
const ARGUMENTS_PATTERN = /\$ARGUMENTS/g;

// ============================================================
// hashContent - 计算 SHA-256 哈希
// ============================================================
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ============================================================
// detectPlaceholders - 检测正文中的占位符
// ============================================================
function detectPlaceholders(body) {
  const placeholders = [];

  // 检测 {SCRIPT:alias}
  let match;
  const scriptPattern = new RegExp(SCRIPT_PATTERN.source, 'g');
  while ((match = scriptPattern.exec(body)) !== null) {
    placeholders.push({
      type: 'SCRIPT',
      raw: match[0],
      alias: match[1],
      position: { start: match.index, end: match.index + match[0].length }
    });
  }

  // 检测 {TEMPLATE:alias}
  const templatePattern = new RegExp(TEMPLATE_PATTERN.source, 'g');
  while ((match = templatePattern.exec(body)) !== null) {
    placeholders.push({
      type: 'TEMPLATE',
      raw: match[0],
      alias: match[1],
      position: { start: match.index, end: match.index + match[0].length }
    });
  }

  // 检测 {GUIDE:alias}
  const guidePattern = new RegExp(GUIDE_PATTERN.source, 'g');
  while ((match = guidePattern.exec(body)) !== null) {
    placeholders.push({
      type: 'GUIDE',
      raw: match[0],
      alias: match[1],
      position: { start: match.index, end: match.index + match[0].length }
    });
  }

  // 检测 {AGENT_SCRIPT}
  const agentPattern = new RegExp(AGENT_SCRIPT_PATTERN.source, 'g');
  while ((match = agentPattern.exec(body)) !== null) {
    placeholders.push({
      type: 'AGENT_SCRIPT',
      raw: match[0],
      position: { start: match.index, end: match.index + match[0].length }
    });
  }

  // 检测 $ARGUMENTS
  const argsPattern = new RegExp(ARGUMENTS_PATTERN.source, 'g');
  while ((match = argsPattern.exec(body)) !== null) {
    placeholders.push({
      type: 'ARGUMENTS',
      raw: match[0],
      position: { start: match.index, end: match.index + match[0].length }
    });
  }

  return placeholders;
}

// ============================================================
// validateScriptAliases - 验证 SCRIPT alias 是否在 frontmatter 中定义
// ============================================================
function validateScriptAliases(placeholders, scripts, filePath) {
  const scriptPlaceholders = placeholders.filter(p => p.type === 'SCRIPT');

  for (const placeholder of scriptPlaceholders) {
    if (!scripts || !scripts[placeholder.alias]) {
      throw new UnknownAliasError(filePath, placeholder.alias);
    }
  }
}

// ============================================================
// validateTemplateAliases - 验证 TEMPLATE alias 是否在 frontmatter 中定义
// ============================================================
function validateTemplateAliases(placeholders, templates, filePath) {
  const templatePlaceholders = placeholders.filter(p => p.type === 'TEMPLATE');

  for (const placeholder of templatePlaceholders) {
    if (!templates || !templates[placeholder.alias]) {
      throw new UnknownTemplateAliasError(filePath, placeholder.alias);
    }
  }
}

// ============================================================
// validateGuideAliases - 验证 GUIDE alias 是否在 frontmatter 中定义
// ============================================================
function validateGuideAliases(placeholders, guides, filePath) {
  const guidePlaceholders = placeholders.filter(p => p.type === 'GUIDE');

  for (const placeholder of guidePlaceholders) {
    if (!guides || !guides[placeholder.alias]) {
      throw new UnknownGuideAliasError(filePath, placeholder.alias);
    }
  }
}

// ============================================================
// parseCommand - 解析单个命令文件
// ============================================================
function parseCommand(filePath) {
  // 读取文件内容
  const absolutePath = path.resolve(filePath);

  // ✅ SECURITY FIX (FINDING-003): Check file size before reading
  const stats = fs.statSync(absolutePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${filePath} (${stats.size} bytes > ${MAX_FILE_SIZE} bytes)`);
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  const hash = hashContent(content);

  // ✅ SECURITY FIX (FINDING-002): Enable YAML safe mode (CORE_SCHEMA)
  const yaml = require('js-yaml');
  const parsed = matter(content, {
    engines: {
      yaml: (s) => yaml.load(s, { schema: yaml.CORE_SCHEMA })
    }
  });

  // 检查是否有 frontmatter
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new MissingFrontmatterError(filePath);
  }

  // 验证 frontmatter schema
  const frontmatterResult = FrontmatterSchema.safeParse(parsed.data);
  if (!frontmatterResult.success) {
    const errorMessages = frontmatterResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new InvalidFrontmatterError(filePath, errorMessages);
  }

  const frontmatter = frontmatterResult.data;
  const body = parsed.content;

  // 检测占位符
  const placeholders = detectPlaceholders(body);

  // 验证 SCRIPT alias 存在性
  validateScriptAliases(placeholders, frontmatter.scripts, filePath);

  // 验证 TEMPLATE alias 存在性
  validateTemplateAliases(placeholders, frontmatter.templates, filePath);

  // 验证 GUIDE alias 存在性
  validateGuideAliases(placeholders, frontmatter.guides, filePath);

  // 构建 CommandIR
  const ir = {
    source: {
      path: absolutePath,
      filename: path.basename(filePath, '.md'),
      hash
    },
    frontmatter,
    body,
    placeholders
  };

  // 最终验证 CommandIR
  const irResult = CommandIRSchema.safeParse(ir);
  if (!irResult.success) {
    throw new InvalidFrontmatterError(filePath, 'Invalid CommandIR structure');
  }

  return irResult.data;
}

// ============================================================
// parseAllCommands - 批量解析命令目录
// ============================================================
async function parseAllCommands(dirPath) {
  const absoluteDir = path.resolve(dirPath);

  // 读取目录中的所有文件
  const files = fs.readdirSync(absoluteDir);

  // 过滤 .md 文件
  const mdFiles = files.filter(file => file.endsWith('.md'));

  // 解析每个文件
  const results = [];
  for (const file of mdFiles) {
    const filePath = path.join(absoluteDir, file);
    try {
      const ir = parseCommand(filePath);
      results.push(ir);
    } catch (error) {
      // 重新抛出以便调用者处理
      throw error;
    }
  }

  return results;
}

module.exports = {
  parseCommand,
  parseAllCommands,
  hashContent,
  detectPlaceholders,
  validateScriptAliases,
  validateTemplateAliases,
  validateGuideAliases
};
