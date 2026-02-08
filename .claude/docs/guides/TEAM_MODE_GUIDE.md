# Claude Team 模式使用指南

> **版本**: v1.0.0
> **日期**: 2026-02-07
> **适用**: CC-DevFlow v4.7+

---

## 概述

Claude Team 模式允许多个 Agent 并行协作开发，显著提升开发效率。

### 核心优势

| 指标 | 单 Agent | Team 模式 | 提升 |
|------|----------|-----------|------|
| 并行任务数 | 1 | 3-5 | +400% |
| 需求完成时间 | 90 min | 50 min | -45% |
| 上下文隔离 | 无 | 完全隔离 | 100% |

---

## 快速开始

### 1. flow-dev Team 模式

```bash
# 启用 Team 模式 (默认 3 个 Agent)
/flow:dev "REQ-123" --team

# 指定 Agent 数量 (2-5)
/flow:dev "REQ-123" --team --agents 5
```

### 2. flow-spec Team 模式

```bash
# Full Mode 自动使用 Team (tech + ui 并行)
/flow:spec "REQ-123"

# 简化模式使用 Subagent
/flow:spec "REQ-123" --skip-tech --skip-ui
```

---

## 工作原理

### flow-dev Team 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│  1. 任务分析                                                 │
│     → parse-task-dependencies.js 解析 TASKS.md              │
│     → 识别 [P] 并行标记、[US*] 用户故事、Phase 依赖          │
├─────────────────────────────────────────────────────────────┤
│  2. 冲突检测                                                 │
│     → detect-file-conflicts.sh 检测文件冲突                 │
│     → 冲突任务分配给同一 Agent 串行执行                      │
├─────────────────────────────────────────────────────────────┤
│  3. 任务分配                                                 │
│     → Round-robin 分配无冲突任务                            │
│     → 更新 orchestration_status.json                        │
├─────────────────────────────────────────────────────────────┤
│  4. 并行执行                                                 │
│     → 每个 Agent 独立执行分配的任务                          │
│     → TeammateIdle Hook 自动分配下一任务                     │
├─────────────────────────────────────────────────────────────┤
│  5. 完成处理                                                 │
│     → TaskCompleted Hook 验证质量                           │
│     → 所有任务完成后 shutdown                                │
└─────────────────────────────────────────────────────────────┘
```

### flow-spec Team 执行流程

```
PRD (串行) → Tech + UI (Team 并行) → Epic (串行)

Time ────────────────────────────────────────────►

T0   ┌─────────────┐
     │ prd-writer  │  (必须先完成)
     └──────┬──────┘
            │
T1          ├────────────────────┐
            │                    │
     ┌──────▼──────┐      ┌──────▼──────┐
     │tech-architect│      │ ui-designer │  (Team 并行)
     └──────┬──────┘      └──────┬──────┘
            │                    │
            │  ← SendMessage 协商 →
            │                    │
T2          └─────────┬──────────┘
                      │
               ┌──────▼──────┐
               │   planner   │  (等待两者完成)
               └─────────────┘
```

---

## TASKS.md 标记规范

### 并行标记 [P]

```markdown
## Phase 3: Core Implementation

- [ ] T005 [P] [US1] 实现用户注册 API (src/api/user.ts)
- [ ] T006 [P] [US2] 实现订单创建 API (src/api/order.ts)
- [ ] T007 [US1] 实现用户验证逻辑 (src/services/auth.ts)
```

- `[P]` 标记表示该任务可并行执行
- 无 `[P]` 标记的任务必须串行执行
- 同一文件的任务不应标记 `[P]`

### 用户故事分组 [US*]

```markdown
- [ ] T005 [P] [US1] 用户注册 API
- [ ] T006 [P] [US1] 用户登录 API
- [ ] T007 [P] [US2] 订单创建 API
```

- `[US1]`, `[US2]` 等标记用户故事分组
- 同一用户故事的任务优先分配给同一 Agent
- 减少上下文切换，提高效率

---

## 文件冲突处理

### 冲突检测

```bash
# 输入
{
  "tasks": [
    {"id": "T001", "filePath": "src/user.ts"},
    {"id": "T002", "filePath": "src/user.ts"},
    {"id": "T003", "filePath": "src/order.ts"}
  ]
}

