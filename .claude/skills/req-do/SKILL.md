---
name: req-do
description: Use when implementing planned tasks, resuming interrupted work, debugging inside scope, or applying review feedback for an already planned requirement.
---

# Req-Do

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Role

`req-do` 是 PDCA 里的 `Do`。

它只做一件事：沿着计划好的任务，把代码真正做出来。

## Read First

1. `PLAYBOOK.md`
2. `references/execution-recovery.md`

## Use This Skill When

- 要实现 `TASKS.md` / `task-manifest.json`
- 执行被中断，需要恢复
- bug 需要先找根因再修
- review feedback 要落成代码

如果方案还没冻结、任务边界还没定，停下并回 `req-plan`。

## Entry Gate

1. 先读 `DESIGN.md`、`TASKS.md`、`task-manifest.json`。
2. 明确当前只做哪个任务，不要一口气吞掉整个 requirement。
3. bug 场景先写根因调查，再动实现。

## Loop

1. 读取当前任务，而不是重新发明任务。
2. 先做当前任务，再移动到下一个任务。
3. bug 先查根因，再动代码。
4. 每次推进都留下 checkpoint，保证能恢复。
5. 当前任务完成后，把可验证证据留给 `req-check`。

## Output

- 代码变更
- 测试变更
- `.harness/runtime/<REQ>/**` checkpoint / events
- `ANALYSIS.md` / `PLAN.md`（仅 bug 场景）

## Bundled Resources

- 执行 / 恢复规则：`references/execution-recovery.md`
- 恢复分析：`scripts/recover-workflow.sh`
- 任务状态：`scripts/check-task-status.sh`
- 任务勾选：`scripts/mark-task-complete.sh`
- 文件冲突：`scripts/detect-file-conflicts.sh`
- 根因模板：`scripts/run-problem-analysis.sh`

## Working Rules

1. 没有根因，不准修 bug。
2. 没有任务边界，不准无界发散。
3. 先完成当前任务，再开下一任务。
4. 失败和阻塞都要留下恢复证据。
5. 三次失败修补后必须质疑设计，而不是继续堆补丁。

## Exit Criteria

- 当前任务有代码和测试证据
- 恢复点已更新
- 阻塞原因已写清楚
- 下一步应进入 `req-check`，或明确退回 `req-plan`

## Do Not

- 不在这里重开方案讨论
- 不把一次修复膨胀成重写整个模块
- 三层以上判断说明设计该回炉

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 执行规则：`references/execution-recovery.md`
