#!/usr/bin/env npx ts-node
/**
 * [INPUT]: 依赖 quality-gates.yml 的 verify 命令配置, orchestration_status.json 的 Team 状态
 * [OUTPUT]: 对外提供 SubagentStop 钩子，拦截子 Agent 停止并执行程序化验证
 * [POS]: hooks/ 的 Ralph Loop 控制器，支持单 Agent 和多 Teammate 模式
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
 * - 状态持久化到 .ralph-state.json (单 Agent) 或 orchestration_status.json (Team)
 *
 * v4.7 Team 模式支持：
 * - Teammate 级别验证：每个 teammate 停止时验证自己的改动
 * - 全局验证：最后一个 teammate 停止时执行全局验证
 * - 分布式迭代控制：每个 teammate 独立计数 + 全局计数
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

// Team 模式类型
interface TeammateRalphState {
  iteration: number;
  lastVerifyResult: 'passed' | 'failed' | 'skipped';
  lastVerifyAt?: string;
  lastFailures?: FailureRecord[];
}

interface RalphLoopTeamState {
  enabled: boolean;
  teammates: Record<string, TeammateRalphState>;
  globalIteration: number;
  maxIterations: number;
  startedAt: string;
}

interface TeamState {
  mode: 'sequential' | 'parallel';
  lead: string;
  teammates: Array<{
    id: string;
    role: string;
    status: string;
    currentTask: string | null;
    completedTasks: string[];
    lastActiveAt: string;
  }>;
  taskAssignments: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface OrchestrationStatus {
  reqId: string;
  status: string;
  phase: string;
  team?: TeamState;
  ralphLoop?: RalphLoopTeamState;
  updatedAt: string;
}

interface TeamModeConfig {
  enabled?: boolean;
  scope?: 'teammate' | 'global';
  teammate_verify?: Record<string, string[]>;
  global_verify?: string[];
  max_iterations_per_teammate?: number;
  max_global_iterations?: number;
}

interface QualityGatesConfig {
  verify?: (string | VerifyCommand)[];
  ralph_loop?: {
    max_iterations?: number;
    timeout_minutes?: number;
    team_mode?: TeamModeConfig;
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
  // Team 模式扩展字段
  teammate_id?: string;
  teammate_role?: string;
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
const DEFAULT_MAX_ITERATIONS_PER_TEAMMATE = 3;
const DEFAULT_MAX_GLOBAL_ITERATIONS = 10;
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
  let inTeamModeSection = false;
  let inTeammateVerifySection = false;
  let inGlobalVerifySection = false;
  let currentTeammateRole = '';
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
      inTeamModeSection = false;
      inTeammateVerifySection = false;
      inGlobalVerifySection = false;
      continue;
    }

    // 检测 verify 子 section (顶级)
    if (trimmed === 'verify:' && !inRalphLoopSection) {
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
      } else if (trimmed === 'team_mode:') {
        inTeamModeSection = true;
        config.ralph_loop = config.ralph_loop || {};
        config.ralph_loop.team_mode = {};
      }
    }

    // 解析 team_mode 配置
    if (inTeamModeSection) {
      if (trimmed.startsWith('enabled:')) {
        const val = trimmed.split(':')[1].trim();
        config.ralph_loop!.team_mode!.enabled = val === 'true';
      } else if (trimmed.startsWith('scope:')) {
        const val = trimmed.split(':')[1].trim() as 'teammate' | 'global';
        config.ralph_loop!.team_mode!.scope = val;
      } else if (trimmed.startsWith('max_iterations_per_teammate:')) {
        const val = parseInt(trimmed.split(':')[1].trim(), 10);
        if (!isNaN(val)) {
          config.ralph_loop!.team_mode!.max_iterations_per_teammate = val;
        }
      } else if (trimmed.startsWith('max_global_iterations:')) {
        const val = parseInt(trimmed.split(':')[1].trim(), 10);
        if (!isNaN(val)) {
          config.ralph_loop!.team_mode!.max_global_iterations = val;
        }
      } else if (trimmed === 'teammate_verify:') {
        inTeammateVerifySection = true;
        inGlobalVerifySection = false;
        config.ralph_loop!.team_mode!.teammate_verify = {};
      } else if (trimmed === 'global_verify:') {
        inGlobalVerifySection = true;
        inTeammateVerifySection = false;
        config.ralph_loop!.team_mode!.global_verify = [];
      }
    }

    // 解析 teammate_verify 配置
    if (inTeammateVerifySection && !inGlobalVerifySection) {
      // 检测 teammate role (e.g., "dev-frontend:")
      if (trimmed.endsWith(':') && !trimmed.startsWith('-')) {
        currentTeammateRole = trimmed.slice(0, -1);
        config.ralph_loop!.team_mode!.teammate_verify![currentTeammateRole] = [];
      } else if (trimmed.startsWith('- ') && currentTeammateRole) {
        const cmd = trimmed.slice(2).trim();
        config.ralph_loop!.team_mode!.teammate_verify![currentTeammateRole].push(cmd);
      }
    }

    // 解析 global_verify 配置
    if (inGlobalVerifySection && trimmed.startsWith('- ')) {
      const cmd = trimmed.slice(2).trim();
      config.ralph_loop!.team_mode!.global_verify!.push(cmd);
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
// Team 模式工具函数
// =============================================================================

/**
 * 查找当前需求的 orchestration_status.json
 */
