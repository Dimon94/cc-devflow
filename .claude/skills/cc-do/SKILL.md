---
name: cc-do
version: 1.4.0
description: "Use when implementing planned tasks, resuming interrupted work, applying a frozen investigation handoff, or landing review feedback after cc-plan or cc-investigate."
triggers:
  - "开始做 T003"
  - "继续上次做到一半的任务"
  - "按 planning/tasks.md 开始实现"
  - "修这个 review comment"
  - "implement this task"
  - "resume this requirement"
  - "repair this investigated bug"
reads:
  - "PLAYBOOK.md"
  - "CHANGELOG.md"
  - "references/execution-recovery.md"
  - "references/parallel-dispatch.md"
writes:
  - path: "devflow/changes/<change-key>/execution/tasks/<task-id>/checkpoint.json"
    durability: "durable"
    required: true
  - path: "devflow/changes/<change-key>/execution/tasks/<task-id>/events.jsonl"
    durability: "durable"
    required: false
    when: "debug mode is enabled or the task execution fails"
  - path: "devflow/changes/<change-key>/execution/team-state.json"
    durability: "durable"
    required: false
    when: "execution mode uses delegated or team workers"
effects:
  - "code changes"
  - "test changes"
  - "workspace scratch runtime updates"
entry_gate:
  - "Read planning/design.md or planning/analysis.md, then planning/tasks.md, planning/task-manifest.json, change-meta.json, related capability specs, and the latest checkpoint before changing code."
  - "Select only ready tasks whose dependencies and file ownership are clear."
  - "If the current task cannot be restated from canonical artifacts, run a context reset before coding."
exit_criteria:
  - "The current task has red/green evidence, review evidence, and a resumable checkpoint trail."
  - "Execution leaves the next verifier enough runtime truth to judge the task without chat memory."
  - "The honest next step is cc-check or an explicit reroute."
reroutes:
  - when: "Three failed repair attempts or new evidence show the investigation contract is wrong."
    target: "cc-investigate"
  - when: "New evidence shows the requirement design or scope contract is wrong."
    target: "cc-plan"
  - when: "Implementation and reviews are complete for the current task set."
    target: "cc-check"
recovery_modes:
  - name: "resume-from-checkpoint"
    when: "Work was interrupted but the current design contract is still valid."
    action: "Reload the latest checkpoint, rebuild task context, and continue from the last confirmed red/green/review milestone."
  - name: "context-reset"
    when: "The conversation history is noisy, stale, or cannot reproduce the exact task state."
    action: "Discard chat memory, reread planning/design.md or planning/analysis.md plus planning/tasks.md/planning/task-manifest.json and the latest checkpoint, then restate the next action before coding."
tool_budget:
  read_files: 9
  search_steps: 6
  shell_commands: 8
---

# CC-Do

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，然后检查 `CLAUDE.md`

## Role

`cc-do` 是 PDCA 里的 `Do`。

同时它也是 IDCA / DDCA 里的 `Do`。

它只做一件事：沿着已经冻结的任务，把代码真正做出来，并把执行证据留到足够让别人接手、复盘、复验。

上游冻结合同可以来自两条路：

