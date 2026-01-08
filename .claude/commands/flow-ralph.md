---
name: flow-ralph
description: 'Start autonomous Ralph loop. Usage: /flow-ralph "REQ-123" [--max-iterations N]'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  check_tasks: .claude/scripts/check-task-status.sh
  mark_task: .claude/scripts/mark-task-complete.sh
  setup: .claude/scripts/setup-ralph-loop.sh
skills:
  attention: .claude/skills/flow-attention-refresh/SKILL.md
  tdd: .claude/skills/flow-tdd/SKILL.md
---

# Flow-Ralph - 自主迭代循环命令

## 核心理念

**Ralph 循环**: 持续迭代直到完成，永不放弃。

```
提示不变 + 文件状态变化 = Claude 从自己的前作中学习
```

## User Input

```text
$ARGUMENTS = "REQ_ID? [--max-iterations N]"
```

- `REQ_ID`: 可选，未提供则从当前分支推断
- `--max-iterations`: 最大迭代次数（默认 10，安全阀）

## 命令格式

```bash
/flow-ralph "REQ-123"
/flow-ralph "REQ-123" --max-iterations 20
/flow-ralph              # Auto-detect from branch
```

---

## 与 /flow-dev 的区别

| | /flow-dev | /flow-ralph |
|--|-----------|-------------|
| 退出条件 | 任务失败可停止 | 迭代直到完成或上限 |
| 错误处理 | 提示用户修复 | 自动重试 |
| 注意力刷新 | 每任务一次 | 每迭代刷新（含错误学习） |
| 适用场景 | 需要人工监督 | 可无人值守 |
| ERROR_LOG | 可选记录 | 强制记录 |

**使用建议**:
- **flow-dev**: 复杂需求，需要人工判断
- **flow-ralph**: 清晰需求，可自动完成

---

## 执行流程

### 阶段 1: Entry Gate

```yaml
1. 解析 REQ_ID 和 --max-iterations:
   → If argument provided: use it
   → Else: run {SCRIPT:prereq} --json --paths-only
   → Extract max_iterations (default: 10)

2. 校验资产:
   → TASKS.md 必须存在
   → orchestration_status.json 必须存在
   → 状态必须是 epic_complete 或 development_in_progress

3. 初始化 Ralph 状态:
   → Run: {SCRIPT:setup} "${REQ_ID}" --max-iterations ${MAX_ITERATIONS}
   → Creates .claude/ralph-loop.local.md with loop state
   → Creates ERROR_LOG.md if not exists (use ERROR_LOG_TEMPLATE.md)
   → Log Ralph loop start to EXECUTION_LOG.md

4. 读取未完成任务数:
   → Run: {SCRIPT:check_tasks} --json
   → Get remaining_tasks count
   → If remaining_tasks == 0 → EXIT "All tasks completed"
```

---

### 阶段 2: Ralph Loop

```yaml
FOR iteration in 1..max_iterations:

  ┌──────────────────────────────────────────────────────┐
  │ Step A: 注意力刷新 (Protocol 3)                       │
  ├──────────────────────────────────────────────────────┤
  │ → Read: TASKS.md 第一个未完成任务 `- [ ]`             │
  │ → Read: ERROR_LOG.md 最近 5 条记录（如存在）          │
  │ → Focus: 下一步行动 + 避免重复错误                     │
  └──────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────┐
  │ Step B: 执行任务 (TDD 方式)                           │
  ├──────────────────────────────────────────────────────┤
  │ → 提取任务 ID, phase, 文件路径                        │
  │ → 遵循 {SKILL:tdd} 执行                              │
  │ → Phase 2: 写测试，验证 FAIL                          │
  │ → Phase 3: 写实现，验证 PASS                          │
  └──────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────┐
  │ Step C: 错误处理                                      │
  ├──────────────────────────────────────────────────────┤
  │ IF test fails OR build error:                        │
  │   → Record error to ERROR_LOG.md                     │
  │   → Apply Protocol 4 (Error Recovery)                │
  │   → Analyze root cause                               │
  │   → Fix and re-run tests                             │
  │   → Update ERROR_LOG.md with resolution              │
  │ ELSE:                                                │
  │   → Task succeeded                                   │
  │   → Run: {SCRIPT:mark_task} T###                     │
  │   → Git commit (one task per commit)                 │
  └──────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────┐
  │ Step D: 完成检查                                      │
  ├──────────────────────────────────────────────────────┤
  │ → Run: {SCRIPT:check_tasks} --json                   │
  │ → IF remaining_tasks == 0:                           │
  │     → Output "RALPH_COMPLETE"                        │
  │     → BREAK (Exit loop successfully)                 │
  │ → ELSE:                                              │
  │     → Continue to next iteration                     │
  └──────────────────────────────────────────────────────┘

END FOR
```

