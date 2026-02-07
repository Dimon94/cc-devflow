#!/usr/bin/env npx ts-node
/**
 * [INPUT]: 依赖 quality-gates.yml 的 task_completed.verify 配置，依赖 common.sh 的 mark_teammate_task_complete
 * [OUTPUT]: 对外提供 TaskCompleted 钩子，验证任务完成质量并更新状态
 * [POS]: hooks/ 的任务完成验证器，被 Claude Team 系统消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * =============================================================================
 * CC-DevFlow TaskCompleted Hook (v4.7)
 * =============================================================================
 *
 * 核心设计哲学：
 * - 任务标记完成时执行程序化验证
 * - 验证失败且 block_on_failure=true 时阻止完成
 * - 记录失败到 ERROR_LOG.md
 * - 更新 Team 状态并检查阶段转换
 *
 * 触发条件：TaskCompleted 事件
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// =============================================================================
// 类型定义 (复用 team-types.d.ts 中的定义)
// =============================================================================

interface TaskCompletedInput {
  hook_event_name: 'TaskCompleted';
  task_id: string;
  task_subject: string;
  completed_by: string;
  completion_time: string;
  cwd: string;
  session_id: string;
}

interface TaskCompletedOutput {
  decision: 'accept' | 'reject';
  reason: string;
  next_actions?: string[];
}

interface VerifyCommand {
  name?: string;
  command: string;
  required?: boolean;
}

interface TaskCompletedConfig {
  verify?: (string | VerifyCommand)[];
  block_on_failure?: boolean;
  max_retries?: number;
}

interface QualityGatesConfig {
  task_completed?: TaskCompletedConfig;
  verify?: (string | VerifyCommand)[];
}

interface FailureRecord {
  command: string;
  output: string;
  timestamp: string;
}

// =============================================================================
// 配置常量
// =============================================================================

const CONFIG_FILE = '.claude/config/quality-gates.yml';
const COMMAND_TIMEOUT_MS = 120000; // 2 minutes per command
const SCRIPTS_DIR = '.claude/scripts';

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
 * 解析 task_completed 和顶级 verify 配置
 */
