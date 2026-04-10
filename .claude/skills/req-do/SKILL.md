---
name: req-do
description: Use when implementing planned tasks, resuming interrupted work, debugging inside scope, or applying review feedback for an already planned requirement.
---

# Req-Do

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Role

`req-do` 是 PDCA 里的 `Do`。

它只做一件事：沿着已经冻结的任务，把代码真正做出来，并把执行证据留到足够让别人接手、复盘、复验。

## Read First

1. `PLAYBOOK.md`
2. `references/execution-recovery.md`
3. `references/parallel-dispatch.md`

## Use This Skill When

- 要实现 `TASKS.md` / `task-manifest.json`
- 执行被中断，需要恢复
- bug 需要先找根因再修
- review feedback 要落成代码

如果方案还没冻结、任务边界还没定，停下并回 `req-plan`。

## Entry Gate

1. 先读 `DESIGN.md`、`TASKS.md`、`task-manifest.json`、`context-package.md`、`resume-index.md`。
2. 先用 `scripts/select-ready-tasks.sh` 判断现在到底哪几个任务真的 ready。
3. 只锁定当前 ready task，或一组经依赖与触点校验后可并行的 ready tasks。
4. bug 场景先写 `ANALYSIS.md`，先复现、留证据、下根因，再动实现。
5. 没有上下文包，不准把任务扔给 subagent；先用 `scripts/build-task-context.sh` 组装上下文。

## Loop

1. 读取当前任务，而不是重新发明任务。
2. 依赖没满足前，不准提前做下游任务。
3. 没有明确并行资格，不准把多个实现任务同时推进。
4. 先 `fail-first`：先写失败测试，先看见红，再写生产代码。
5. 按 `Red -> Green -> Refactor` 推进，Green 只允许最小实现。
6. 每次推进都写 task runtime：`events.jsonl` + `checkpoint.json`。
7. 任务实现后，先过 `spec review`，再过 `code review`，两道门都过才算任务收口。
8. 当前任务完成后，把可验证证据留给 `req-check`。

## Output

- 代码变更
- 测试变更
- `.harness/runtime/<REQ>/<TASK>/events.jsonl`
- `.harness/runtime/<REQ>/<TASK>/checkpoint.json`
- `.harness/runtime/<REQ>/<TASK>/checkpoint.md`
- `.harness/runtime/<REQ>/<TASK>/review-spec.md`
- `.harness/runtime/<REQ>/<TASK>/review-code.md`
- `ANALYSIS.md` / `PLAN.md`（仅 bug 场景）

## Bundled Resources

- 执行 / 恢复规则：`references/execution-recovery.md`
- 并行分配准则：`references/parallel-dispatch.md`
- 恢复分析：`scripts/recover-workflow.sh`
- 任务状态：`scripts/check-task-status.sh`
- ready 任务选择：`scripts/select-ready-tasks.sh`
- 任务上下文组装：`scripts/build-task-context.sh`
- checkpoint 记录：`scripts/write-task-checkpoint.sh`
- review 记录：`scripts/record-review-decision.sh`
- 任务闭环校验：`scripts/verify-task-gates.sh`
- 任务勾选：`scripts/mark-task-complete.sh`
- 文件冲突：`scripts/detect-file-conflicts.sh`
- 根因模板：`scripts/run-problem-analysis.sh`

## Working Rules

1. 没有根因，不准修 bug。
2. 没有任务边界，不准无界发散。
3. 没有失败测试，不准写生产代码。
4. 测试如果第一次就绿，说明你没证明任何东西，先修测试。
5. 先过 `spec review`，再过 `code review`，顺序不能反。
6. 失败和阻塞都要留下恢复证据。
7. 给 subagent 的输入必须包含：当前进度、当前任务全文、依赖状态、必读文件、验收标准、可信命令。
8. 三次失败修补后必须质疑设计，而不是继续堆补丁。

## Exit Criteria

- 当前任务有 Red/Green 证据
- 当前任务有 `spec review` / `code review` 两道门证据
- 恢复点已更新到 `.harness/runtime/<REQ>/<TASK>/`
- 阻塞原因已写清楚
- 下一步应进入 `req-check`，或明确退回 `req-plan`

## Do Not

- 不在这里重开方案讨论
- 不把一次修复膨胀成重写整个模块
- 不把依赖任务和被依赖任务同时并行
- 不把没有当前进度的任务直接丢给 subagent
- 三层以上判断说明设计该回炉

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 执行规则：`references/execution-recovery.md`
- 并行规则：`references/parallel-dispatch.md`
