#!/usr/bin/env npx ts-node
/**
 * [INPUT]: 依赖 workflow.yaml 的 Skill 定义，依赖各 Skill 的 context.jsonl
 * [OUTPUT]: 对外提供 PreToolUse 钩子，自动注入 Skill 上下文
 * [POS]: hooks/ 的核心上下文注入器，被所有 Skill 调用时触发
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * =============================================================================
 * CC-DevFlow Skill Context Injection Hook (借鉴 Trellis)
 * =============================================================================
 *
 * 核心设计哲学：
 * - Skill 调用时自动注入所需上下文
 * - 通过 context.jsonl 定义每个 Skill 的上下文需求
 * - 支持变量替换 ({REQ} → 实际 REQ-ID)
 * - 可选文件缺失时不报错
 *
 * 触发条件：PreToolUse (Skill tool 调用前)
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// 类型定义
// =============================================================================

interface ContextEntry {
  file: string;
  reason?: string;
  optional?: boolean;
  type?: 'file' | 'directory';
}

interface HookInput {
  tool_name: string;
  tool_input: {
    skill?: string;
    prompt?: string;
    [key: string]: unknown;
  };
  cwd: string;
}

interface HookOutput {
  hookSpecificOutput: {
    hookEventName: string;
    permissionDecision: string;
    updatedInput?: Record<string, unknown>;
  };
}

// =============================================================================
// 路径常量
// =============================================================================

const DIR_SKILLS = '.claude/skills';
const DIR_WORKFLOW = 'workflow';
const DIR_DOMAIN = 'domain';
const DIR_GUARDRAIL = 'guardrail';
const DIR_UTILITY = 'utility';
const FILE_CONTEXT = 'context.jsonl';
const DIR_REQUIREMENTS = 'devflow/requirements';

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 查找 Git 仓库根目录
 */
function findRepoRoot(startPath: string): string | null {
  let current = path.resolve(startPath);
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, '.git'))) {
      return current;
    }
    current = path.dirname(current);
  }
  return null;
}

/**
 * 从 orchestration_status.json 获取当前 REQ-ID
 */
