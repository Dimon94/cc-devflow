# flow-dev/ - Development Execution Skill

> L2 | 父级: `.claude/skills/workflow/CLAUDE.md`

## Purpose

执行开发任务，遵循 TDD Iron Law，默认 Autonomous 模式。

## Members

| File | Purpose | Lines |
|------|---------|-------|
| `SKILL.md` | 核心指令：TDD 执行流程、模式、错误处理 | ~100 |
| `context.jsonl` | 上下文注入定义 | ~15 |
| `scripts/entry-gate.sh` | 入口检查：TASKS.md 存在、状态验证 | ~100 |
| `scripts/exit-gate.sh` | 出口检查：任务完成度、测试验证 | ~100 |
| `scripts/task-orchestrator.sh` | 任务调度：解析 TASKS.md、标记完成 | ~100 |
| `references/dev-implementer.md` | Agent 指令链接 | symlink |
| `assets/IMPLEMENTATION_PLAN_TEMPLATE.md` | 实现计划模板 | ~80 |

## TDD Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

## Execution Flow

```
Entry Gate → Task Loop (TDD) → Exit Gate

For each task:
  1. Protocol 2: 读取任务 DoD
  2. Write failing test (Phase 2)
  3. Verify test fails
  4. Write implementation (Phase 3)
  5. Verify test passes
  6. Mark task [x]
  7. Protocol 3: 读取下一任务 + ERROR_LOG
```

## Mode Matrix

| Mode | Flag | Behavior |
|------|------|----------|
| Autonomous | (default) | 自动重试，迭代直到完成 |
| Manual | `--manual` | 遇错停止，等待用户 |

## Agent Reference

- `references/dev-implementer.md` → `.claude/agents/dev-implementer.md`

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