function findOrchestrationStatus(repoRoot: string): string | null {
  const devflowDir = path.join(repoRoot, 'devflow', 'requirements');
  if (!fs.existsSync(devflowDir)) return null;

  // 查找最近修改的需求目录
  const reqDirs = fs.readdirSync(devflowDir)
    .filter(d => d.startsWith('REQ-') || d.startsWith('BUG-'))
    .map(d => ({
      name: d,
      path: path.join(devflowDir, d),
      mtime: fs.statSync(path.join(devflowDir, d)).mtime.getTime()
    }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const reqDir of reqDirs) {
    const statusFile = path.join(reqDir.path, 'orchestration_status.json');
    if (fs.existsSync(statusFile)) {
      return statusFile;
    }
  }

  return null;
}

/**
 * 加载 orchestration_status.json
 */
function loadOrchestrationStatus(statusPath: string): OrchestrationStatus | null {
  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * 保存 orchestration_status.json
 */
function saveOrchestrationStatus(statusPath: string, status: OrchestrationStatus): void {
  try {
    status.updatedAt = new Date().toISOString();
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), 'utf-8');
  } catch {
    // 忽略写入错误
  }
}

/**
 * 检查是否启用 Team 模式
 */
function isTeamModeEnabled(status: OrchestrationStatus | null, config: QualityGatesConfig): boolean {
  // 检查 orchestration_status.json 中是否有 team 状态
  if (!status?.team) return false;

  // 检查配置中是否启用 team_mode
  return config.ralph_loop?.team_mode?.enabled ?? false;
}

/**
 * 获取 Teammate 特定的验证命令
 */
function getTeammateVerifyCommands(
  config: QualityGatesConfig,
  teammateRole: string
): string[] {
  const teamModeConfig = config.ralph_loop?.team_mode;

  // 优先使用 teammate 特定命令
  if (teamModeConfig?.teammate_verify?.[teammateRole]) {
    return teamModeConfig.teammate_verify[teammateRole];
  }

  // 回退到默认验证命令
  return getVerifyCommands(config);
}

/**
 * 获取全局验证命令
 */
function getGlobalVerifyCommands(config: QualityGatesConfig): string[] {
  const teamModeConfig = config.ralph_loop?.team_mode;

  if (teamModeConfig?.global_verify && teamModeConfig.global_verify.length > 0) {
    return teamModeConfig.global_verify;
  }

  // 回退到默认验证命令
  return getVerifyCommands(config);
}

/**
 * 检查是否是最后一个活跃的 Teammate
 */