- `cc-plan` 产出的 `planning/design.md`
- `cc-investigate` 产出的 `planning/analysis.md`

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/execution-recovery.md`
4. `references/parallel-dispatch.md`

## Use This Skill When

- 要实现 `planning/tasks.md` / `planning/task-manifest.json`
- 执行被中断，需要恢复
- bug 根因已经在 `cc-investigate` 里冻结，准备开始修
- review feedback 要落成代码

如果方案还没冻结、任务边界还没定，停下并回 `cc-plan` 或 `cc-investigate`。

## Quick Start

先判断现在是哪一种执行局面，再开始编码：

| 现实状态 | 先走什么路径 |
| --- | --- |
| 已有 ready task，直接实现 | `implement` |
| 上次做到一半，需要继续 | `resume` |
| bug 根因已冻结 | `repair-from-investigation` |
| bug 还没搞清根因 | reroute 到 `cc-investigate` |
| 收到 review comment，要在既定范围内修正 | `review-fix` |

如果连“当前 task 是什么”都说不清，先别写代码，先跑 `scripts/select-ready-tasks.sh` 和 `scripts/build-task-context.sh`。

## Harness Contract

- Allowed actions: implement ready tasks, debug inside frozen scope, write runtime evidence, and apply review feedback that does not reopen design.
- Forbidden actions: re-planning the requirement in place, blindly rerunning the whole requirement, or delegating tasks without full task context.
- Required evidence: every task must leave red/green/review checkpoints plus objective failure notes when blocked.
- Reroute rule: after repeated failed repairs or root-cause drift, stop patching and go back to `cc-investigate`; if scope or design truth breaks, go back to `cc-plan`; after task closure, hand off to `cc-check`.

## Entry Gate

1. 先读 `planning/design.md` 或 `planning/analysis.md`，再读 `planning/tasks.md`、`planning/task-manifest.json`；如果是恢复执行，再补读最近 checkpoint 或已有 `handoff/resume-index.md`。
2. 先用 `scripts/select-ready-tasks.sh` 判断现在到底哪几个任务真的 ready。
3. 只锁定当前 ready task，或一组经依赖与触点校验后可并行的 ready tasks。
4. 如果这次来自 `cc-investigate`，必须把 `planning/analysis.md` 当成 canonical contract，而不是一边实现一边重新调查。
5. 没有任务上下文，不准把任务扔给 subagent；先用 `scripts/build-task-context.sh` 从 `planning/design.md` 或 `planning/analysis.md`、`planning/tasks.md`、`planning/task-manifest.json`、`change-meta.json` 与相关 capability spec 组装上下文。

## Loop

1. 读取当前任务，而不是重新发明任务。
2. 依赖没满足前，不准提前做下游任务。
3. 没有明确并行资格，不准把多个实现任务同时推进。
4. 先 `fail-first`：先写失败测试，先看见红，再写生产代码。
5. 按 `Red -> Green -> Refactor` 推进，Green 只允许最小实现。
6. 每次推进都写 task runtime：`events.jsonl` + `checkpoint.json`。
7. 任务实现后，先过 `spec review`，再过 `code review`，两道门都过才算任务收口；这里只验证 spec delta，不回写长期 spec。
8. 当前任务完成后，把可验证证据留给 `cc-check`。

## Output

- 代码变更
- 测试变更
- `devflow/changes/<change-key>/execution/tasks/<task-id>/checkpoint.json`
- `devflow/changes/<change-key>/execution/tasks/<task-id>/events.jsonl`（仅 debug / failed 默认保留）
- `planning/task-manifest.json` 里的 task review verdict

## Good Output

- 当前 task 一眼可见，执行者不用从聊天记录里猜目标
- 至少留下一次明确的 Red/Green 证据
- runtime / checkpoint 足够让下一位接手者无损恢复
- reviewer 能顺着 review 记录和验证命令复盘这次实现

## Bundled Resources

- 变更记录：`CHANGELOG.md`
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

## Working Rules

1. 没有根因，不准修 bug。
2. 没有任务边界，不准无界发散。
3. 没有失败测试，不准写生产代码。
4. 测试如果第一次就绿，说明你没证明任何东西，先修测试。
5. 先过 `spec review`，再过 `code review`，顺序不能反。
6. 不在 `cc-do` 里改 capability spec 正文；这里只产出实现证据和 spec 对齐证据。
7. 失败和阻塞都要留下恢复证据。
8. 给 subagent 的输入必须包含：当前进度、当前任务全文、依赖状态、必读文件、验收标准、可信命令。
9. 三次失败修补后必须先质疑调查合同或设计合同，而不是继续堆补丁。

## Exit Criteria

- 当前任务有 Red/Green 证据
- 当前任务有 `spec review` / `code review` 两道门证据
- 恢复点已更新到 `devflow/changes/<change-key>/execution/tasks/<task-id>/`
- 阻塞原因已写清楚
- 下一步应进入 `cc-check`，或明确退回 `cc-investigate` / `cc-plan`

## Do Not

- 不在这里重开方案讨论
- 不把一次修复膨胀成重写整个模块
- 不把依赖任务和被依赖任务同时并行
- 不把没有当前进度的任务直接丢给 subagent
- 三层以上判断说明上游合同该回炉

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 变更记录：`CHANGELOG.md`
- 执行规则：`references/execution-recovery.md`
- 并行规则：`references/parallel-dispatch.md`