# 输出
{
  "hasConflicts": true,
  "conflicts": [
    {"file": "src/user.ts", "tasks": ["T001", "T002"]}
  ],
  "safeGroups": [
    {"tasks": ["T003"]}
  ]
}
```

### 冲突解决策略

| 策略 | 描述 |
|------|------|
| **same_agent** | 冲突任务分配给同一 Agent 串行执行 |
| **sequential** | 所有冲突任务按顺序执行 |

---

## 状态管理

### orchestration_status.json Team 字段

```json
{
  "team": {
    "mode": "parallel",
    "lead": "dev-lead",
    "teammates": [
      {
        "id": "dev-1",
        "role": "developer",
        "status": "working",
        "currentTask": "T001",
        "completedTasks": ["T000"],
        "lastActiveAt": "2026-02-07T10:00:00Z"
      }
    ],
    "taskAssignments": {
      "T001": "dev-1",
      "T002": "dev-2"
    }
  }
}
```

### Teammate 状态

| 状态 | 描述 |
|------|------|
| `idle` | 空闲，等待任务分配 |
| `working` | 正在执行任务 |
| `blocked` | 被依赖阻塞 |
| `completed` | 所有任务完成 |

---

## Hook 配置

### quality-gates.yml

```yaml
# TeammateIdle Hook 配置
teammate_idle:
  idle_checks:
    - npm run lint --if-present
    - npm run typecheck --if-present
  assignment_strategy: priority_first
  idle_timeout: 300  # 秒

# TaskCompleted Hook 配置
task_completed:
  verify:
    - npm run lint --if-present
    - npm run typecheck --if-present
    - npm test -- --passWithNoTests
  block_on_failure: true
  max_retries: 3

# Ralph Loop Team 模式配置
ralph_loop:
  team_mode:
    enabled: true
    scope: teammate
    teammate_verify:
      dev-frontend:
        - npm run lint -- --files-changed
      dev-backend:
        - npm test -- --changed
    global_verify:
      - npm run lint
      - npm run typecheck
      - npm test
    max_iterations_per_teammate: 3
    max_global_iterations: 10
```

---

## 最佳实践

### 1. 任务设计

- **独立性**: 每个任务应尽量独立，减少文件冲突
- **粒度**: 任务粒度适中，不要太大也不要太小
- **标记**: 正确使用 `[P]` 和 `[US*]` 标记

### 2. Agent 数量选择

| 任务数 | 推荐 Agent 数 |
|--------|---------------|
| 1-5 | 2 |
| 6-10 | 3 |
| 11-20 | 4 |
| 20+ | 5 |

### 3. 监控和调试

```bash
# 查看 Team 状态
cat devflow/requirements/REQ-123/orchestration_status.json | jq '.team'

# 查看任务分配
cat devflow/requirements/REQ-123/orchestration_status.json | jq '.team.taskAssignments'

# 查看执行日志
tail -f devflow/requirements/REQ-123/EXECUTION_LOG.md
```

---

## 故障排除

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Agent 空闲超时 | 任务执行时间过长 | 增加 `idle_timeout` 配置 |
| 文件冲突频繁 | 任务设计不合理 | 重新设计任务，减少文件重叠 |
| 验证失败循环 | 代码质量问题 | 检查 ERROR_LOG.md，修复问题 |
| Team 状态不一致 | 异常退出 | 使用 `/flow:dev --resume` 恢复 |

### 紧急停止

```bash
# 停止所有 Agent
# 1. 清理 Team 状态
jq '.team = null' orchestration_status.json > tmp.json && mv tmp.json orchestration_status.json

# 2. 或使用命令
/util:cancel-ralph
```

---

## 参考资料

- [CLAUDE_TEAM_INTEGRATION_PLAN.md](../../../devflow/CLAUDE_TEAM_INTEGRATION_PLAN.md) - 集成方案
- [hooks/CLAUDE.md](../../hooks/CLAUDE.md) - Hook 文档
- [flow-dev.md](../../commands/flow/dev.md) - flow-dev 命令文档

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
