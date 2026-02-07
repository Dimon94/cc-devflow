/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 Claude Team 集成的 TypeScript 类型定义
 * [POS]: hooks/types/ 的 Team 状态类型，被 teammate-idle-hook.ts 和 task-completed-hook.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// =============================================================================
// Teammate 状态类型
// =============================================================================

export type TeammateStatus = 'idle' | 'working' | 'blocked' | 'completed' | 'error';

export interface TeammateState {
  /** Teammate 唯一标识 (e.g., "dev-analyst", "spec-analyst") */
  id: string;

  /** Teammate 角色 (e.g., "developer", "analyst", "reviewer") */
  role: string;

  /** 当前状态 */
  status: TeammateStatus;

  /** 当前正在执行的任务 ID (e.g., "T001") */
  currentTask: string | null;

  /** 已完成的任务 ID 列表 */
  completedTasks: string[];

  /** 最后活跃时间 (ISO 8601) */
  lastActiveAt: string;

  /** 错误信息 (仅当 status === 'error') */
  errorMessage?: string;
}

// =============================================================================
// Team 状态类型
// =============================================================================

export type TeamMode = 'sequential' | 'parallel';

export interface TeamState {
  /** Team 执行模式 */
  mode: TeamMode;

  /** Team Lead 标识 */
  lead: string;

  /** 所有 Teammates 状态 */
  teammates: TeammateState[];

  /** 任务分配映射 (taskId -> teammateId) */
  taskAssignments: Record<string, string>;

  /** Team 创建时间 */
  createdAt: string;

  /** Team 最后更新时间 */
  updatedAt: string;
}

// =============================================================================
// Ralph Loop Team 模式类型
// =============================================================================

export interface TeammateRalphState {
  /** 当前迭代次数 */
  iteration: number;

  /** 最后验证结果 */
  lastVerifyResult: 'passed' | 'failed' | 'skipped';

  /** 最后验证时间 */
  lastVerifyAt?: string;

  /** 最后失败记录 */
  lastFailures?: FailureRecord[];
}

export interface FailureRecord {
  command: string;
  output: string;
  timestamp: string;
}

export interface RalphLoopTeamState {
  /** 是否启用 Ralph Loop */
  enabled: boolean;

  /** 每个 Teammate 的 Ralph 状态 */
  teammates: Record<string, TeammateRalphState>;

  /** 全局迭代次数 */
  globalIteration: number;

  /** 最大迭代次数 */
  maxIterations: number;

  /** 开始时间 */
  startedAt: string;
}

// =============================================================================
// 扩展的 orchestration_status.json 类型
// =============================================================================

export interface OrchestrationStatus {
  /** 需求 ID */
  reqId: string;

  /** 需求标题 */
  title?: string;

  /** 当前状态 */
  status: string;

  /** 当前阶段 */
  phase: string;

  /** 已完成的步骤 */
  completedSteps?: string[];

  /** Git 分支名 */
  branch?: string;

  /** 创建时间 */
  createdAt: string;

  /** 更新时间 */
  updatedAt: string;

  // =========================================================================
  // v4.7 新增: Team 状态
  // =========================================================================

  /** Team 状态 (仅在 Team 模式下存在) */
  team?: TeamState;

  /** Ralph Loop 状态 (支持多 Teammate) */
  ralphLoop?: RalphLoopTeamState;

  // =========================================================================
  // 归档相关字段
  // =========================================================================

  /** 归档原因 */
  archivedReason?: string;

  /** 归档时间 */
  archivedAt?: string;

  /** 归档位置 */
  archiveLocation?: string;

  /** 归档前状态 */
  statusBeforeArchive?: string;

  /** Delta 数量 */
  deltaCount?: number;
}

// =============================================================================
// Hook 输入/输出类型
// =============================================================================

export interface TeammateIdleInput {
  hook_event_name: 'TeammateIdle';
  teammate_id: string;
  teammate_role: string;
  last_task_id?: string;
  idle_reason: 'task_complete' | 'waiting_dependency' | 'no_tasks' | 'error';
  cwd: string;
  session_id: string;
}

export interface TeammateIdleOutput {
  action: 'assign_task' | 'wait' | 'shutdown';
  task_id?: string;
  message?: string;
}

export interface TaskCompletedInput {
  hook_event_name: 'TaskCompleted';
  task_id: string;
  task_subject: string;
  completed_by: string;
  completion_time: string;
  cwd: string;
  session_id: string;
}

export interface TaskCompletedOutput {
  decision: 'accept' | 'reject';
  reason: string;
  next_actions?: string[];
}

// =============================================================================
// quality-gates.yml Team 模式配置类型
// =============================================================================

export interface TeammateIdleConfig {
  idle_checks?: VerifyCommand[];
  assignment_strategy?: 'priority_first' | 'round_robin' | 'skill_match';
  idle_timeout?: number;
}

export interface TaskCompletedConfig {
  verify?: VerifyCommand[];
  block_on_failure?: boolean;
  max_retries?: number;
}

export interface RalphLoopTeamConfig {
  enabled?: boolean;
  scope?: 'teammate' | 'global';
  teammate_verify?: Record<string, string[]>;
  global_verify?: string[];
  max_iterations_per_teammate?: number;
  max_global_iterations?: number;
}

export interface VerifyCommand {
  name?: string;
  command: string;
  required?: boolean;
}

export interface QualityGatesTeamConfig {
  teammate_idle?: TeammateIdleConfig;
  task_completed?: TaskCompletedConfig;
  ralph_loop?: {
    team_mode?: RalphLoopTeamConfig;
    max_iterations?: number;
    timeout_minutes?: number;
  };
}