function getCurrentReqId(repoRoot: string): string | null {
  // 方法1: 从最近修改的 requirements 目录推断
  const reqDir = path.join(repoRoot, DIR_REQUIREMENTS);
  if (!fs.existsSync(reqDir)) return null;

  try {
    const dirs = fs.readdirSync(reqDir)
      .filter(d => d.startsWith('REQ-'))
      .map(d => ({
        name: d,
        mtime: fs.statSync(path.join(reqDir, d)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime);

    return dirs.length > 0 ? dirs[0].name : null;
  } catch {
    return null;
  }
}

/**
 * 替换路径中的变量
 */
function replaceVariables(filePath: string, reqId: string | null): string {
  if (!reqId) return filePath;
  return filePath.replace(/{REQ}/g, reqId);
}

/**
 * 读取文件内容
 */
function readFileContent(basePath: string, filePath: string): string | null {
  const fullPath = path.join(basePath, filePath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return null;
  }
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * 读取目录中的所有 .md 文件
 */
function readDirectoryContents(
  basePath: string,
  dirPath: string,
  maxFiles = 20
): Array<[string, string]> {
  const fullPath = path.join(basePath, dirPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    return [];
  }

  const results: Array<[string, string]> = [];
  try {
    const mdFiles = fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.md'))
      .sort()
      .slice(0, maxFiles);

    for (const filename of mdFiles) {
      const fileFull = path.join(fullPath, filename);
      const relativePath = path.join(dirPath, filename);
      try {
        const content = fs.readFileSync(fileFull, 'utf-8');
        results.push([relativePath, content]);
      } catch {
        continue;
      }
    }
  } catch {
    // ignore
  }
  return results;
}

/**
 * 解析 JSONL 文件并读取引用的文件内容
 */
function readJsonlEntries(
  basePath: string,
  jsonlPath: string,
  reqId: string | null
): Array<[string, string]> {
  const fullPath = path.join(basePath, jsonlPath);
  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const results: Array<[string, string]> = [];
  try {
    const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const entry: ContextEntry = JSON.parse(trimmed);
        const filePath = replaceVariables(entry.file, reqId);
        const entryType = entry.type || 'file';

        if (entryType === 'directory') {
          const dirContents = readDirectoryContents(basePath, filePath);
          results.push(...dirContents);
        } else {
          const content = readFileContent(basePath, filePath);
          if (content) {
            results.push([filePath, content]);
          } else if (!entry.optional) {
            // 非可选文件缺失，记录警告但继续
            console.error(`[inject-skill-context] Warning: Required file not found: ${filePath}`);
          }
        }
      } catch {
        continue;
      }
    }
  } catch {
    // ignore
  }
  return results;
}

/**
 * 查找 Skill 目录
 */
function findSkillPath(repoRoot: string, skillName: string): string | null {
  // 搜索顺序: workflow → domain → guardrail → utility → 根目录
  const searchDirs = [DIR_WORKFLOW, DIR_DOMAIN, DIR_GUARDRAIL, DIR_UTILITY, ''];

  for (const subDir of searchDirs) {
    const skillPath = path.join(repoRoot, DIR_SKILLS, subDir, skillName);
    if (fs.existsSync(skillPath) && fs.existsSync(path.join(skillPath, 'SKILL.md'))) {
      return skillPath;
    }
  }

  // 兼容旧结构：直接在 skills/ 下
  const legacyPath = path.join(repoRoot, DIR_SKILLS, skillName);
  if (fs.existsSync(legacyPath) && fs.existsSync(path.join(legacyPath, 'SKILL.md'))) {
    return legacyPath;
  }

  return null;
}

/**
 * 获取 Skill 的上下文
 */
function getSkillContext(
  repoRoot: string,
  skillPath: string,
  reqId: string | null
): string {
  const contextParts: string[] = [];

  // 1. 读取 Skill 的 context.jsonl
  const contextJsonl = path.join(skillPath, FILE_CONTEXT);
  const relativeContextPath = path.relative(repoRoot, contextJsonl);

  if (fs.existsSync(contextJsonl)) {
    const entries = readJsonlEntries(repoRoot, relativeContextPath, reqId);
    for (const [filePath, content] of entries) {
      contextParts.push(`=== ${filePath} ===\n${content}`);
    }
  }

  return contextParts.join('\n\n');
}

/**
 * 构建增强后的 prompt
 */
function buildEnhancedPrompt(
  originalPrompt: string,
  context: string,
  skillName: string
): string {
  if (!context) {
    return originalPrompt;
  }

  return `# Skill Context Injection

The following context has been automatically injected for skill: ${skillName}

---

${context}

---

## Original Task

${originalPrompt}`;
}

// =============================================================================
// 主函数
// =============================================================================

function main(): void {
  let inputData: HookInput;

  try {
    const stdin = fs.readFileSync(0, 'utf-8');
    inputData = JSON.parse(stdin);
  } catch {
    process.exit(0);
  }

  const toolName = inputData.tool_name || '';

  // 只处理 Skill tool 调用
  if (toolName !== 'Skill') {
    process.exit(0);
  }

  const toolInput = inputData.tool_input || {};
  const skillName = toolInput.skill as string;
  const originalPrompt = (toolInput.prompt as string) || '';
  const cwd = inputData.cwd || process.cwd();

  if (!skillName) {
    process.exit(0);
  }

  // 查找仓库根目录
  const repoRoot = findRepoRoot(cwd);
  if (!repoRoot) {
    process.exit(0);
  }

  // 查找 Skill 路径
  const skillPath = findSkillPath(repoRoot, skillName);
  if (!skillPath) {
    // Skill 不存在或没有 context.jsonl，不注入
    process.exit(0);
  }

  // 获取当前 REQ-ID
  const reqId = getCurrentReqId(repoRoot);

  // 获取上下文
  const context = getSkillContext(repoRoot, skillPath, reqId);

  if (!context) {
    // 没有上下文需要注入
    process.exit(0);
  }

  // 构建增强后的 prompt
  const enhancedPrompt = buildEnhancedPrompt(originalPrompt, context, skillName);

  // 返回更新后的输入
  const output: HookOutput = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      updatedInput: {
        ...toolInput,
        prompt: enhancedPrompt
      }
    }
  };

  console.log(JSON.stringify(output, null, 0));
  process.exit(0);
}

main();
