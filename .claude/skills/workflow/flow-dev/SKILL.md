---
name: flow-dev
description: 'Execute development tasks with TDD and Autonomous mode. Usage: /flow-dev "REQ-123" [--manual] [--max-iterations N]'
---

# Flow-Dev Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

执行开发任务，遵循 TDD Iron Law，默认 Autonomous 模式。

## TDD Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

### TDD Checkpoint

```yaml
⚠️ TEST VERIFICATION CHECKPOINT:
  1. 运行所有 Phase 2 测试
  2. 验证所有新测试 FAIL
  3. 只有全部 FAIL 后才能进入 Phase 3
  4. 如果已经写了实现代码 → DELETE 重来
```

## Input Format

```
/flow-dev "REQ_ID" [--manual] [--max-iterations N] [--task T###]
```

- **默认**: Autonomous 模式 (自动重试)
- **--manual**: Manual 模式 (遇错停止)
- **--max-iterations**: 最大迭代次数 (默认 10)
- **--task**: 从指定任务开始

## 运行模式对比

| | Manual | Autonomous (默认) |
|--|--------|------------------|
| 遇到错误 | 停止 | 自动重试 |
| 注意力刷新 | Protocol 2 | Protocol 2+3+4 |
| 适用场景 | 复杂需求 | 清晰需求 |

## Execution Flow

### Stage 1: Entry Gate

1. TASKS.md 存在
2. EPIC.md 存在
3. Status: `epic_complete`

### Stage 2: Task Execution (Ralph Loop)

```
For each task in TASKS.md:
  1. Protocol 2: 读取任务 DoD
  2. 执行任务
  3. 验证完成
  4. 标记 [x]
  5. Protocol 3: 读取下一任务 + ERROR_LOG
```

### Stage 3: Error Handling

```
On Error:
  1. Protocol 4: 读取 ERROR_LOG.md
  2. 记录错误到 ERROR_LOG.md
  3. Autonomous: 自动重试
  4. Manual: 停止等待
```

### Stage 4: Exit Gate

1. 所有任务完成
2. 测试通过
3. Status: `development_complete`

## Attention Refresh Protocols

| Protocol | Trigger | Reads |
|----------|---------|-------|
| 2 | Task start | TASKS.md T### + DoD |
| 3 | Iteration start | TASKS.md + ERROR_LOG |
| 4 | After error | ERROR_LOG.md |

## Next Step

```
/flow-quality "${REQ_ID}"
```
