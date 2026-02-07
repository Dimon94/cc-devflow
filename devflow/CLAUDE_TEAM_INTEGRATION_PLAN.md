# CC-DevFlow × Claude Team 集成方案

> **版本**: v1.2.0
> **日期**: 2026-02-07
> **状态**: Phase 4 完成 ✅
> **调研团队**: spec-analyst, dev-analyst, infra-analyst

---

## 实施进度

| Phase | 状态 | 完成日期 |
|-------|------|----------|
| Phase 1: 基础集成 | ✅ 完成 | 2026-02-07 |
| Phase 2: flow-spec Team 模式 | ✅ 完成 | 2026-02-07 |
| Phase 3: flow-dev Team 模式 | ✅ 完成 | 2026-02-07 |
| Phase 4: 优化和文档 | ✅ 完成 | 2026-02-07 |

### Phase 1 完成内容

- [x] 扩展 orchestration_status.json - 新增 team, ralphLoop 字段
- [x] 实现 TeammateIdle Hook - `.claude/hooks/teammate-idle-hook.ts`
- [x] 实现 TaskCompleted Hook - `.claude/hooks/task-completed-hook.ts`
- [x] 创建 Team 类型定义 - `.claude/hooks/types/team-types.d.ts`
- [x] 更新 quality-gates.yml - Team 模式配置
- [x] 扩展 common.sh - 15+ Team 管理函数

### Phase 2 完成内容

- [x] 实现 Mode Detection - `scripts/team-init.sh detect`
- [x] 创建 spec-design-team 配置 - `team-config.json`
- [x] 实现 Teammate 通信协议 - `scripts/team-communication.sh`
- [x] 创建决策记录模板 - `DESIGN_DECISIONS_TEMPLATE.md`
- [x] 更新 SKILL.md - SendMessage 协商协议
- [x] 集成测试通过

### Phase 3 完成内容

- [x] 实现任务依赖解析器 - `.claude/scripts/parse-task-dependencies.js`
- [x] 实现文件冲突检测 - `.claude/scripts/detect-file-conflicts.sh`
- [x] 扩展 /flow:dev 命令 - 添加 `--team` 和 `--agents N` 参数
- [x] 适配 Ralph Loop - 支持多 Teammate 验证 (teammate_verify + global_verify)
- [x] 更新 hooks/CLAUDE.md - Team 模式文档

### Phase 4 完成内容

- [x] 更新 .claude/CLAUDE.md - v4.7 Team 集成完整文档
- [x] 创建 Team 模式使用指南 - `.claude/docs/guides/TEAM_MODE_GUIDE.md`
- [x] 更新 Integration Plan - 完成状态标记
- [x] 状态恢复机制 - `.claude/scripts/team-state-recovery.sh` (断点续传)
- [x] 监控和告警 - teammate-idle-hook.ts 超时检测 + common.sh 监控函数

---

## 执行摘要

本方案基于 Claude Team 官方文档和 CC-DevFlow 项目特点，设计了 **3 个集成场景**，预期可将需求开发时间缩短 **40-60%**。

### 核心发现

| 场景 | 适用阶段 | 并行度 | 时间节省 | 优先级 |
|------|---------|--------|----------|--------|
| **混合规格设计** | flow-spec | 3-4 Agent | -35% | P1 |
| **User Story 并行开发** | flow-dev | 2-4 Agent | -60% | P1 |
| **Hook 质量门禁** | 全流程 | N/A | 质量保证 | P1 |

### 关键决策

1. **flow-spec**: 采用**混合架构** - 简单模式用 Subagent，Full Mode 用 Team
2. **flow-dev**: 采用 **User Story Parallel** 策略 + Git Worktree 隔离
3. **状态管理**: 扩展 `orchestration_status.json` 作为统一状态源

---

## 第一部分：flow-spec Team 集成

### 1.1 现状分析

当前 flow-spec 使用 Subagent 并行执行 Tech + UI：

```
PRD (串行) → Tech + UI (Subagent 并行) → Epic (串行)
```

**痛点**：
- tech-architect 和 ui-designer 无法实时协商
- 可能产生决策冲突（如 API 格式、字段命名）
- planner 只能看到最终文档，无法参与设计讨论

### 1.2 推荐方案：混合架构

```typescript
// Mode Detection 逻辑
if (args.includes('--skip-tech') || args.includes('--skip-ui')) {
  // 简单模式：使用现有 Subagent
  useSubagentMode();
} else {
  // Full Mode：使用 Claude Team
  useTeamMode();
}
```

