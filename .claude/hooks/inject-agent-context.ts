#!/usr/bin/env node
/**
 * [INPUT]: 依赖 fs, path, utils/jsonl-parser.ts, types/context-injection.d.ts
 * [OUTPUT]: PreToolUse hook 拦截 Task tool 调用，注入上下文
 * [POS]: hooks 的核心上下文注入逻辑，被 settings.json 配置触发
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * ==============================================
 * PreToolUse Hook: Agent Context Injection (RM-015)
 * ==============================================
 *
 * 功能: 拦截 Task tool 调用，根据 subagent_type 注入对应的上下文
 *
 * 工作流程:
 * 1. 检测 Task tool 调用
 * 2. 获取当前 REQ_ID (从环境变量或分支名)
 * 3. 读取 context/{subagent_type}.jsonl
 * 4. 解析 JSONL，加载文件内容
 * 5. 构建增强 prompt 并返回
 *
 * Exit Codes:
 *   0 - Allow (context injected or no injection needed)
 *   1 - Error (unexpected failure, fail open)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import {
  parseJsonl,
  resolveContextEntry,
  formatContextForPrompt,
  estimateTokens,
} from './utils/jsonl-parser';
import type {
  AgentType,
  AgentContext,
  EnvironmentInfo,
  ResolvedFile,
} from './types/context-injection';

// ============================================================================
// Constants
// ============================================================================

const AGENT_TYPE_MAP: Record<string, AgentType> = {
  'flow-researcher': 'research',
  'prd-writer': 'prd',
  'tech-architect': 'tech',
  'planner': 'epic',
  'dev-implementer': 'dev',
  'spec-reviewer': 'review',
  'code-quality-reviewer': 'review',
  'qa-tester': 'qa',
  'security-reviewer': 'qa',
  'release-manager': 'release',
};

const MAX_TOTAL_CONTEXT_SIZE = 200000; // 200KB total

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Detect current requirement context from environment or git branch
 */
function detectEnvironment(projectRoot: string): EnvironmentInfo {
  // Check environment variable first
  const envReqId = process.env.DEVFLOW_REQ_ID || process.env.REQ_ID;
  if (envReqId) {
    const reqPath = join(projectRoot, 'devflow', 'requirements', envReqId);
    return {
      reqId: envReqId,
      branch: null,
      inRequirementContext: existsSync(reqPath),
      requirementPath: existsSync(reqPath) ? reqPath : null,
    };
  }

  // Try to detect from git branch
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectRoot,
      encoding: 'utf-8',
    }).trim();

    // Extract REQ-XXX from branch name (e.g., feature/REQ-007-user-auth)
    const reqMatch = branch.match(/REQ-\d+/i);
    if (reqMatch) {
      const reqId = reqMatch[0].toUpperCase();
      const reqPath = join(projectRoot, 'devflow', 'requirements', reqId);
      return {
        reqId,
        branch,
        inRequirementContext: existsSync(reqPath),
        requirementPath: existsSync(reqPath) ? reqPath : null,
      };
    }

    return {
      reqId: null,
      branch,
      inRequirementContext: false,
      requirementPath: null,
    };
  } catch {
    return {
      reqId: null,
      branch: null,
      inRequirementContext: false,
      requirementPath: null,
    };
  }
}

// ============================================================================
// Context Loading
// ============================================================================

/**
 * Load context for a specific agent type
 */
function loadAgentContext(
  agentType: AgentType,
  requirementPath: string,
  projectRoot: string
): AgentContext | null {
  // First, check for requirement-specific context file
  const reqContextPath = join(requirementPath, 'context', `${agentType}.jsonl`);

  // Fall back to template if requirement-specific doesn't exist
  const templatePath = join(
    projectRoot,
    '.claude',
    'docs',
    'templates',
    'context',
    `${agentType}.jsonl.template`
  );

  const contextPath = existsSync(reqContextPath) ? reqContextPath : templatePath;

  if (!existsSync(contextPath)) {
    return null;
  }

  const { entries, errors } = parseJsonl(contextPath);

  if (errors.length > 0) {
    console.error(`⚠️  Context parse errors in ${contextPath}:`);
    for (const error of errors) {
      console.error(`  Line ${error.line}: ${error.error}`);
    }
  }

  if (entries.length === 0) {
    return null;
  }

  // Resolve all entries
  const allFiles = entries.flatMap((entry) =>
    resolveContextEntry(entry, requirementPath, projectRoot)
  );

  // Filter to only found files
  const foundFiles = allFiles.filter((f) => f.found);

  // Calculate total size and truncate if needed
  let totalSize = 0;
  const includedFiles: ResolvedFile[] = [];

  for (const file of foundFiles) {
    if (totalSize + file.content.length > MAX_TOTAL_CONTEXT_SIZE) {
      console.error(`⚠️  Context size limit reached, skipping: ${file.path}`);
      break;
    }
    totalSize += file.content.length;
    includedFiles.push(file);
  }

  return {
    agentType,
    reqId: requirementPath.split('/').pop() || 'unknown',
    files: includedFiles,
    estimatedTokens: estimateTokens(formatContextForPrompt(includedFiles)),
    resolvedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Main Hook Logic
// ============================================================================

interface HookInput {
  session_id: string;
  tool_name: string;
  tool_input: {
    subagent_type?: string;
    prompt?: string;
    description?: string;
    [key: string]: unknown;
  };
}

async function main() {
  try {
    // Read input from stdin
    const input = readFileSync(0, 'utf-8');
    const data: HookInput = JSON.parse(input);

    const { tool_name, tool_input } = data;

    // Only process Task tool calls
    if (tool_name !== 'Task') {
      process.exit(0);
    }

    // Check if subagent_type is provided
    const subagentType = tool_input.subagent_type;
    if (!subagentType) {
      process.exit(0);
    }

    // Map subagent type to context type
    const agentType = AGENT_TYPE_MAP[subagentType];
    if (!agentType) {
      // Unknown agent type, no context injection
      process.exit(0);
    }

    // Detect environment
    const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const env = detectEnvironment(projectRoot);

    if (!env.inRequirementContext || !env.requirementPath) {
      // Not in a requirement context, no injection
      console.error(`ℹ️  Context injection skipped: Not in requirement context`);
      process.exit(0);
    }

    // Load context
    const context = loadAgentContext(agentType, env.requirementPath, projectRoot);

    if (!context || context.files.length === 0) {
      console.error(`ℹ️  No context found for agent type: ${agentType}`);
      process.exit(0);
    }

    // Format context for injection
    const contextString = formatContextForPrompt(context.files);

    // Output context injection info
    console.error(`\n✅ Context Injection (RM-015)`);
    console.error(`   Agent: ${agentType}`);
    console.error(`   REQ: ${context.reqId}`);
    console.error(`   Files: ${context.files.length}`);
    console.error(`   Tokens: ~${context.estimatedTokens}`);
    console.error('');

    // Output the modified prompt to stdout (for hook system to use)
    // The hook system will read this and modify the tool input
    const modifiedPrompt = `${contextString}\n\n---\n\n${tool_input.prompt || ''}`;

    // Output JSON with modified input
    const output = {
      proceed: true,
      modifiedInput: {
        ...tool_input,
        prompt: modifiedPrompt,
      },
    };

    console.log(JSON.stringify(output));
    process.exit(0);
  } catch (error) {
    console.error('❌ Context Injection Hook Error:', error);
    // Fail open - don't block on errors
    process.exit(0);
  }
}

main();
