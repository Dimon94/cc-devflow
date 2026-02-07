#!/usr/bin/env npx ts-node
/**
 * [INPUT]: 依赖 quality-gates.yml 的 verify 命令配置
 * [OUTPUT]: 对外提供 SubagentStop 钩子，拦截子 Agent 停止并执行程序化验证
 * [POS]: hooks/ 的 Ralph Loop 控制器，确保代码质量后才允许停止
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * =============================================================================
 * CC-DevFlow Ralph Loop - SubagentStop Hook (借鉴 Trellis)
 * =============================================================================
 *
 * 核心设计哲学：
 * - 子 Agent 尝试停止时执行程序化验证
 * - 验证失败则阻止停止，返回错误信息
 * - 最多迭代 N 次，防止无限循环
 * - 状态持久化到 .ralph-state.json
 *
 * 触发条件：SubagentStop 事件
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// =============================================================================
// 类型定义
// =============================================================================

interface RalphState {
  agent_id: string;
  iteration: number;
  last_failures: FailureRecord[];
  started_at: string;
}

interface FailureRecord {
  command: string;
  output: string;
  timestamp: string;
}

interface VerifyCommand {
  name?: string;
  command: string;
  required?: boolean;
}

interface QualityGatesConfig {
  verify?: (string | VerifyCommand)[];
  ralph_loop?: {
    max_iterations?: number;
    timeout_minutes?: number;
  };
  global?: {
    max_iterations?: number;
    timeout_minutes?: number;
  };
}

interface HookInput {
  hook_event_name: string;
  subagent_type?: string;
  agent_output?: string;
  prompt?: string;
  cwd?: string;
  session_id?: string;
}

interface HookOutput {
  decision: 'allow' | 'block';
  reason: string;
  systemMessage?: string;
}

// =============================================================================
// 配置常量
// =============================================================================

const DEFAULT_MAX_ITERATIONS = 5;
const DEFAULT_TIMEOUT_MINUTES = 30;
const STATE_FILE = '.ralph-state.json';
const CONFIG_FILE = '.claude/config/quality-gates.yml';
const COMMAND_TIMEOUT_MS = 120000; // 2 minutes per command

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
 * 简单 YAML 解析器 (无外部依赖)
 * 只解析 verify 列表和 ralph_loop 配置
 */
function parseSimpleYaml(content: string): QualityGatesConfig {
  const config: QualityGatesConfig = {};
  const lines = content.split('\n');

  let currentSection = '';
  let inVerifySection = false;
  let inRalphLoopSection = false;
  let inGlobalSection = false;
  const verifyCommands: (string | VerifyCommand)[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过注释和空行
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // 检测顶级 section
    if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed.endsWith(':')) {
      currentSection = trimmed.slice(0, -1);
      inVerifySection = false;
      inRalphLoopSection = currentSection === 'ralph_loop';
      inGlobalSection = currentSection === 'global';
      continue;
    }

    // 检测 verify 子 section
    if (trimmed === 'verify:') {
      inVerifySection = true;
      continue;
    }

    // 解析 verify 列表项
    if (inVerifySection && trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      // 简单字符串命令
      if (!value.startsWith('name:') && !value.includes(':')) {
        verifyCommands.push(value);
      }
      continue;
    }

    // 解析 ralph_loop 配置
    if (inRalphLoopSection) {
      if (trimmed.startsWith('max_iterations:')) {
        const val = parseInt(trimmed.split(':')[1].trim(), 10);
        if (!isNaN(val)) {
          config.ralph_loop = config.ralph_loop || {};
          config.ralph_loop.max_iterations = val;
        }
      } else if (trimmed.startsWith('timeout_minutes:')) {
        const val = parseInt(trimmed.split(':')[1].trim(), 10);
        if (!isNaN(val)) {
          config.ralph_loop = config.ralph_loop || {};
          config.ralph_loop.timeout_minutes = val;
        }
      }
    }

    // 解析 global 配置
    if (inGlobalSection) {
      if (trimmed.startsWith('max_iterations:')) {
        const val = parseInt(trimmed.split(':')[1].trim(), 10);
        if (!isNaN(val)) {
          config.global = config.global || {};
          config.global.max_iterations = val;
        }
      } else if (trimmed.startsWith('timeout_minutes:')) {
        const val = parseInt(trimmed.split(':')[1].trim(), 10);
        if (!isNaN(val)) {
          config.global = config.global || {};
          config.global.timeout_minutes = val;
        }
      }
    }
  }

  if (verifyCommands.length > 0) {
    config.verify = verifyCommands;
  }

  return config;
}

/**
 * 读取 quality-gates.yml 配置
 */
function loadConfig(repoRoot: string): QualityGatesConfig {
  const configPath = path.join(repoRoot, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return parseSimpleYaml(content);
  } catch {
    return {};
  }
}

/**
 * 获取 verify 命令列表
 */
function getVerifyCommands(config: QualityGatesConfig): string[] {
  if (!config.verify) {
    // 默认验证命令
    return [
      'npm run lint --if-present',
      'npm run typecheck --if-present',
      'npm test -- --passWithNoTests'
    ];
  }

  return config.verify.map(cmd => {
    if (typeof cmd === 'string') return cmd;
    return cmd.command;
  });
}

/**
 * 获取最大迭代次数
 */