function parseSimpleYaml(content: string): QualityGatesConfig {
  const config: QualityGatesConfig = {};
  const lines = content.split('\n');

  let currentSection = '';
  let inVerifySection = false;
  let inTaskCompletedSection = false;
  let inTaskCompletedVerify = false;
  const topLevelVerify: (string | VerifyCommand)[] = [];
  const taskCompletedVerify: (string | VerifyCommand)[] = [];
  let blockOnFailure = true; // default

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;

    // 跳过注释和空行
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // 检测顶级 section
    if (indent === 0 && trimmed.endsWith(':')) {
      currentSection = trimmed.slice(0, -1);
      inVerifySection = false;
      inTaskCompletedSection = currentSection === 'task_completed';
      inTaskCompletedVerify = false;
      continue;
    }

    // 检测顶级 verify section
    if (indent === 0 && trimmed === 'verify:') {
      inVerifySection = true;
      inTaskCompletedSection = false;
      continue;
    }

    // 解析顶级 verify 列表项
    if (inVerifySection && trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      if (!value.startsWith('name:') && !value.includes(':')) {
        topLevelVerify.push(value);
      }
      continue;
    }

    // 解析 task_completed section
    if (inTaskCompletedSection) {
      if (trimmed === 'verify:') {
        inTaskCompletedVerify = true;
        continue;
      }

      if (trimmed.startsWith('block_on_failure:')) {
        const val = trimmed.split(':')[1].trim().toLowerCase();
        blockOnFailure = val === 'true';
        continue;
      }

      if (inTaskCompletedVerify && trimmed.startsWith('- ')) {
        const value = trimmed.slice(2).trim();
        if (!value.startsWith('name:') && !value.includes(':')) {
          taskCompletedVerify.push(value);
        }
        continue;
      }
    }
  }

  // 设置顶级 verify
  if (topLevelVerify.length > 0) {
    config.verify = topLevelVerify;
  }

  // 设置 task_completed 配置
  if (taskCompletedVerify.length > 0 || inTaskCompletedSection) {
    config.task_completed = {
      verify: taskCompletedVerify.length > 0 ? taskCompletedVerify : undefined,
      block_on_failure: blockOnFailure
    };
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
 * 优先使用 task_completed.verify，否则使用顶级 verify
 */
function getVerifyCommands(config: QualityGatesConfig): string[] {
  const taskCompletedVerify = config.task_completed?.verify;
  if (taskCompletedVerify && taskCompletedVerify.length > 0) {
    return taskCompletedVerify.map(cmd => {
      if (typeof cmd === 'string') return cmd;
      return cmd.command;
    });
  }

  if (config.verify && config.verify.length > 0) {
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
 * 获取 block_on_failure 配置
 */
function getBlockOnFailure(config: QualityGatesConfig): boolean {
  return config.task_completed?.block_on_failure ?? true;
}

/**
 * 执行验证命令 (复用 ralph-loop.ts 逻辑)
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

/**
 * 记录错误到 ERROR_LOG.md
 */
function recordErrorToLog(
  repoRoot: string,
  taskId: string,
  taskSubject: string,
  failures: FailureRecord[]
): void {
  // 尝试找到当前需求目录
  const reqId = detectReqId(repoRoot);
  if (!reqId) return;

  const reqDir = path.join(repoRoot, 'devflow', 'requirements', reqId);
  const errorLogPath = path.join(reqDir, 'ERROR_LOG.md');

  const timestamp = new Date().toISOString();
  const errorNumber = getNextErrorNumber(errorLogPath);

  const entry = `
## [${timestamp}] E${errorNumber.toString().padStart(3, '0')}: Task ${taskId} Verification Failed

**Phase**: flow-dev / ${taskId}
**Task**: ${taskSubject}
**Error Type**: Verification Failure
**Error Message**:
\`\`\`
${formatFailures(failures)}
\`\`\`
**Root Cause**: [Pending analysis]
**Resolution**: [Pending fix]
**Prevention**: [Optional]

---
`;

  try {
    if (fs.existsSync(errorLogPath)) {
      fs.appendFileSync(errorLogPath, entry, 'utf-8');
    } else {
      const header = `# ERROR_LOG.md

> 执行错误日志 - 记录 flow-dev 阶段的所有错误

---
`;
      fs.writeFileSync(errorLogPath, header + entry, 'utf-8');
    }
  } catch {
    // 忽略写入错误
  }
}

/**
 * 获取下一个错误编号
 */
function getNextErrorNumber(errorLogPath: string): number {
  if (!fs.existsSync(errorLogPath)) return 1;

  try {
    const content = fs.readFileSync(errorLogPath, 'utf-8');
    const matches = content.match(/E(\d{3}):/g);
    if (!matches || matches.length === 0) return 1;

    const numbers = matches.map(m => parseInt(m.slice(1, 4), 10));
    return Math.max(...numbers) + 1;
  } catch {
    return 1;
  }
}

/**
 * 检测当前需求 ID
 */
function detectReqId(repoRoot: string): string | null {
  // 1. 从环境变量获取
  const envReqId = process.env.CURRENT_REQ_ID;
  if (envReqId) return envReqId;

  // 2. 从 .current-task 文件获取
  const currentTaskPath = path.join(repoRoot, '.current-task');
  if (fs.existsSync(currentTaskPath)) {
    try {
      const content = fs.readFileSync(currentTaskPath, 'utf-8').trim();
      const match = content.match(/REQ-\d+/);
      if (match) return match[0];
    } catch {
      // 忽略
    }
  }

  // 3. 从 Git 分支名获取
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 5000
    }).trim();
    const match = branch.match(/REQ-\d+/);
    if (match) return match[0];
  } catch {
    // 忽略
  }

  return null;
}

/**
 * 调用 common.sh 中的 mark_teammate_task_complete 函数
 */