function isLastActiveTeammate(
  status: OrchestrationStatus,
  currentTeammateId: string
): boolean {
  if (!status.team?.teammates) return true;

  const activeTeammates = status.team.teammates.filter(
    t => t.status === 'working' && t.id !== currentTeammateId
  );

  return activeTeammates.length === 0;
}

/**
 * 初始化 Teammate 的 Ralph 状态
 */
function initTeammateRalphState(): TeammateRalphState {
  return {
    iteration: 0,
    lastVerifyResult: 'skipped'
  };
}

/**
 * 更新 Teammate 的 Ralph 状态
 */
function updateTeammateRalphState(
  status: OrchestrationStatus,
  teammateId: string,
  verifyResult: 'passed' | 'failed',
  failures?: FailureRecord[]
): void {
  if (!status.ralphLoop) {
    status.ralphLoop = {
      enabled: true,
      teammates: {},
      globalIteration: 0,
      maxIterations: DEFAULT_MAX_GLOBAL_ITERATIONS,
      startedAt: new Date().toISOString()
    };
  }

  if (!status.ralphLoop.teammates[teammateId]) {
    status.ralphLoop.teammates[teammateId] = initTeammateRalphState();
  }

  const teammateState = status.ralphLoop.teammates[teammateId];
  teammateState.iteration += 1;
  teammateState.lastVerifyResult = verifyResult;
  teammateState.lastVerifyAt = new Date().toISOString();

  if (failures && failures.length > 0) {
    teammateState.lastFailures = failures;
  } else {
    delete teammateState.lastFailures;
  }

  // 更新全局迭代计数
  status.ralphLoop.globalIteration += 1;
}

/**
 * 获取 Teammate 的迭代次数
 */
function getTeammateIteration(status: OrchestrationStatus, teammateId: string): number {
  return status.ralphLoop?.teammates?.[teammateId]?.iteration ?? 0;
}

/**
 * 获取全局迭代次数
 */
function getGlobalIteration(status: OrchestrationStatus): number {
  return status.ralphLoop?.globalIteration ?? 0;
}

/**
 * 获取 Teammate 最大迭代次数
 */
function getMaxIterationsPerTeammate(config: QualityGatesConfig): number {
  return config.ralph_loop?.team_mode?.max_iterations_per_teammate
    ?? DEFAULT_MAX_ITERATIONS_PER_TEAMMATE;
}

/**
 * 获取全局最大迭代次数
 */
function getMaxGlobalIterations(config: QualityGatesConfig): number {
  return config.ralph_loop?.team_mode?.max_global_iterations
    ?? DEFAULT_MAX_GLOBAL_ITERATIONS;
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
  const teammateId = inputData.teammate_id;
  const teammateRole = inputData.teammate_role || 'default';

  // 查找仓库根目录
  const repoRoot = findRepoRoot(cwd);
  if (!repoRoot) {
    process.exit(0);
  }

  // 加载配置
  const config = loadConfig(repoRoot);

  // 查找 orchestration_status.json
  const statusPath = findOrchestrationStatus(repoRoot);
  const orchestrationStatus = statusPath ? loadOrchestrationStatus(statusPath) : null;

  // 检查是否启用 Team 模式
  if (teammateId && isTeamModeEnabled(orchestrationStatus, config)) {
    handleTeamMode(
      repoRoot,
      config,
      statusPath!,
      orchestrationStatus!,
      teammateId,
      teammateRole
    );
  } else {
    handleSingleAgentMode(repoRoot, config, agentId);
  }
}

/**
 * 处理 Team 模式的 SubagentStop
 */
