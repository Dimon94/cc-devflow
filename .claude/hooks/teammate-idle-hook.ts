#!/usr/bin/env npx ts-node
/**
 * [INPUT]: 依赖 quality-gates.yml 的 teammate_idle 配置，依赖 orchestration_status.json 的 Team 状态
 * [OUTPUT]: 对外提供 TeammateIdle Hook，在 Teammate 空闲时验证任务并分配下一个任务
 * [POS]: hooks/ 的 Team 任务调度器，被 Claude Team 的 TeammateIdle 事件触发
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * =============================================================================
 * CC-DevFlow TeammateIdle Hook (v4.7)
 * =============================================================================
 *
 * 核心设计哲学：
 * - Teammate 空闲时执行任务验证
 * - 验证通过后分配下一个任务
 * - 所有任务完成且所有 Teammate 空闲时触发 shutdown
 * - 状态持久化到 orchestration_status.json
 *
 * 触发条件：TeammateIdle 事件
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// =============================================================================
// 类型定义
// =============================================================================

interface TeammateIdleInput {
  hook_event_name: 'TeammateIdle';
  teammate_id: string;
  teammate_role: string;
  last_task_id?: string;
  idle_reason: 'task_complete' | 'waiting_dependency' | 'no_tasks' | 'error';
  cwd: string;
  session_id: string;
}

interface TeammateIdleOutput {
  action: 'assign_task' | 'wait' | 'shutdown';
  task_id?: string;
  message?: string;
}

interface VerifyCommand {
  name?: string;
  command: string;
  required?: boolean;
}

interface TeammateIdleConfig {
  idle_checks?: (string | VerifyCommand)[];
  assignment_strategy?: 'priority_first' | 'round_robin' | 'skill_match';
  idle_timeout?: number;
}

interface QualityGatesConfig {
  teammate_idle?: TeammateIdleConfig;
  verify?: (string | VerifyCommand)[];
  global?: {
    max_iterations?: number;
    timeout_minutes?: number;
  };
}

interface TeammateState {
  id: string;
  role: string;
  status: 'idle' | 'working' | 'blocked' | 'completed' | 'error';
  currentTask: string | null;
  completedTasks: string[];
  lastActiveAt: string;
  errorMessage?: string;
}

interface TeamState {
  mode: 'sequential' | 'parallel';
  lead: string;
  teammates: TeammateState[];
  taskAssignments: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface OrchestrationStatus {
  reqId: string;
  title?: string;
  status: string;
  phase: string;
  team?: TeamState;
  [key: string]: unknown;
}

// =============================================================================
// 配置常量
// =============================================================================

const CONFIG_FILE = '.claude/config/quality-gates.yml';
const COMMAND_TIMEOUT_MS = 60000; // 1 minute per command

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
 * 从环境变量、.current-req 文件或目录扫描提取 REQ-ID
 */
function extractReqId(repoRoot: string): string | null {
  // 尝试从目录名提取 (e.g., cc-devflow-REQ-123)
  const dirName = path.basename(repoRoot);
  const dirMatch = dirName.match(/-([A-Z]+-\d+(?:-\d+)?)$/);
  if (dirMatch) {
    return dirMatch[1];
  }

  // 尝试从 git 分支提取
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 5000
    }).trim();
    const branchMatch = branch.match(/(REQ-\d+(?:-\d+)?|BUG-\d+(?:-\d+)?)/);
    if (branchMatch) {
      return branchMatch[1];
    }
  } catch {
    // 忽略 git 错误
  }

  return null;
}

/**
 * 简单 YAML 解析器 (无外部依赖)
 * 只解析 teammate_idle 和 verify 配置
 */
