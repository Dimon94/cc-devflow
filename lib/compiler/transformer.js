/**
 * T028: Transformer Module
 *
 * Transforms CommandIR for target platforms:
 * - Expands {SCRIPT:alias} to "bash <path>"
 * - Expands {AGENT_SCRIPT} with platform-specific __AGENT__ substitution
 * - Maps $ARGUMENTS to platform-specific syntax:
 *   - codex/cursor: $ARGUMENTS (unchanged)
 *   - qwen: {{args}}
 *   - antigravity: [arguments]
 */

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
// expandScriptPlaceholders - 展开 {SCRIPT:alias} 占位符
// ============================================================
function expandScriptPlaceholders(content, scripts) {
  if (!scripts) return content;

  return content.replace(/\{SCRIPT:([^}]+)\}/g, (match, alias) => {
    const scriptPath = scripts[alias];
    if (scriptPath) {
      return `bash ${scriptPath}`;
    }
    return match; // 保留原样，由 parser 阶段验证
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
// transformForPlatform - 主转换函数
// ============================================================
function transformForPlatform(ir, platform) {
  let body = ir.body;

  // 1. 展开 {SCRIPT:alias}
  body = expandScriptPlaceholders(body, ir.frontmatter.scripts);

  // 2. 展开 {AGENT_SCRIPT}
  body = expandAgentScript(body, ir.frontmatter.agent_scripts, platform);

  // 3. 映射 $ARGUMENTS
  body = mapArguments(body, platform);

  return {
    body,
    frontmatter: ir.frontmatter
  };
}

module.exports = {
  transformForPlatform,
  expandScriptPlaceholders,
  expandAgentScript,
  mapArguments,
  ARGUMENT_MAPPING
};