### 1.3 Team 架构设计

```
Team: spec-design-team
├── Lead: main-agent (协调和仲裁)
├── Teammate 1: prd-writer (PRD 生成)
├── Teammate 2: tech-architect (技术设计)
├── Teammate 3: ui-designer (UI 原型)
└── Teammate 4: planner (Epic 规划)
```

### 1.4 通信协议

**需要 Teammate 讨论的决策点**：

| 决策点 | 参与者 | 协商方式 |
|--------|--------|----------|
| API 响应格式 | tech + ui | SendMessage 直接讨论 |
| 数据字段命名 | tech + ui + planner | 三方协商 |
| 认证策略 | tech + ui | 技术方案对齐 |
| 状态管理方案 | tech + ui | 前后端一致性 |
| 组件粒度 | ui + planner | 任务拆分依据 |

### 1.5 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: PRD Generation (串行)                              │
│  └── prd-writer 生成 PRD.md                                  │
├─────────────────────────────────────────────────────────────┤
│  Stage 2: Design Parallel (Team 并行)                        │
│  ├── tech-architect 生成 TECH_DESIGN.md                      │
│  ├── ui-designer 生成 UI_PROTOTYPE.html                      │
│  └── 两者通过 SendMessage 协商共享决策                        │
├─────────────────────────────────────────────────────────────┤
│  Stage 3: Epic Planning (串行)                               │
│  └── planner 基于 PRD + Tech + UI 生成 EPIC.md + TASKS.md    │
└─────────────────────────────────────────────────────────────┘
```

### 1.6 预期收益

| 指标 | Subagent 模式 | Team 模式 | 改进 |
|------|--------------|-----------|------|
| 决策冲突率 | ~15% | ~5% | -67% |
| 返工率 | ~20% | ~8% | -60% |
| 任务拆分准确度 | 75% | 90% | +20% |
| 设计阶段时间 | 8-12 min | 5-8 min | -35% |

---

## 第二部分：flow-dev Team 集成

### 2.1 现状分析

当前 flow-dev 使用 Ralph Loop 串行执行任务：

```
For each task in TASKS.md:
  1. Protocol 2: 读取任务 DoD
  2. 执行任务 (TDD)
  3. 验证完成
  4. 标记 [x]
```

**痛点**：
- 串行执行，无法利用多 Agent 并行
- 3 个 User Story 需要 30 分钟

### 2.2 推荐方案：User Story Parallel

**策略选择理由**：
1. TASKS_TEMPLATE 已设计为 User Story 独立可测试
2. 与 Git Worktree 天然配合
3. 文件冲突风险最低

### 2.3 执行模型

```
                    ┌─────────────────┐
                    │  Phase 1: Setup │
                    │   (Team Lead)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │Phase 2: Foundation│
                    │   (Team Lead)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│  Agent 1: US1   │ │  Agent 2: US2   │ │  Agent 3: US3   │
│  (Worktree 1)   │ │  (Worktree 2)   │ │  (Worktree 3)   │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Phase N: Polish │
                    │   (Team Lead)   │
                    └─────────────────┘
```

### 2.4 Git Worktree 布局

```
~/projects/
├── cc-devflow/                    # 主仓库 (main) - Team Lead
├── cc-devflow-REQ-123-US1/        # US1 Worktree - Agent 1
├── cc-devflow-REQ-123-US2/        # US2 Worktree - Agent 2
└── cc-devflow-REQ-123-US3/        # US3 Worktree - Agent 3
```

### 2.5 任务依赖解析

```typescript
interface Task {
  id: string;           // T001, T002...
  parallel: boolean;    // [P] 标记
  userStory: string;    // US1, US2...
  phase: number;        // 1, 2, 3...
  filePath: string;     // 操作的文件路径
}

