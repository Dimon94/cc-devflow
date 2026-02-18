---
name: flow-dev
description: 'Execute task-manifest with dependency-aware parallel dispatch and checkpoint recovery. Use when implementing planned tasks for a requirement.'
---

# Flow-Dev Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

执行 `task-manifest.json` 中的任务，默认并行调度并写入 checkpoint/events 供恢复。

## Input Format

```bash
/flow:dev "REQ_ID" [--parallel N] [--resume] [--max-retries N]
```

## Execution Steps

1. 解析参数：
   - 默认 `parallel = 3`
   - 默认不 resume
2. 分支执行：
   - 普通执行：

```bash
npm run harness:dispatch -- --change-id "${REQ_ID}" --parallel ${PARALLEL} [--max-retries ${MAX_RETRIES}]
```

   - 恢复执行：

```bash
npm run harness:resume -- --change-id "${REQ_ID}" --parallel ${PARALLEL} [--max-retries ${MAX_RETRIES}]
```

3. 检查执行结果：
   - `task-manifest.json` 状态更新
   - `.harness/runtime/${REQ_ID}/<TASK_ID>/events.jsonl`
   - `.harness/runtime/${REQ_ID}/<TASK_ID>/checkpoint.json`

## Exit Criteria

- 所有任务状态为 `passed` 或 `skipped`
- 没有 `running` 残留状态

## Failure Handling

- 若存在 `failed` 任务：
  1. 修复失败原因
  2. 重新运行 `--resume`

## Next Step

```bash
/flow:verify "${REQ_ID}"
```
