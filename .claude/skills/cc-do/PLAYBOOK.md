# CC-Do Playbook

## Visible State Machine

`cc-plan | cc-investigate -> cc-do -> cc-check`

- Enter from: an approved `DESIGN.md` or `ANALYSIS.md` with frozen tasks.
- Stay in: `cc-do` while there are ready tasks, valid checkpoints, and the design contract still holds.
- Exit to: `cc-check` once the current task set has red/green/review evidence and no hidden execution gaps remain.
- Reroute to: `cc-investigate` if repeated failures prove the root-cause contract is wrong, or `cc-plan` if the requirement design itself is wrong.

## Quick Triage

开始前先把当前执行局面归到 4 类之一：

- `implement`: 已有 ready task，可直接进入 TDD
- `resume`: task 已有 runtime / checkpoint，需要续做
- `repair-from-investigation`: `ANALYSIS.md` 已冻结，可直接修
- `reroute-cc-investigate`: bug 根因未明，回调查入口
- `review-fix`: scope 不变，只修 review 指向的问题

如果这一步归不清，说明当前上下文还没组装好，不准开始实现。

## Execution Loop

1. 读取 `task-manifest.json`，先用 `scripts/select-ready-tasks.sh` 找出当前 ready tasks。
2. 如果有多于一个 ready task，要先跑 `scripts/detect-file-conflicts.sh`；有共享触点或依赖关系就退回串行。
3. 对每个要执行的 task，先用 `scripts/build-task-context.sh` 从 `DESIGN.md`、`TASKS.md`、`task-manifest.json` 组装上下文，再开始编码。
4. 如果当前任务来自 `cc-investigate`，把 `ANALYSIS.md` 当成上游合同，不准一边做一边重开调查。
5. 进入 TDD 闭环：先红，再绿，再重构。
6. 每个关键节点都写 runtime：失败测试、Green 通过、Refactor、Review 结论、阻塞原因。
7. 任务实现后，先过 `spec review`，再过 `code review`，review 不通过就回到实现。
8. 两道 review 门都通过后，才能把任务标成完成，并把结果留给 `cc-check`。

## Local Kit

- 恢复时看 `references/execution-recovery.md`
- 并行分配时看 `references/parallel-dispatch.md`
- 需要判断当前任务时用 `scripts/check-task-status.sh`
- 需要找 ready task 时用 `scripts/select-ready-tasks.sh`
- 需要组装任务上下文时用 `scripts/build-task-context.sh`
- 需要写 checkpoint 时用 `scripts/write-task-checkpoint.sh`
- 需要写 review 门结果时用 `scripts/record-review-decision.sh`
- 需要校验任务闭环时用 `scripts/verify-task-gates.sh`
- 需要勾选任务时用 `scripts/mark-task-complete.sh`
- 需要确认并行安全时用 `scripts/detect-file-conflicts.sh`
- bug 根因没冻结时，退出当前执行并回 `cc-investigate`

## TDD Standard

1. 先写失败测试，再运行到红。
2. 只写让当前测试转绿的最小实现。
3. 绿后才允许重构。
4. 重构后必须保持绿。
5. 测试没先红过，就不能宣称这次变更受 TDD 保护。

## Task Gates

任务只有在下面顺序全部成立后，才算完成：

1. `red_failed`: 已观察到预期失败
2. `green_passed`: 当前任务实现转绿
3. `refactor_done` 或 `refactor_not_needed`
4. `spec_review_pass`
5. `code_review_pass`

任何一门失败，都回到实现，不准直接跨过去。

## Parallel Dispatch Rule

只有满足全部条件，才能并行：

1. 任务处于当前 active phase
2. `dependsOn` 已全部满足
3. 任务显式允许并行，例如 `[P]`
4. `touches` / `files` 不冲突
5. 每个 subagent 都拿到了自己的 task context

少一条，都按顺序执行。

## Root Cause Protocol

- 先复现，再猜原因
- 先读 `ANALYSIS.md`，再改代码
- 先守住修复边界，再做最小实现
- 两次失败后回看证据
- 三次失败后先回 `cc-investigate`，再决定是否需要 `cc-plan`

## Recovery Standard

至少留下这些恢复信息：

- 当前任务 ID
- 当前 active phase / ready tasks
- 已完成什么
- 卡在哪里
- 下一步唯一动作
- 相关文件 / 命令 / 观察
- 最近一次 Red/Green/Review 到了哪一站
