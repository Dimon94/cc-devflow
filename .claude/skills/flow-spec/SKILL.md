---
name: flow-spec
description: 'Generate and refresh task-manifest for a requirement. Use when converting requirement context into dependency-aware executable tasks.'
---

# Flow-Spec Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

将需求上下文转换为 `task-manifest.json`，作为后续执行唯一任务源。

规则：

- 这是薄 planning 原语，不负责再扩展一层 proposal/design/specs 平台
- 若需求仍模糊，先用 `/flow:autopilot` 收敛计划，再回到 `flow:spec`
- 优先把 `devflow/intent/<REQ>/summary.md` / `facts.md` / `plan.md` 收敛成 `TASKS.md` 或明确任务边界，再运行 planner
- `TASKS.md` 是 planner 的直接输入；若不存在，harness 只会生成最小 bootstrap task，而不是替你发明完整计划

## Input Format

```bash
/flow:spec "REQ_ID" [--overwrite]
```

## Execution Steps

1. 解析 `REQ_ID` 和可选 `--overwrite`。

2. 运行计划生成：

```bash
npm run harness:plan -- --change-id "${REQ_ID}" [--overwrite]
```

3. 校验输出：
   - `devflow/requirements/${REQ_ID}/task-manifest.json`
   - `tasks` 数组非空，`id/dependsOn/run` 字段完整

4. 若产物仍是 bootstrap task：
   - 回到 intent memory 补充任务拆解
   - 或先补 `TASKS.md`，再使用 `--overwrite` 重新生成 manifest

## Exit Criteria

- `task-manifest.json` 可通过 schema 校验
- 任务依赖图无自循环（由 planner 保障）

## Next Step

```bash
/flow:dev "${REQ_ID}"
```
