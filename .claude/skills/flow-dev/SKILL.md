---
name: flow-dev
description: 'Execute task-manifest with dependency-aware parallel dispatch and checkpoint recovery. Use when implementing planned tasks for a requirement.'
---

# Flow-Dev Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

执行 `task-manifest.json` 中的任务，默认并行调度并写入 checkpoint/events 供恢复。

## Long-Running Harness Protocol（Initializer/Worker/Done Gate）

`/flow:dev` 是最长链路阶段，必须严格执行“先读状态、再增量、后留证据”。

### Session Start（禁止盲跑）

每个窗口开始时先同步以下信息：
- `devflow/requirements/${REQ_ID}/session-checklist.json`（若存在）
- `devflow/requirements/${REQ_ID}/session-progress.md`（若存在）
- `devflow/requirements/${REQ_ID}/session-handoff.md`（若存在）
- `devflow/requirements/${REQ_ID}/task-manifest.json`
- `.harness/runtime/${REQ_ID}/**/checkpoint.json` 与 `events.jsonl`（若存在）

然后执行一次基础健康检查：
1. 不存在损坏的 `running` 残留状态
2. 上轮失败任务与失败原因可定位

### Worker Session（最小可执行前沿）

单窗口仅推进一个最小前沿：
- 仅处理当前 `dependsOn` 已满足的一组任务
- 每完成一组任务即写入 checkpoint/events
- 遇到失败立即收敛原因并记录，不并行扩散新的失败面

会话收尾必须：
1. 更新 `task-manifest.json` 状态
2. 更新 `session-progress.md` 与 `session-handoff.md`
3. 推荐提交一个可回滚的最小 git commit（若仓库策略允许）

### Done Gate

仅当以下条件满足才标记 `flow:dev` 完成：
- 全部任务为 `passed` 或 `skipped`
- 无 `running`/`failed` 残留
- `session-checklist.json` 中 `flow:dev.passes == true`

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