function canRunInParallel(task1: Task, task2: Task): boolean {
  // 规则 1: 都有 [P] 标记
  // 规则 2: 不同文件
  // 规则 3: 同一 Phase
  // 规则 4: 无显式依赖
}
```

### 2.6 文件冲突预防

```
┌─────────────────────────────────────────────────────────┐
│                  冲突预防三层防护                         │
├─────────────────────────────────────────────────────────┤
│  Layer 1: 任务设计时                                     │
│  ├── TASKS_TEMPLATE 强制 [P] 标记规则                    │
│  └── 同文件任务禁止 [P]                                  │
│                                                         │
│  Layer 2: 任务分配时                                     │
│  ├── 文件路径冲突检测                                    │
│  └── 共享文件分配给单一 Agent                            │
│                                                         │
│  Layer 3: 执行时                                         │
│  ├── Git Worktree 物理隔离                               │
│  └── 合并前冲突检测                                      │
└─────────────────────────────────────────────────────────┘
```

### 2.7 命令扩展

```bash
# 新增 Team 模式
/flow:dev "REQ-123" --team --agents 3

# 参数说明
# --team: 启用 Team 并行模式
# --agents N: 并行 Agent 数量 (默认 3)
```

### 2.8 预期收益

| 指标 | 当前 (串行) | Team 模式 | 提升 |
|------|-------------|-----------|------|
| 3 个 US 执行时间 | 30 min | 12 min | -60% |
| Agent 利用率 | 100% (1个) | 300% (3个) | +200% |
| 上下文切换 | 频繁 | 无 | -100% |
| 错误隔离 | 无 | 完全 | +100% |

---

## 第三部分：Hook 与状态管理集成

### 3.1 新增 Hook

#### TeammateIdle Hook

**触发时机**：Teammate 完成任务后进入空闲状态

**功能**：
1. 验证上一个任务是否真正完成
2. 更新 orchestration_status.json
3. 分配下一个任务或触发 shutdown

```yaml
# quality-gates.yml 配置
teammate_idle:
  idle_checks:
    - name: "Verify Last Task"
      command: "bash .claude/scripts/verify-task-completion.sh ${LAST_TASK_ID}"
  assignment_strategy: "priority_first"
  idle_timeout: 5
```

#### TaskCompleted Hook

**触发时机**：任务被标记为 completed

**功能**：
1. 执行质量验证（lint, typecheck, test）
2. 阻止不合格的任务完成
3. 更新状态并检查阶段转换

```yaml
# quality-gates.yml 配置
task_completed:
  verify:
    - npm run lint --if-present
    - npm run typecheck --if-present
    - npm test -- --passWithNoTests
  block_on_failure: true
  max_retries: 3
```

### 3.2 状态同步机制

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Team 状态                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ TaskList    │  │ Teammate    │  │ Message     │         │
│  │ (内存)      │  │ Status      │  │ Queue       │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
    ┌─────────────────────────────────────────────────────┐
    │              状态同步层 (state-sync.ts)              │
    └─────────────────────────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    文件系统状态                              │
│  └── orchestration_status.json (SSOT)                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 orchestration_status.json 扩展

```json
{
  "reqId": "REQ-007",
  "status": "in_progress",
  "phase": "development",

  "team": {
    "mode": "parallel",
    "lead": "team-lead",
    "teammates": [
      {
        "id": "dev-analyst",
        "role": "developer",
        "status": "working",
        "currentTask": "T001",
        "completedTasks": ["T000"]
      }
    ],
    "taskAssignments": {
      "T001": "dev-analyst"
    }
  },

  "ralphLoop": {
    "enabled": true,
    "teammates": {
      "dev-analyst": {
        "iteration": 2,
        "lastVerifyResult": "passed"
      }
    },
    "globalIteration": 3,
    "maxIterations": 5
  }
}
```

### 3.4 Ralph Loop 适配

**问题**：现有 Ralph Loop 假设单 Agent

**解决方案**：
1. 扩展状态结构支持多 Teammate
2. Teammate 级别验证 + 全局验证
3. 分布式迭代控制

```yaml
# quality-gates.yml 新增配置
ralph_loop:
  team_mode:
    enabled: true
    scope: "teammate"
    teammate_verify:
      dev-analyst:
        - npm run lint -- --files-changed
        - npm test -- --changed
    global_verify:
      - npm run lint
      - npm run typecheck
      - npm test
    max_iterations_per_teammate: 3
    max_global_iterations: 10