**循环退出条件**:
1. 所有任务完成 (`remaining_tasks == 0`) → 成功
2. 达到 `max_iterations` → 输出状态报告

---

### 阶段 3: Exit Gate

```yaml
IF Ralph loop exited with RALPH_COMPLETE:
  1. Update orchestration_status:
     → status = "development_complete"
     → completedSteps append "dev"

  2. Log to EXECUTION_LOG.md:
     → Ralph loop completed
     → Total iterations used
     → Errors encountered and resolved

  3. Output success message:
     ✅ All tasks completed autonomously
     → Next: /flow-qa

ELSE (reached max_iterations):
  1. Generate status report:
     → Completed tasks count
     → Remaining tasks count
     → Recent errors (from ERROR_LOG.md)

  2. Output partial completion message:
     ⚠️ Reached max iterations
     → Completed: X/Y tasks
     → Recommend: Review recent errors, increase --max-iterations, or continue with /flow-dev

  3. Keep status as "development_in_progress"
```

---

## 输出产物

```yaml
成功情况:
  ✅ All tasks in TASKS.md marked complete
  ✅ ERROR_LOG.md with errors and resolutions
  ✅ Git commits (one per task)
  ✅ orchestration_status.json updated

部分完成情况:
  ⚠️ Some tasks completed
  ⚠️ Status report with remaining work
  ⚠️ ERROR_LOG.md with unresolved errors
```

---

## 使用场景

### 适合 Ralph 模式:
- ✅ TASKS.md 定义清晰
- ✅ 需求已充分研究（PRD + TECH_DESIGN + contracts）
- ✅ 可无人值守执行
- ✅ 任务相对独立

### 不适合 Ralph 模式:
- ❌ 需求模糊，需要频繁澄清
- ❌ 需要重大架构决策
- ❌ 依赖外部反馈
- ❌ 需要人工 code review 才能继续

**建议**: 对于复杂需求，先用 `/flow-dev` 完成关键任务，再用 `/flow-ralph` 完成剩余任务。

---

## 错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| TASKS.md 不存在 | ERROR "Run /flow-epic first" |
| 所有任务已完成 | INFO "Nothing to do, all complete" |
| 达到迭代上限 | 输出状态报告，保持 development_in_progress |
| 连续 3 次相同错误 | WARN "Stuck on same error, suggest manual intervention" |
| 测试失败 | 记录 ERROR_LOG.md，自动重试 |
| 构建失败 | 记录 ERROR_LOG.md，自动修复 |

---

## 恢复与继续

如果 Ralph 循环因错误停止，可以：

```bash
# 从当前状态继续
/flow-ralph "REQ-123"

# 或使用 flow-dev 手动修复后继续
/flow-dev "REQ-123"

# 查看错误日志
cat devflow/requirements/REQ-123/ERROR_LOG.md
```

---

## Stop Hook 集成 (未来功能)

> **注意**: 当前版本暂不集成 Stop Hook，Ralph 循环由命令内部控制。
> Stop Hook 集成需要额外的 CLI 配置，将在后续版本实现。

**未来计划**:
- Stop Hook 拦截退出尝试
- 检查 `remaining_tasks == 0`
- 未完成则重新注入相同 prompt
- 完成则允许退出

---

## 成功指标

| 指标 | 目标 |
|------|------|
| 任务完成率 (无人工干预) | ≥85% |
| 测试失败后自动恢复率 | ≥70% |
| 错误重复发生率 | ≤10% |

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