function handleTeamMode(
  repoRoot: string,
  config: QualityGatesConfig,
  statusPath: string,
  status: OrchestrationStatus,
  teammateId: string,
  teammateRole: string
): void {
  const maxIterationsPerTeammate = getMaxIterationsPerTeammate(config);
  const maxGlobalIterations = getMaxGlobalIterations(config);
  const timeoutMinutes = getTimeoutMinutes(config);

  // 检查超时
  if (status.ralphLoop?.startedAt) {
    const startedAt = new Date(status.ralphLoop.startedAt);
    const now = new Date();
    const elapsedMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);
    if (elapsedMinutes >= timeoutMinutes) {
      const output: HookOutput = {
        decision: 'allow',
        reason: `Team mode timeout (${timeoutMinutes} minutes) reached. Allowing stop.`
      };
      console.log(JSON.stringify(output, null, 0));
      process.exit(0);
    }
  }

  // 检查 Teammate 迭代次数
  const teammateIteration = getTeammateIteration(status, teammateId);
  if (teammateIteration >= maxIterationsPerTeammate) {
    const output: HookOutput = {
      decision: 'allow',
      reason: `Teammate ${teammateId} max iterations (${maxIterationsPerTeammate}) reached. Allowing stop.`
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 检查全局迭代次数
  const globalIteration = getGlobalIteration(status);
  if (globalIteration >= maxGlobalIterations) {
    const output: HookOutput = {
      decision: 'allow',
      reason: `Global max iterations (${maxGlobalIterations}) reached. Allowing stop.`
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 获取验证命令
  const verifyCommands = getTeammateVerifyCommands(config, teammateRole);

  // 执行 Teammate 级别验证
  const { passed: teammatePassed, failures: teammateFailures } = runVerifyCommands(
    repoRoot,
    verifyCommands
  );

  // 更新 Teammate Ralph 状态
  updateTeammateRalphState(
    status,
    teammateId,
    teammatePassed ? 'passed' : 'failed',
    teammateFailures
  );

  if (!teammatePassed) {
    // Teammate 验证失败
    saveOrchestrationStatus(statusPath, status);

    const failureDetails = formatFailures(teammateFailures);
    const currentIteration = getTeammateIteration(status, teammateId);
    const output: HookOutput = {
      decision: 'block',
      reason: `Teammate ${teammateId} iteration ${currentIteration}/${maxIterationsPerTeammate}. Verification failed:\n\n${failureDetails}\n\nPlease fix the issues and try again.`,
      systemMessage: `Ralph Loop (Team Mode) - Teammate ${teammateId} iteration ${currentIteration}/${maxIterationsPerTeammate}`
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // Teammate 验证通过，检查是否是最后一个活跃的 Teammate
  const isLast = isLastActiveTeammate(status, teammateId);

  if (isLast) {
    // 执行全局验证
    const globalVerifyCommands = getGlobalVerifyCommands(config);
    const { passed: globalPassed, failures: globalFailures } = runVerifyCommands(
      repoRoot,
      globalVerifyCommands
    );

    if (!globalPassed) {
      // 全局验证失败
      saveOrchestrationStatus(statusPath, status);

      const failureDetails = formatFailures(globalFailures);
      const output: HookOutput = {
        decision: 'block',
        reason: `Global verification failed (last teammate ${teammateId}):\n\n${failureDetails}\n\nPlease fix the issues and try again.`,
        systemMessage: `Ralph Loop (Team Mode) - Global verification failed`
      };
      console.log(JSON.stringify(output, null, 0));
      process.exit(0);
    }

    // 全局验证通过
    saveOrchestrationStatus(statusPath, status);
    const output: HookOutput = {
      decision: 'allow',
      reason: `All verifications passed. Teammate ${teammateId} (last active) completed successfully.`
    };
    console.log(JSON.stringify(output, null, 0));
    process.exit(0);
  }

  // 不是最后一个 Teammate，允许停止
  saveOrchestrationStatus(statusPath, status);
  const output: HookOutput = {
    decision: 'allow',
    reason: `Teammate ${teammateId} verification passed. Other teammates still active.`
  };
  console.log(JSON.stringify(output, null, 0));
  process.exit(0);
}

/**
 * 处理单 Agent 模式的 SubagentStop (原有逻辑)
 */
function handleSingleAgentMode(
  repoRoot: string,
  config: QualityGatesConfig,
  agentId: string
): void {
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