function parseSimpleYaml(content: string): QualityGatesConfig {
  const config: QualityGatesConfig = {};
  const lines = content.split('\n');

  let inTeammateIdleSection = false;
  let inIdleChecksSection = false;
  let inVerifySection = false;
  const idleChecks: (string | VerifyCommand)[] = [];
  const verifyCommands: (string | VerifyCommand)[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过注释和空行
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // 检测顶级 section
    if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed.endsWith(':')) {
      const section = trimmed.slice(0, -1);
      inTeammateIdleSection = section === 'teammate_idle';
      inIdleChecksSection = false;
      inVerifySection = section === 'verify';
      continue;
    }

    // 检测 teammate_idle 子 section
    if (inTeammateIdleSection && trimmed === 'idle_checks:') {
      inIdleChecksSection = true;
      continue;
    }

    // 解析 idle_checks 列表项
    if (inIdleChecksSection && trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      if (!value.startsWith('name:') && !value.includes(':')) {
        idleChecks.push(value);
      }
      continue;
    }

    // 解析顶级 verify 列表项
    if (inVerifySection && trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      if (!value.startsWith('name:') && !value.includes(':')) {
        verifyCommands.push(value);
      }
      continue;
    }
  }

  if (idleChecks.length > 0) {
    config.teammate_idle = { idle_checks: idleChecks };
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
 * 获取 idle_checks 命令列表
 */
function getIdleChecks(config: QualityGatesConfig): string[] {
  // 优先使用 teammate_idle.idle_checks
  if (config.teammate_idle?.idle_checks) {
    return config.teammate_idle.idle_checks.map(cmd => {
      if (typeof cmd === 'string') return cmd;
      return cmd.command;
    });
  }

  // 回退到顶级 verify 命令
  if (config.verify) {
    return config.verify.map(cmd => {
      if (typeof cmd === 'string') return cmd;
      return cmd.command;
    });
  }

  // 默认验证命令
  return [
    'npm run lint --if-present',
    'npm run typecheck --if-present',
    'npm test -- --passWithNoTests'
  ];
}

/**
 * 读取 orchestration_status.json
 */
function loadOrchestrationStatus(repoRoot: string, reqId: string): OrchestrationStatus | null {
  const statusPath = path.join(repoRoot, 'devflow', 'requirements', reqId, 'orchestration_status.json');
  if (!fs.existsSync(statusPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * 更新 orchestration_status.json 中的 Teammate 状态
 */
function updateTeammateStatus(
  repoRoot: string,
  reqId: string,
  teammateId: string,
  status: string,
  currentTask: string | null
): void {
  const statusPath = path.join(repoRoot, 'devflow', 'requirements', reqId, 'orchestration_status.json');
  if (!fs.existsSync(statusPath)) {
    return;
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    const statusObj: OrchestrationStatus = JSON.parse(content);

    if (!statusObj.team) {
      return;
    }

    const now = new Date().toISOString();
    const teammate = statusObj.team.teammates.find(t => t.id === teammateId);
    if (teammate) {
      teammate.status = status as TeammateState['status'];
      teammate.currentTask = currentTask;
      teammate.lastActiveAt = now;
    }
    statusObj.team.updatedAt = now;

    fs.writeFileSync(statusPath, JSON.stringify(statusObj, null, 2), 'utf-8');
  } catch {
    // 忽略更新错误
  }
}

/**
 * 标记任务完成
 */
function markTaskComplete(
  repoRoot: string,
  reqId: string,
  teammateId: string,
  taskId: string
): void {
  const statusPath = path.join(repoRoot, 'devflow', 'requirements', reqId, 'orchestration_status.json');
  if (!fs.existsSync(statusPath)) {
    return;
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    const statusObj: OrchestrationStatus = JSON.parse(content);

    if (!statusObj.team) {
      return;
    }

    const now = new Date().toISOString();
    const teammate = statusObj.team.teammates.find(t => t.id === teammateId);
    if (teammate) {
      if (!teammate.completedTasks.includes(taskId)) {
        teammate.completedTasks.push(taskId);
      }
      teammate.currentTask = null;
      teammate.status = 'idle';
      teammate.lastActiveAt = now;
    }
    statusObj.team.updatedAt = now;

    fs.writeFileSync(statusPath, JSON.stringify(statusObj, null, 2), 'utf-8');
  } catch {
    // 忽略更新错误
  }
}

/**
 * 执行验证命令
 */
function runIdleChecks(
  repoRoot: string,
  commands: string[]
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

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
      if (output.length > 300) {
        output = output.slice(0, 300) + '...';
      }

      failures.push(`Command: ${cmd}\nError: ${output}`);
    }
  }

  return {
    passed: failures.length === 0,
    failures
  };
}

/**
 * 从 TASKS.md 提取所有任务 ID
 */
function extractTaskIds(repoRoot: string, reqId: string): string[] {
  const tasksPath = path.join(repoRoot, 'devflow', 'requirements', reqId, 'TASKS.md');
  if (!fs.existsSync(tasksPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(tasksPath, 'utf-8');
    // 匹配 **T001** 格式的任务 ID
    const matches = content.match(/\*\*T\d+\*\*/g) || [];
    return [...new Set(matches.map((m: string) => m.replace(/\*\*/g, '')))];
  } catch {
    return [];
  }
}

/**
 * 获取未分配的任务
 */
function getUnassignedTasks(
  allTasks: string[],
  teamState: TeamState | undefined
): string[] {
  if (!teamState) {
    return allTasks;
  }

  const assignedTasks = Object.keys(teamState.taskAssignments);
  const completedTasks = teamState.teammates.flatMap(t => t.completedTasks);

  return allTasks.filter(task =>
    !assignedTasks.includes(task) && !completedTasks.includes(task)
  );
}

/**
 * 检查是否所有 Teammate 都空闲
 */
function allTeammatesIdle(teamState: TeamState | undefined): boolean {
  if (!teamState || teamState.teammates.length === 0) {
    return true;
  }

  return teamState.teammates.every(t =>
    t.status === 'idle' || t.status === 'completed'
  );
}

/**
 * 检查 Teammate 是否超时
 * @param teammate Teammate 状态
 * @param timeoutSeconds 超时秒数
 * @returns 是否超时
 */
function isTeammateTimedOut(teammate: TeammateState, timeoutSeconds: number): boolean {
  if (!teammate.lastActiveAt) {
    return false;
  }

  const lastActive = new Date(teammate.lastActiveAt).getTime();
  const now = Date.now();
  const elapsedSeconds = (now - lastActive) / 1000;

  return elapsedSeconds > timeoutSeconds;
}

/**
 * 获取超时的 Teammate 列表
 */
function getTimedOutTeammates(
  teamState: TeamState | undefined,
  timeoutSeconds: number
): TeammateState[] {
  if (!teamState || teamState.teammates.length === 0) {
    return [];
  }

  return teamState.teammates.filter(t =>
    t.status === 'working' && isTeammateTimedOut(t, timeoutSeconds)
  );
}

/**
 * 记录超时告警到 EXECUTION_LOG.md
 */
function logTimeoutAlert(
  repoRoot: string,
  reqId: string,
  timedOutTeammates: TeammateState[]
): void {
  const logPath = path.join(repoRoot, 'devflow', 'requirements', reqId, 'EXECUTION_LOG.md');

  const timestamp = new Date().toISOString();
  const alertContent = timedOutTeammates.map(t =>
    `- **${t.id}** (task: ${t.currentTask || 'none'}, last active: ${t.lastActiveAt})`
  ).join('\n');

  const logEntry = `
## [${timestamp}] ⚠️ Teammate Timeout Alert

The following teammates have exceeded the idle timeout:

${alertContent}

**Action**: Consider checking their status or reassigning tasks.

---
`;

  try {
    if (fs.existsSync(logPath)) {
      fs.appendFileSync(logPath, logEntry, 'utf-8');
    } else {
      fs.writeFileSync(logPath, `# Execution Log\n${logEntry}`, 'utf-8');
    }
  } catch {
    // 忽略日志写入错误
  }
}

/**
 * 分配任务给 Teammate
 */
function assignTask(
  repoRoot: string,
  reqId: string,
  taskId: string,
  teammateId: string
): void {
  const statusPath = path.join(repoRoot, 'devflow', 'requirements', reqId, 'orchestration_status.json');
  if (!fs.existsSync(statusPath)) {
    return;
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    const statusObj: OrchestrationStatus = JSON.parse(content);

    if (!statusObj.team) {
      return;
    }

    const now = new Date().toISOString();
    statusObj.team.taskAssignments[taskId] = teammateId;

    const teammate = statusObj.team.teammates.find(t => t.id === teammateId);
    if (teammate) {
      teammate.currentTask = taskId;
      teammate.status = 'working';
      teammate.lastActiveAt = now;
    }
    statusObj.team.updatedAt = now;

    fs.writeFileSync(statusPath, JSON.stringify(statusObj, null, 2), 'utf-8');
  } catch {
    // 忽略更新错误
  }
}

// =============================================================================
// 主函数
// =============================================================================

function main(): void {
  let inputData: TeammateIdleInput;

  // 读取 stdin 输入
  try {
    const stdin = fs.readFileSync(0, 'utf-8');
    inputData = JSON.parse(stdin);
  } catch {
    // 无法解析输入，返回 wait
    const output: TeammateIdleOutput = {
      action: 'wait',
      message: 'Failed to parse input'
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 验证 hook 事件类型
  if (inputData.hook_event_name !== 'TeammateIdle') {
    const output: TeammateIdleOutput = {
      action: 'wait',
      message: 'Not a TeammateIdle event'
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  const { teammate_id, last_task_id, idle_reason, cwd } = inputData;

  // 查找仓库根目录
  const repoRoot = findRepoRoot(cwd);
  if (!repoRoot) {
    const output: TeammateIdleOutput = {
      action: 'wait',
      message: 'Not in a git repository'
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 提取 REQ-ID
  const reqId = extractReqId(repoRoot);
  if (!reqId) {
    const output: TeammateIdleOutput = {
      action: 'wait',
      message: 'Could not determine REQ-ID'
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 加载配置
  const config = loadConfig(repoRoot);
  const idleChecks = getIdleChecks(config);
  const idleTimeout = config.teammate_idle?.idle_timeout || 300; // 默认 5 分钟

  // 加载 orchestration_status.json
  const status = loadOrchestrationStatus(repoRoot, reqId);
  if (!status) {
    const output: TeammateIdleOutput = {
      action: 'wait',
      message: 'orchestration_status.json not found'
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 检查超时的 Teammate 并记录告警
  const timedOutTeammates = getTimedOutTeammates(status.team, idleTimeout);
  if (timedOutTeammates.length > 0) {
    logTimeoutAlert(repoRoot, reqId, timedOutTeammates);
  }

  // 如果有上一个任务，执行验证
  if (last_task_id && idle_reason === 'task_complete') {
    const { passed, failures } = runIdleChecks(repoRoot, idleChecks);

    if (!passed) {
      // 验证失败，让 Teammate 继续修复
      updateTeammateStatus(repoRoot, reqId, teammate_id, 'working', last_task_id);

      const output: TeammateIdleOutput = {
        action: 'assign_task',
        task_id: last_task_id,
        message: `Verification failed. Please fix the issues:\n\n${failures.join('\n\n')}`
      };
      console.log(JSON.stringify(output, null, 0));
      process.exit(0);
    }

    // 验证通过，标记任务完成
    markTaskComplete(repoRoot, reqId, teammate_id, last_task_id);
  }

  // 获取所有任务和未分配任务
  const allTasks = extractTaskIds(repoRoot, reqId);
  const unassignedTasks = getUnassignedTasks(allTasks, status.team);

  // 如果有未分配任务，分配下一个
  if (unassignedTasks.length > 0) {
    const nextTask = unassignedTasks[0]; // priority_first 策略
    assignTask(repoRoot, reqId, nextTask, teammate_id);

    const output: TeammateIdleOutput = {
      action: 'assign_task',
      task_id: nextTask,
      message: `Assigned task ${nextTask}`
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 没有未分配任务，检查是否所有 Teammate 都空闲
  if (allTeammatesIdle(status.team)) {
    // 所有任务完成，所有 Teammate 空闲，触发 shutdown
    const output: TeammateIdleOutput = {
      action: 'shutdown',
      message: 'All tasks completed. Shutting down.'
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 还有其他 Teammate 在工作，等待
  const output: TeammateIdleOutput = {
    action: 'wait',
    message: 'Waiting for other teammates to complete their tasks'
  };
  console.log(JSON.stringify(output, null, 0));
  process.exit(0);
}

main();