function getMaxIterations(config: QualityGatesConfig): number {
  return config.ralph_loop?.max_iterations
    ?? config.global?.max_iterations
    ?? DEFAULT_MAX_ITERATIONS;
}

/**
 * 获取超时时间 (分钟)
 */
function getTimeoutMinutes(config: QualityGatesConfig): number {
  return config.ralph_loop?.timeout_minutes
    ?? config.global?.timeout_minutes
    ?? DEFAULT_TIMEOUT_MINUTES;
}

/**
 * 加载 Ralph 状态
 */
function loadState(repoRoot: string, agentId: string): RalphState {
  const statePath = path.join(repoRoot, STATE_FILE);

  if (!fs.existsSync(statePath)) {
    return createNewState(agentId);
  }

  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    const state: RalphState = JSON.parse(content);

    // 检查是否是同一个 agent 会话
    if (state.agent_id !== agentId) {
      return createNewState(agentId);
    }

    return state;
  } catch {
    return createNewState(agentId);
  }
}

/**
 * 创建新状态
 */
function createNewState(agentId: string): RalphState {
  return {
    agent_id: agentId,
    iteration: 0,
    last_failures: [],
    started_at: new Date().toISOString()
  };
}

/**
 * 保存 Ralph 状态
 */
function saveState(repoRoot: string, state: RalphState): void {
  const statePath = path.join(repoRoot, STATE_FILE);
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // 忽略写入错误
  }
}

/**
 * 清理 Ralph 状态
 */
function clearState(repoRoot: string): void {
  const statePath = path.join(repoRoot, STATE_FILE);
  try {
    if (fs.existsSync(statePath)) {
      fs.unlinkSync(statePath);
    }
  } catch {
    // 忽略删除错误
  }
}

/**
 * 检查是否超时
 */
function isTimedOut(state: RalphState, timeoutMinutes: number): boolean {
  const startedAt = new Date(state.started_at);
  const now = new Date();
  const elapsedMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);
  return elapsedMinutes >= timeoutMinutes;
}

/**
 * 执行验证命令
 */
function runVerifyCommands(
  repoRoot: string,
  commands: string[]
): { passed: boolean; failures: FailureRecord[] } {
  const failures: FailureRecord[] = [];

  for (const cmd of commands) {
    try {
      execSync(cmd, {
        cwd: repoRoot,
        timeout: COMMAND_TIMEOUT_MS,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8'
      });
    } catch (error: unknown) {
      let output = '';
      if (error && typeof error === 'object') {
        const execError = error as { stderr?: string; stdout?: string; message?: string };
        output = execError.stderr || execError.stdout || execError.message || 'Unknown error';
      }

      // 截断过长输出
      if (output.length > 500) {
        output = output.slice(0, 500) + '...';
      }

      failures.push({
        command: cmd,
        output,
        timestamp: new Date().toISOString()
      });
    }
  }

  return {
    passed: failures.length === 0,
    failures
  };
}

/**
 * 格式化失败信息
 */
function formatFailures(failures: FailureRecord[]): string {
  return failures.map(f => `Command: ${f.command}\nOutput: ${f.output}`).join('\n\n');
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
    // 无法解析输入，允许停止
    process.exit(0);
  }

  const hookEvent = inputData.hook_event_name || '';

  // 只处理 SubagentStop 事件
  if (hookEvent !== 'SubagentStop') {
    process.exit(0);
  }

  const cwd = inputData.cwd || process.cwd();
  const agentId = inputData.session_id || 'default';

  // 查找仓库根目录
  const repoRoot = findRepoRoot(cwd);
  if (!repoRoot) {
    process.exit(0);
  }

  // 加载配置
  const config = loadConfig(repoRoot);
  const maxIterations = getMaxIterations(config);
  const timeoutMinutes = getTimeoutMinutes(config);
  const verifyCommands = getVerifyCommands(config);

  // 加载状态
  const state = loadState(repoRoot, agentId);

  // 检查超时
  if (isTimedOut(state, timeoutMinutes)) {
    clearState(repoRoot);
    const output: HookOutput = {
      decision: 'allow',
      reason: `Timeout (${timeoutMinutes} minutes) reached. Stopping Ralph loop.`
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 增加迭代计数
  state.iteration += 1;

  // 检查最大迭代次数
  if (state.iteration >= maxIterations) {
    clearState(repoRoot);
    const output: HookOutput = {
      decision: 'allow',
      reason: `Max iterations (${maxIterations}) reached. Stopping to prevent infinite loop.`
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 执行验证命令
  const { passed, failures } = runVerifyCommands(repoRoot, verifyCommands);

  if (passed) {
    // 所有验证通过，允许停止
    clearState(repoRoot);
    const output: HookOutput = {
      decision: 'allow',
      reason: 'All verify commands passed. Quality check complete.'
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 验证失败，更新状态并阻止停止
  state.last_failures = failures;
  saveState(repoRoot, state);

  const failureDetails = formatFailures(failures);
  const output: HookOutput = {
    decision: 'block',
    reason: `Iteration ${state.iteration}/${maxIterations}. Verification failed:\n\n${failureDetails}\n\nPlease fix the issues and try again.`,
    systemMessage: `Ralph Loop iteration ${state.iteration}/${maxIterations} - Fix the errors above to proceed.`
  };

  console.log(JSON.stringify(output, null, 0));
  process.exit(0);
}

main();
