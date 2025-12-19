/**
 * T028: Transformer Module
 *
 * Transforms CommandIR for target platforms:
 * - Expands {SCRIPT:alias} to "bash <path>"
 * - Inlines {TEMPLATE:alias} with template file content
 * - Inlines {GUIDE:alias} with guide file content
 * - Expands {AGENT_SCRIPT} with platform-specific __AGENT__ substitution
 * - Maps $ARGUMENTS to platform-specific syntax:
 *   - codex/cursor: $ARGUMENTS (unchanged)
 *   - qwen: {{args}}
 *   - antigravity: [arguments]
 * - Rewrites .claude/ paths to platform-specific paths via pathMap
 */
const fs = require('fs');
const path = require('path');

// ============================================================
// Platform Argument Mapping
// ============================================================
const ARGUMENT_MAPPING = {
  codex: '$ARGUMENTS',
  cursor: '$ARGUMENTS',
  qwen: '{{args}}',
  antigravity: '[arguments]'
};

// ============================================================
// readFileContent - 读取文件内容，带缓存
// ============================================================
const fileCache = new Map();

function readFileContent(filePath) {
  // 检查缓存
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }

  // 解析相对路径
  const absolutePath = path.resolve(process.cwd(), filePath);

  try {
    if (!fs.existsSync(absolutePath)) {
      console.warn(`Warning: File not found: ${absolutePath}`);
      return `[File not found: ${filePath}]`;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    fileCache.set(filePath, content);
    return content;
  } catch (error) {
    console.warn(`Warning: Cannot read file: ${absolutePath} - ${error.message}`);
    return `[Cannot read: ${filePath}]`;
  }
}

// ============================================================
// clearFileCache - 清除文件缓存（用于测试）
// ============================================================
function clearFileCache() {
  fileCache.clear();
}

// ============================================================
// expandScriptPlaceholders - 展开 {SCRIPT:alias} 占位符
// 智能处理：如果前面已有 bash，则只替换路径；否则加 bash 前缀
// ============================================================
function expandScriptPlaceholders(content, scripts) {
  if (!scripts) return content;

  // 先处理已有 bash 前缀的情况: bash {SCRIPT:xxx} → bash path
  content = content.replace(/bash\s+\{SCRIPT:([^}]+)\}/g, (match, alias) => {
    const scriptPath = scripts[alias];
    if (scriptPath) {
      return `bash ${scriptPath}`;
    }
    return match;
  });

  // 再处理没有 bash 前缀的情况: {SCRIPT:xxx} → bash path
  return content.replace(/\{SCRIPT:([^}]+)\}/g, (match, alias) => {
    const scriptPath = scripts[alias];
    if (scriptPath) {
      return `bash ${scriptPath}`;
    }
    return match; // 保留原样，由 parser 阶段验证
  });
}

// ============================================================
// expandTemplatePlaceholders - 展开 {TEMPLATE:alias} 占位符
// 将占位符替换为模板文件的实际内容
// ============================================================
function expandTemplatePlaceholders(content, templates, options = {}) {
  if (!templates) return content;

  const { inline = false } = options;

  return content.replace(/\{TEMPLATE:([^}]+)\}/g, (match, alias) => {
    const templatePath = templates[alias];
    if (templatePath) {
      if (inline) {
        // 内联模式：读取文件内容并嵌入
        const templateContent = readFileContent(templatePath);
        return `\n<!-- Inlined from: ${templatePath} -->\n${templateContent}\n<!-- End of: ${templatePath} -->\n`;
      }
      // 默认模式：返回路径
      return templatePath;
    }
    return match;
  });
}

// ============================================================
// expandGuidePlaceholders - 展开 {GUIDE:alias} 占位符
// 将占位符替换为指南文件的实际内容
// ============================================================
function expandGuidePlaceholders(content, guides, options = {}) {
  if (!guides) return content;

  const { inline = false } = options;

  return content.replace(/\{GUIDE:([^}]+)\}/g, (match, alias) => {
    const guidePath = guides[alias];
    if (guidePath) {
      if (inline) {
        // 内联模式：读取文件内容并嵌入
        const guideContent = readFileContent(guidePath);
        return `\n<!-- Inlined from: ${guidePath} -->\n${guideContent}\n<!-- End of: ${guidePath} -->\n`;
      }
      // 默认模式：返回路径
      return guidePath;
    }
    return match;
  });
}

// ============================================================
// expandAgentScript - 展开 {AGENT_SCRIPT} 占位符
// ============================================================
function expandAgentScript(content, agentScripts, platform) {
  if (!agentScripts || !agentScripts.sh) {
    return content;
  }

  // 替换 __AGENT__ 为平台名称
  const scriptContent = agentScripts.sh.replace(/__AGENT__/g, platform);

  // 展开 {AGENT_SCRIPT}
  return content.replace(/\{AGENT_SCRIPT\}/g, scriptContent);
}

// ============================================================
// mapArguments - 映射 $ARGUMENTS 到平台语法
// ============================================================
function mapArguments(content, platform) {
  const targetSyntax = ARGUMENT_MAPPING[platform];
  if (!targetSyntax || targetSyntax === '$ARGUMENTS') {
    return content;
  }

  return content.replace(/\$ARGUMENTS/g, targetSyntax);
}

// ============================================================
// rewritePaths - 重写内容中的 .claude/ 路径为平台路径
// ============================================================
function rewritePaths(content, pathMap) {
  if (!pathMap || Object.keys(pathMap).length === 0) {
    return content;
  }

  let result = content;

  // 按路径长度降序排序，避免短路径替换长路径的部分
  const sortedPaths = Object.keys(pathMap).sort((a, b) => b.length - a.length);

  for (const sourcePath of sortedPaths) {
    const targetPath = pathMap[sourcePath];
    // 全局替换
    result = result.split(sourcePath).join(targetPath);
  }

  return result;
}

// ============================================================
// transformForPlatform - 主转换函数
// ============================================================
function transformForPlatform(ir, platform, options = {}) {
  let body = ir.body;

  // 默认关闭内联，保持引用（仅替换为路径）
  const inlineOptions = { inline: options.inline === true };
  const pathMap = options.pathMap || {};

  // 1. 展开 {SCRIPT:alias} - 第一轮
  body = expandScriptPlaceholders(body, ir.frontmatter.scripts);

  // 2. 展开 {TEMPLATE:alias} - 内联模板内容
  body = expandTemplatePlaceholders(body, ir.frontmatter.templates, inlineOptions);

  // 3. 展开 {GUIDE:alias} - 内联指南内容
  body = expandGuidePlaceholders(body, ir.frontmatter.guides, inlineOptions);

  // 4. 递归展开内联内容中的 {SCRIPT:alias}
  // 模板/指南中可能也包含 {SCRIPT:xxx}，需要用原始 frontmatter 的 scripts 展开
  body = expandScriptPlaceholders(body, ir.frontmatter.scripts);

  // 5. 展开 {AGENT_SCRIPT}
  body = expandAgentScript(body, ir.frontmatter.agent_scripts, platform);

  // 6. 映射 $ARGUMENTS
  body = mapArguments(body, platform);

  // 7. 重写 .claude/ 路径为平台路径
  body = rewritePaths(body, pathMap);

  return {
    body,
    frontmatter: ir.frontmatter
  };
}

module.exports = {
  transformForPlatform,
  expandScriptPlaceholders,
  expandTemplatePlaceholders,
  expandGuidePlaceholders,
  expandAgentScript,
  mapArguments,
  rewritePaths,
  readFileContent,
  clearFileCache,
  ARGUMENT_MAPPING
};
