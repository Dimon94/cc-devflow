---
name: cc-do
version: 1.10.2
description: Use when implementing frozen tasks, resuming interrupted work, applying an investigation handoff, or fixing review feedback inside the approved scope.
triggers:
  - 开始做 T003
  - 继续上次做到一半的任务
  - 按 task.md 开始实现
  - 修这个 review comment
  - implement this task
  - resume this requirement
reads:
  - PLAYBOOK.md
  - references/execution-recovery.md
  - references/parallel-dispatch.md
  - docs/guides/project-postmortem.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - references/checklist-contract.md
writes:
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: true
    when: task checkbox/status changes or Failure Ledger records real execution failure
effects:
  - code changes
  - test changes
  - Git commit after each completed execution environment or task slice
entry_gate:
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require config`.
  - Read `task.md`, current Git status, and only the code/tests needed by the current task.
  - Reject execution if the task cannot be restated from `task.md` and repo evidence.
  - Validate the task's execution shape before coding: Red test name, one observable behavior, suite layer/runtime, confidence-per-minute proof value, public verification path, allowed boundary mocks, Green minimality guard, and refactor candidates.
exit_criteria:
  - Current task has Red/Green evidence or a recorded TDD exception in `task.md`.
  - Red evidence proves the target behavior through a public seam and has real proof value for the named bug, regression, or user-visible failure; Green evidence is minimal and does not pre-build future behavior.
  - Low-value tests such as broad snapshots, duplicate happy paths, no-op smoke tests, brittle implementation assertions, or overmocked internals are rewritten, rejected as Red evidence, or explicitly routed back to `cc-plan`.
  - Refactor evidence names the smell removed or states why no refactor was needed.
  - Real failures, reroutes, disproven assumptions, stale validation, wrong-file touches, repeated tool failures, and user-corrected misses are recorded in `task.md#Failure Ledger`.
  - Verification commands have been run or explicitly blocked.
  - Task status is updated through `scripts/mark-task-complete.sh`.
  - The completed task/environment is committed to Git.
  - No process file is created beyond `task.md` updates and Git commits.
reroutes:
  - when: New evidence disproves root cause.
    target: cc-investigate
  - when: New evidence breaks scope or design.
    target: cc-plan
  - when: Implementation and review feedback are complete.
    target: cc-check
tool_budget:
  read_files: 9
  search_steps: 6
  shell_commands: 8
---

# CC-Do

## Read First

1. `references/checklist-contract.md`

`cc-do` 是 PDCA / IDCA 的 `Do`。它只执行 `task.md` 中已经冻结的任务。

默认只更新：

- 代码和测试
- `devflow/changes/<change-key>/task.md` 中的任务状态
- Git commit

不要生成额外过程文件。真实失败先写进 `task.md#Failure Ledger`，阻塞仍写在对用户的响应里；需要长期保留的失败教训交给 `cc-act` 压缩成 incident postmortem。

## TDD Iron Law

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

允许例外：纯配置、纯生成文件、throwaway prototype、用户明确禁止测试。例外必须写进当前 task block。

## Loop

1. 从 `task.md` 选择第一个未完成且依赖满足的任务；必要时用 `scripts/select-ready-tasks.sh` 复核。
2. 读取当前任务涉及的最小代码和测试。
3. Red：写最小失败测试，确认失败原因就是目标行为缺失。
4. Green：写最小实现，不预铺未来分支。
5. Refactor：只清理当前 slice 暴露出的坏味道，保持测试绿。
6. Review：自查 scope、公共 seam、mock 边界、错误路径和文档影响。
7. Complete：运行 `scripts/mark-task-complete.sh --tasks devflow/changes/<change-key>/task.md --task <task-id>`。
8. Commit：每个任务或执行环境完成后提交 Git commit。

## Execution Discipline

执行质量写进 `task.md` 的当前 task block、完成证据、最终回复和 Git commit，不写额外过程文件。

1. 每次只推进一个 tracer bullet：一个用户可观察行为的 Red -> Green -> Refactor。
2. Red 必须从公共接口、调用方流程、CLI/API/UI 路径或真实边界进入系统；私有函数、内部调用次数、临时结构断言不算 Red 证据。
3. 一个 Red 只证明一个逻辑行为；bulk Red、实现步骤式测试名、直接查内部状态都要先修测试设计。
4. Mock 只能放在系统边界：外部 API、时间、随机性、文件系统、网络或必要数据库边界；mock 自家模块默认说明 seam 有问题。
5. Fixture 必须诚实：partial fixture、cast、generated stub、缺字段 payload 都要说明真实 contract 字段和测试填充字段。
6. Red 必须说明 confidence-per-minute：suite layer、预计命令/耗时、会抓住哪个真实 bug / regression / 用户可见失败。只证明实现细节、快照漂移、重复 happy path 或 no-op smoke 的测试不能解锁 Green。
7. Green 只写当前红灯要求的最小实现；新增接口优先小而深，依赖从调用方传入，边界 adapter 用具体操作而不是 generic catch-all。
8. Refactor 只能在 Green 后做，只清理当前 slice 暴露出的重复、命名、浅模块、长方法、feature envy、primitive obsession、错误处理或三层以上分支。
9. 三次修补仍失败时，先质疑 `Root Cause Contract` 或 `Contract Summary`，reroute 到 `cc-investigate` / `cc-plan`，不要继续堆补丁。
10. 完成脚本失败时，修缺失证据、依赖或 task block，不手改 checkbox 绕过。

## Failure Ledger

`task.md#Failure Ledger` 是现场记录，不是尸检报告。只记录已经发生的失败资产：

- 返工：同一任务需要重新实现、重跑或重选路径。
- Reroute：当前证据推翻计划、根因或验证边界。
- 误判：测试绿但行为不对、旧输出被误当新证据、review 漏掉实际风险。
- 工具 / Git / 发布异常：影响本次执行结论的命令、权限、依赖、分支或发布失败。
- 用户纠偏：用户指出 agent 的判断、范围或实现方向明显错误。

每条记录写成 `FL-###`，包含 symptom、evidence、attempted fix、result、lesson candidate。先把 `Status` 设为 `unreviewed`，`Keep for postmortem` 默认为 `no`；不要在执行阶段把临时噪音升级成长期教训。

## Parallel Rule

只有任务显式允许并行、依赖已满足、触碰路径无重叠、且每个执行环境都能独立提交时，才并行。否则串行。

## Exit

退出时报告任务 ID、验证命令、commit hash、剩余任务或下一步 `cc-check`。不要写过程文件。


## Default Output

When pausing or finishing a task, report only:

1. Task: task ID and observable behavior completed.
2. TDD: Red evidence, Green evidence, and refactor note or recorded exception.
3. Verification: command, exit status, and claim proven or blocker.
4. Commit: commit hash or explicit reason no commit exists.
5. Route: next task, `cc-check`, `cc-plan`, `cc-investigate`, or `stop`.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.
