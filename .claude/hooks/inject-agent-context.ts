#!/usr/bin/env npx ts-node
/**
 * [INPUT]: 依赖 fs, path, child_process
 * [OUTPUT]: PreToolUse hook 拦截 Task tool 调用，注入上下文
 * [POS]: hooks 的核心上下文注入逻辑，被 settings.json 配置触发
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * ==============================================
 * PreToolUse Hook: Agent Context Injection (RM-015)
 * ==============================================
 *
 * 借鉴 Trellis 的 inject-subagent-context.py 实现
 *
 * 功能: 拦截 Task tool 调用，根据 subagent_type 注入对应的上下文
 *
 * 工作流程:
 * 1. 检测 Task tool 调用
 * 2. 获取 subagent_type 参数
 * 3. 定位当前任务目录 (从 .claude/.current-task 或环境变量或分支名)
 * 4. 读取对应的 {subagent_type}.jsonl 文件
 * 5. 解析 JSONL，读取每个文件内容
 * 6. 注入到 prompt 参数中
 *
 * JSONL 格式 (Trellis 风格):
 * {"file": "path/to/file.md", "reason": "Why this file is needed"}
 * {"file": "path/to/dir/", "type": "directory", "reason": "Why this dir"}
 *
 * Exit Codes:
 *   0 - Allow (context injected or no injection needed)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Constants
// ============================================================================

const DIR_WORKFLOW = '.claude';
const DIR_SKILLS = 'skills/workflow';
const DIR_REQUIREMENTS = 'devflow/requirements';
const FILE_CURRENT_TASK = '.current-task';

// Agent type to skill directory mapping
const AGENT_SKILL_MAP: Record<string, string> = {
  'flow-researcher': 'flow-init',
  'prd-writer': 'flow-spec',
  'tech-architect': 'flow-spec',
  'ui-designer': 'flow-spec',
  'planner': 'flow-spec',
  'dev-implementer': 'flow-dev',
  'qa-tester': 'flow-quality',
  'security-reviewer': 'flow-quality',
  'release-manager': 'flow-release',
};

// Agent type to JSONL filename mapping
const AGENT_JSONL_MAP: Record<string, string> = {
  'flow-researcher': 'researcher.jsonl',
  'prd-writer': 'prd-writer.jsonl',
  'tech-architect': 'tech-architect.jsonl',
  'ui-designer': 'ui-designer.jsonl',
  'planner': 'planner.jsonl',
  'dev-implementer': 'dev-implementer.jsonl',
  'qa-tester': 'qa-tester.jsonl',
  'security-reviewer': 'security-reviewer.jsonl',
  'release-manager': 'release-manager.jsonl',
};

const MAX_FILE_SIZE = 50000; // 50KB per file
const MAX_TOTAL_SIZE = 200000; // 200KB total

// ============================================================================
// JSONL Entry Types (Trellis Style)
// ============================================================================

interface JsonlEntry {
  file?: string;
  path?: string;
  type?: 'file' | 'directory';
  reason: string;
  required?: boolean;
  optional?: boolean;
}

interface ResolvedFile {
  path: string;
  content: string;
  reason: string;
  found: boolean;
  truncated: boolean;
}

// ============================================================================
// Path Resolution
// ============================================================================

function findRepoRoot(startPath: string): string | null {
  let current = resolve(startPath);
  while (current !== dirname(current)) {
    if (existsSync(join(current, '.git'))) {
      return current;
    }
    current = dirname(current);
  }
  return null;
}

function getCurrentTask(repoRoot: string): string | null {
  const currentTaskFile = join(repoRoot, DIR_WORKFLOW, FILE_CURRENT_TASK);
  if (!existsSync(currentTaskFile)) {
    return null;
  }
  try {
    const content = readFileSync(currentTaskFile, 'utf-8').trim();
    return content || null;
  } catch {
    return null;
  }
}

function getReqIdFromBranch(repoRoot: string): string | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoRoot,
      encoding: 'utf-8',
    }).trim();
    const match = branch.match(/REQ-\d+/i);
    return match ? match[0].toUpperCase() : null;
  } catch {
    return null;
  }
}

function getReqIdFromEnv(): string | null {
  return process.env.DEVFLOW_REQ_ID || process.env.REQ_ID || null;
}

// ============================================================================
// File Reading
// ============================================================================

function readFileContent(filePath: string): string | null {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return null;
  }
  try {
    let content = readFileSync(filePath, 'utf-8');
    if (content.length > MAX_FILE_SIZE) {
      content = content.substring(0, MAX_FILE_SIZE) + '\n\n... [TRUNCATED]';
    }
    return content;
  } catch {
    return null;
  }
}

function readDirectoryContents(
  dirPath: string,
  maxFiles: number = 20
): Array<{ path: string; content: string }> {
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
    return [];
  }

  const results: Array<{ path: string; content: string }> = [];
  try {
    const files = readdirSync(dirPath)
      .filter((f) => /\.(md|yaml|yml|json|ts|js)$/.test(f))
      .sort()
      .slice(0, maxFiles);

    for (const file of files) {
      const fullPath = join(dirPath, file);
      const content = readFileContent(fullPath);
      if (content) {
        results.push({ path: fullPath, content });
      }
    }
  } catch {
    // Ignore errors
  }
  return results;
}

// ============================================================================
// JSONL Parsing
// ============================================================================

function parseJsonlFile(filePath: string): JsonlEntry[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const entries: JsonlEntry[] = [];
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
        continue;
      }
      try {
        const entry = JSON.parse(trimmed) as JsonlEntry;
        entries.push(entry);
      } catch {
        // Skip invalid lines
      }
    }
  } catch {
    // Ignore file read errors
  }
  return entries;
}

function resolveJsonlEntries(
  entries: JsonlEntry[],
  reqPath: string,
  repoRoot: string,
  reqId: string
): ResolvedFile[] {
  const results: ResolvedFile[] = [];

  for (const entry of entries) {
    const filePath = entry.file || entry.path;
    if (!filePath) continue;

    const entryType = entry.type || 'file';
    const reason = entry.reason || 'Context file';

    // Replace {REQ} placeholder with actual REQ-ID
    const resolvedPath = filePath.replace(/\{REQ\}/g, reqId);

    // Determine absolute path
    let absolutePath: string;
    if (resolvedPath.startsWith('/')) {
      absolutePath = resolvedPath;
    } else if (
      resolvedPath.startsWith('.claude/') ||
      resolvedPath.startsWith('devflow/')
    ) {
      absolutePath = join(repoRoot, resolvedPath);
    } else {
      absolutePath = join(reqPath, resolvedPath);
    }

    if (entryType === 'directory') {
      const dirContents = readDirectoryContents(absolutePath);
      for (const { path, content } of dirContents) {
        results.push({
          path,
          content,
          reason: `${reason} - ${path.split('/').pop()}`,
          found: true,
          truncated: content.includes('[TRUNCATED]'),
        });
      }
    } else {
      const content = readFileContent(absolutePath);
      results.push({
        path: resolvedPath,
        content: content || '',
        reason,
        found: !!content,
        truncated: content?.includes('[TRUNCATED]') || false,
      });
    }
  }

  return results;
}

// ============================================================================
// Context Building
// ============================================================================

function buildContextString(files: ResolvedFile[]): string {
  const sections: string[] = [];
  let totalSize = 0;

  for (const file of files) {
    if (!file.found) continue;
    if (totalSize + file.content.length > MAX_TOTAL_SIZE) {
      console.error(`⚠️  Context size limit reached, skipping: ${file.path}`);
      break;
    }

    sections.push(`=== ${file.path} (${file.reason}) ===\n${file.content}`);
    totalSize += file.content.length;
  }

  return sections.join('\n\n');
}

function buildEnhancedPrompt(
  originalPrompt: string,
  context: string,
  agentType: string,
  reqId: string
): string {
  return `# ${agentType} Agent Task

## Injected Context (REQ: ${reqId})

The following context has been automatically loaded:

${context}

---

## Your Task

${originalPrompt}

---

## Important

- All relevant context is provided above
- Follow the specifications and conventions in the injected files
- Report any issues or missing information`;
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
  cwd?: string;
}

interface HookOutput {
  hookSpecificOutput: {
    hookEventName: string;
    permissionDecision: string;
    updatedInput?: Record<string, unknown>;
  };
}

function main() {
  try {
    const input = readFileSync(0, 'utf-8');
    const data: HookInput = JSON.parse(input);

    const { tool_name, tool_input, cwd } = data;

    // Only process Task tool calls
    if (tool_name !== 'Task') {
      process.exit(0);
    }

    const subagentType = tool_input.subagent_type;
    if (!subagentType) {
      process.exit(0);
    }

    // Check if we have a mapping for this agent type
    const skillDir = AGENT_SKILL_MAP[subagentType];
    if (!skillDir) {
      // Unknown agent type, no context injection
      process.exit(0);
    }

    // Find repo root
    const repoRoot = findRepoRoot(cwd || process.cwd());
    if (!repoRoot) {
      process.exit(0);
    }

    // Get REQ-ID from multiple sources
    const reqId =
      getReqIdFromEnv() ||
      (() => {
        const taskDir = getCurrentTask(repoRoot);
        if (taskDir) {
          const match = taskDir.match(/REQ-\d+/i);
          return match ? match[0].toUpperCase() : null;
        }
        return null;
      })() ||
      getReqIdFromBranch(repoRoot);

    if (!reqId) {
      console.error(`ℹ️  Context injection skipped: No REQ-ID found`);
      process.exit(0);
    }

    const reqPath = join(repoRoot, DIR_REQUIREMENTS, reqId);
    if (!existsSync(reqPath)) {
      console.error(`ℹ️  Context injection skipped: REQ path not found: ${reqPath}`);
      process.exit(0);
    }

    // Try to find JSONL file in multiple locations
    const jsonlFilename = AGENT_JSONL_MAP[subagentType] || 'context.jsonl';
    const possiblePaths = [
      // 1. Requirement-specific context
      join(reqPath, 'context', jsonlFilename),
      // 2. Skill-specific context
      join(repoRoot, DIR_WORKFLOW, DIR_SKILLS, skillDir, jsonlFilename),
      // 3. Skill default context.jsonl
      join(repoRoot, DIR_WORKFLOW, DIR_SKILLS, skillDir, 'context.jsonl'),
    ];

    let entries: JsonlEntry[] = [];
    let usedPath = '';

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        entries = parseJsonlFile(path);
        if (entries.length > 0) {
          usedPath = path;
          break;
        }
      }
    }

    if (entries.length === 0) {
      console.error(`ℹ️  No context JSONL found for: ${subagentType}`);
      process.exit(0);
    }

    // Resolve entries to actual file contents
    const resolvedFiles = resolveJsonlEntries(entries, reqPath, repoRoot, reqId);
    const foundFiles = resolvedFiles.filter((f) => f.found);

    if (foundFiles.length === 0) {
      console.error(`ℹ️  No context files found for: ${subagentType}`);
      process.exit(0);
    }

    // Build context string
    const contextString = buildContextString(foundFiles);
    const enhancedPrompt = buildEnhancedPrompt(
      tool_input.prompt || '',
      contextString,
      subagentType,
      reqId
    );

    // Output injection info
    console.error(`\n✅ Context Injection (RM-015)`);
    console.error(`   Agent: ${subagentType}`);
    console.error(`   REQ: ${reqId}`);
    console.error(`   JSONL: ${usedPath}`);
    console.error(`   Files: ${foundFiles.length}/${resolvedFiles.length}`);
    console.error(`   Size: ~${Math.round(contextString.length / 1000)}KB`);
    console.error('');

    // Return updated input
    const output: HookOutput = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        updatedInput: {
          ...tool_input,
          prompt: enhancedPrompt,
        },
      },
    };

    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  } catch (error) {
    console.error('❌ Context Injection Hook Error:', error);
    // Fail open - don't block on errors
    process.exit(0);
  }
}

main();