function markTeammateTaskComplete(
  repoRoot: string,
  reqId: string,
  teammateId: string,
  taskId: string
): boolean {
  const commonShPath = path.join(repoRoot, SCRIPTS_DIR, 'common.sh');
  if (!fs.existsSync(commonShPath)) {
    return false;
  }

  try {
    const script = `
      source "${commonShPath}"
      mark_teammate_task_complete "${repoRoot}" "${reqId}" "${teammateId}" "${taskId}"
    `;
    execSync(`bash -c '${script}'`, {
      cwd: repoRoot,
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查是否触发阶段转换
 */
function checkPhaseTransition(
  repoRoot: string,
  reqId: string
): string[] {
  const nextActions: string[] = [];

  // 读取 orchestration_status.json
  const statusPath = path.join(repoRoot, 'devflow', 'requirements', reqId, 'orchestration_status.json');
  if (!fs.existsSync(statusPath)) {
    return nextActions;
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    const status = JSON.parse(content);

    // 检查是否所有任务都已完成
    const team = status.team;
    if (!team) return nextActions;

    const allTasksCompleted = team.teammates.every(
      (t: { completedTasks?: string[]; currentTask?: string | null }) =>
        !t.currentTask && (t.completedTasks?.length ?? 0) > 0
    );

    if (allTasksCompleted) {
      nextActions.push('All tasks completed. Consider running /flow:quality');
    }

    // 检查是否有空闲的 teammate 可以分配新任务
    const idleTeammates = team.teammates.filter(
      (t: { status: string }) => t.status === 'idle'
    );
    if (idleTeammates.length > 0) {
      nextActions.push(`${idleTeammates.length} teammate(s) idle. Check for unassigned tasks.`);
    }
  } catch {
    // 忽略解析错误
  }

  return nextActions;
}

// =============================================================================
// 主函数
// =============================================================================

function main(): void {
  let inputData: TaskCompletedInput;

  try {
    const stdin = fs.readFileSync(0, 'utf-8');
    inputData = JSON.parse(stdin);
  } catch {
    // 无法解析输入，接受完成
    const output: TaskCompletedOutput = {
      decision: 'accept',
      reason: 'Unable to parse input. Accepting task completion.'
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  const hookEvent = inputData.hook_event_name || '';

  // 只处理 TaskCompleted 事件
  if (hookEvent !== 'TaskCompleted') {
    const output: TaskCompletedOutput = {
      decision: 'accept',
      reason: `Ignoring non-TaskCompleted event: ${hookEvent}`
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  const cwd = inputData.cwd || process.cwd();
  const taskId = inputData.task_id;
  const taskSubject = inputData.task_subject;
  const completedBy = inputData.completed_by;

  // 查找仓库根目录
  const repoRoot = findRepoRoot(cwd);
  if (!repoRoot) {
    const output: TaskCompletedOutput = {
      decision: 'accept',
      reason: 'Not in a git repository. Accepting task completion.'
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 加载配置
  const config = loadConfig(repoRoot);
  const verifyCommands = getVerifyCommands(config);
  const blockOnFailure = getBlockOnFailure(config);

  // 执行验证命令
  const { passed, failures } = runVerifyCommands(repoRoot, verifyCommands);

  // 检测需求 ID
  const reqId = detectReqId(repoRoot);

  if (passed) {
    // 所有验证通过
    const nextActions: string[] = [];

    // 更新 Team 状态
    if (reqId && completedBy) {
      const updated = markTeammateTaskComplete(repoRoot, reqId, completedBy, taskId);
      if (updated) {
        nextActions.push(`Updated team state for ${completedBy}`);
      }

      // 检查阶段转换
      const phaseActions = checkPhaseTransition(repoRoot, reqId);
      nextActions.push(...phaseActions);
    }

    const output: TaskCompletedOutput = {
      decision: 'accept',
      reason: `Task ${taskId} completed successfully. All verification passed.`,
      next_actions: nextActions.length > 0 ? nextActions : undefined
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 验证失败
  const failureDetails = formatFailures(failures);

  // 记录错误到 ERROR_LOG.md
  if (reqId) {
    recordErrorToLog(repoRoot, taskId, taskSubject, failures);
  }

  if (blockOnFailure) {
    // 阻止任务完成
    const output: TaskCompletedOutput = {
      decision: 'reject',
      reason: `Task ${taskId} verification failed:\n\n${failureDetails}\n\nPlease fix the issues before marking the task as complete.`,
      next_actions: ['Fix verification errors', 'Re-run task completion']
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 不阻止，但记录警告
  const nextActions: string[] = ['Warning: Verification failed but block_on_failure is false'];

  // 更新 Team 状态
  if (reqId && completedBy) {
    const updated = markTeammateTaskComplete(repoRoot, reqId, completedBy, taskId);
    if (updated) {
      nextActions.push(`Updated team state for ${completedBy}`);
    }

    // 检查阶段转换
    const phaseActions = checkPhaseTransition(repoRoot, reqId);
    nextActions.push(...phaseActions);
  }

  const output: TaskCompletedOutput = {
    decision: 'accept',
    reason: `Task ${taskId} accepted with warnings. Verification failed:\n\n${failureDetails}`,
    next_actions: nextActions
  };
  console.log(JSON.stringify(output, null, 0));
  process.exit(0);
}

main();
