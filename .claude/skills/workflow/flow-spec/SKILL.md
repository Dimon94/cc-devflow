---
name: flow-spec
description: 'Generate and refresh task-manifest for a requirement. Use when converting requirement context into dependency-aware executable tasks.'
---

# Flow-Spec Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

将需求上下文转换为 `task-manifest.json`，作为后续执行唯一任务源。

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

## Exit Criteria

- `task-manifest.json` 可通过 schema 校验
- 任务依赖图无自循环（由 planner 保障）

## Next Step

```bash
/flow:dev "${REQ_ID}"
```