```

---

## 第四部分：实施路线图

### Phase 1: 基础集成 (Week 1-2)

| 任务 | 优先级 | 工作量 | 输出 |
|------|--------|--------|------|
| 扩展 orchestration_status.json | P1 | 1d | 新增 team, ralphLoop 字段 |
| 实现 TeammateIdle Hook | P1 | 2d | teammate-idle-hook.ts |
| 实现 TaskCompleted Hook | P1 | 2d | task-completed-hook.ts |
| 更新 quality-gates.yml | P1 | 1d | Team 模式配置 |

### Phase 2: flow-spec Team 模式 (Week 3)

| 任务 | 优先级 | 工作量 | 输出 |
|------|--------|--------|------|
| 实现 Mode Detection | P1 | 1d | flow-spec 入口判断 |
| 创建 spec-design-team 配置 | P1 | 1d | Team 配置文件 |
| 实现 Teammate 通信协议 | P2 | 2d | 协商消息格式 |
| 测试和验证 | P1 | 1d | 集成测试 |

### Phase 3: flow-dev Team 模式 (Week 4-5)

| 任务 | 优先级 | 工作量 | 输出 |
|------|--------|--------|------|
| 实现任务依赖解析 | P1 | 2d | parse-task-dependencies.ts |
| 实现文件冲突检测 | P1 | 1d | detect-file-conflicts.sh |
| 扩展 /flow:dev 命令 | P1 | 2d | --team 模式 |
| Git Worktree 集成 | P1 | 2d | Team + Worktree 协作 |
| Ralph Loop 适配 | P2 | 2d | 多 Teammate 支持 |

### Phase 4: 优化和文档 (Week 6)

| 任务 | 优先级 | 工作量 | 输出 |
|------|--------|--------|------|
| 状态恢复机制 | P2 | 2d | 断点续传 |
| 监控和告警 | P3 | 1d | 空闲超时告警 |
| 文档更新 | P1 | 2d | CLAUDE.md, 使用指南 |

---

## 第五部分：新增文件清单

### 5.1 Hook 文件

| 文件 | 用途 |
|------|------|
| `.claude/hooks/teammate-idle-hook.ts` | TeammateIdle Hook 实现 |
| `.claude/hooks/task-completed-hook.ts` | TaskCompleted Hook 实现 |
| `.claude/hooks/state-sync.ts` | 状态同步管理器 |

### 5.2 脚本文件

| 文件 | 用途 |
|------|------|
| `.claude/scripts/team-orchestrator.sh` | Team 模式调度器 |
| `.claude/scripts/parse-task-dependencies.ts` | 任务依赖解析 |
| `.claude/scripts/detect-file-conflicts.sh` | 文件冲突检测 |
| `.claude/scripts/verify-task-completion.sh` | 任务完成验证 |

### 5.3 配置文件

| 文件 | 修改内容 |
|------|----------|
| `.claude/config/quality-gates.yml` | 新增 teammate_idle, task_completed, ralph_loop.team_mode |
| `.claude/settings.json` | 注册新 Hook |

### 5.4 命令文件

| 文件 | 修改内容 |
|------|----------|
| `.claude/commands/flow/dev.md` | 添加 --team 模式 |
| `.claude/commands/flow/spec.md` | 添加 Team 模式检测 |

---

## 第六部分：风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 文件冲突 | 中 | 高 | User Story 隔离 + Worktree + 冲突检测 |
| Agent 失败 | 中 | 中 | 自动重试 + Team Lead 监控 |
| 状态不一致 | 中 | 中 | 统一状态源 + 定期同步 |
| 无限循环 | 低 | 高 | 全局迭代上限 + 超时机制 |
| 合并复杂 | 中 | 中 | 小步提交 + 频繁同步 |
| Token 成本增加 | 高 | 中 | 仅在 Full Mode 使用 Team |

---

## 第七部分：成功指标

| 指标 | 当前值 | 目标值 | 测量方法 |
|------|--------|--------|----------|
| 需求完成时间 | 90 min | 50 min | flow-init 到 flow-release |
| 设计阶段时间 | 12 min | 8 min | flow-spec 执行时间 |
| 开发阶段时间 | 30 min | 12 min | flow-dev 执行时间 |
| 决策冲突率 | 15% | 5% | 返工次数统计 |
| 测试覆盖率 | 80% | 85% | npm test --coverage |

---

## 附录：调研文档

- [flow-spec Team 架构设计](../scratchpad/flow-spec-team-design.md)
- [flow-dev 并行执行方案](../scratchpad/flow-dev-team-design.md)
- [Hook 集成设计](../scratchpad/hook-integration-design.md)

---

**下一步行动**：
1. 确认本方案
2. 创建开发 Team 执行 Phase 1
3. 按路线图迭代实施

---

*CC-DevFlow × Claude Team Integration Plan v1.0.0*
