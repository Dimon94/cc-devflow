---
name: cc-do
version: 1.11.2
description: Use when executing frozen task.md work inside approved scope.
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
  - ../cc-dev/references/domain-context-contract.md
  - ../workflow-chain-contract/SKILL.md
  - references/git-commit-guidelines.md
  - references/checklist-contract.md
  - ../task-contract/SKILL.md
  - scripts/select-ready-tasks.sh
  - scripts/mark-task-complete.sh
  - scripts/check-task-status.sh
  - scripts/detect-file-conflicts.sh
  - scripts/cc-do-common.sh
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
  - Resolve CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require config`.
  - Read `task.md`, Git status, and only code/tests needed by the current task.
  - Read relevant `CONTEXT.md`, `CONTEXT-MAP.md`, and ADRs through `../cc-dev/references/domain-context-contract.md` before editing.
  - Reject execution if the task cannot be restated from `task.md` and repo evidence.
  - Validate execution shape: Red name, one behavior, public seam, suite/runtime, proof value, mock boundary, Green minimality, refactor candidate.
  - When invoked from parallel orchestration, accept exactly one execution environment or dispatch packet; do not inspect or update sibling environments except dependency status.
exit_criteria:
  - Current task has Red/Green evidence or recorded TDD exception in `task.md`.
  - Red proves one target behavior through a public seam with real proof value; Green stays minimal.
  - Low-value Red evidence is rewritten, rejected, or routed back to `cc-plan`.
  - Refactor evidence names the smell removed or says why no refactor was needed.
  - Real failures and reroutes are recorded in `task.md#Failure Ledger`.
  - "Domain context growth was checked after execution evidence; confirmed updates were written to `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/*.md`, while deferred updates were recorded in `task.md` when they affect the current slice."
  - Verification commands ran or are explicitly blocked.
  - Task status is updated through `scripts/mark-task-complete.sh`.
  - Completed task/environment is committed to Git.
  - Completed task/environment commits follow `references/git-commit-guidelines.md`.
  - Parallel child final report includes environment ID, commit, verification, dirty state, touched files, blockers, and route recommendation.
  - No process file beyond `task.md` updates and Git commits.
reroutes:
  - when: New evidence disproves root cause.
    target: cc-diagnose
  - when: New evidence breaks scope or design.
    target: cc-plan
  - when: Implementation and review feedback are complete.
    target: cc-check
---

# CC-Do

`cc-do` 只执行 `task.md` 已冻结的任务，不重新规划。Bug 热修默认先走 `cc-diagnose`，只有已经写成 `task.md` 的修复任务才进入这里。

默认只更新代码、测试、`task.md` 任务状态和 Git commit。不要生成额外过程文件。

在并行编排中，`cc-do` 是 child executor，不是 orchestrator。它只执行收到的一个 execution environment，提交该环境的 verified commit，并把解锁、cherry-pick、phase gate 和最终 `cc-check` 留给主控 `cc-dev`。

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

允许例外：纯配置、纯生成文件、throwaway prototype、用户明确禁止测试。例外必须写进当前 task block。

## Load Table

| Need | Load |
| --- | --- |
| Execution loop, TDD gates, Failure Ledger, parallel rule | `PLAYBOOK.md` |
| Resume or interrupted work | `references/execution-recovery.md` |
| Checklist before pause or exit | `references/checklist-contract.md` |
| Domain language, context map, or ADR discipline | `../cc-dev/references/domain-context-contract.md` |
| Task explicitly allows parallel execution | `references/parallel-dispatch.md` |
| Recurring execution failure | `docs/guides/project-postmortem.md` |

## Flow

select ready task -> Red -> Green -> Refactor -> verify -> `mark-task-complete.sh` -> commit -> next task or `cc-check`.

## Default Output

Answer with: Task, TDD, Verification, Commit, Route (next task, `cc-check`, `cc-plan`, `cc-diagnose`, or `stop`).
