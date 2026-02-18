---
name: flow-spec
description: 'Generate and refresh task-manifest for a requirement. Use when converting requirement context into dependency-aware executable tasks.'
---

# Flow-Spec Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

将需求上下文转换为 `task-manifest.json`，作为后续执行唯一任务源。

## Long-Running Harness Protocol（Initializer/Worker/Done Gate）

`/flow:spec` 必须以“可恢复、可验证”的增量方式生成计划，而不是一次性黑箱产出。

### Session Start（先同步上下文，再规划）

每个窗口启动先读取：
- `devflow/requirements/${REQ_ID}/session-checklist.json`（若存在）
- `devflow/requirements/${REQ_ID}/session-progress.md`（若存在）
- `devflow/requirements/${REQ_ID}/session-handoff.md`（若存在）
- `devflow/requirements/${REQ_ID}/context-package.md`
- 旧版 `task-manifest.json`（若存在）

### Worker Session（一次只收敛一个规划目标）

每轮只完成一个最小目标，例如：
- 修正一个依赖子图
- 补齐一组缺失的 `run` 指令
- 处理一次 `--overwrite` 下的清理重建

完成后必须：
1. 运行 `harness:plan` 生成/刷新 manifest
2. 校验 schema 与依赖无环
3. 更新 progress/handoff，写明下一轮唯一目标

### Done Gate

仅当以下条件满足才标记 `flow:spec` 完成：
- `task-manifest.json` 存在且 `tasks` 非空
- `id/dependsOn/run` 字段完整且无自循环
- `session-checklist.json` 中 `flow:spec.passes == true`

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
