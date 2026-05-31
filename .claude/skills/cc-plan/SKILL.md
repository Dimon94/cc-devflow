---
name: cc-plan
version: 3.19.0
description: Use when scope, design, and executable tasks must be frozen before coding.
triggers:
  - 帮我规划这个需求
  - 先别写代码先定方案
  - 这个 bug 边界不清
  - 拆一下任务
  - plan this requirement
  - scope this bug
  - turn this into tasks
reads:
  - PLAYBOOK.md
  - assets/TASKS_TEMPLATE.md
  - references/planning-contract.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - ../cc-dev/scripts/detect-worktree-state.sh
  - ../cc-dev/scripts/prepare-change-worktree.sh
  - ../cc-dev/scripts/ensure-work-branch.sh
  - ../cc-roadmap/scripts/locate-roadmap-item.sh
  - ../cc-roadmap/scripts/sync-roadmap-progress.sh
  - ../cc-dev/references/user-choice-output-protocol.md
  - references/checklist-contract.md
writes:
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: true
entry_gate:
  - Resolve CLI, assign REQ/FIX key, prepare isolated exact-case worktree before writing `task.md`.
  - Read roadmap handoff, specs, relevant code/tests/docs, recent commits, and existing task truth before asking.
  - Run planning flow and Socratic dialogue before task generation.
  - Ask D<N> decision questions only when the answer changes scope, design, boundary, task split, or verification.
  - Use host-native structured choice via `../cc-dev/references/user-choice-output-protocol.md` when decisions need user input.
exit_criteria:
  - "`task.md#Contract Summary` records approved solution, non-goals, decisions, branch, stories, planning flow, review gate, verification, assumptions, test strategy, ASCII Branch Chain, and dialogue checkpoints when used."
  - "`task.md` contains executable task blocks from `assets/TASKS_TEMPLATE.md`."
  - "Non-trivial plans complete product/creative discovery, Second-Move Review, Design Pressure, and explicit user release before task generation."
  - "D<N> decisions that changed the plan are recorded in `task.md`."
  - "No process file beyond `task.md`; roadmap progress is synced or explicitly skipped."
  - "Plan-stage changes are committed to Git before handoff."
reroutes:
  - when: The discussion is still project direction or stage order instead of one requirement.
    target: roadmap
  - when: The plan is already approved and tasks are frozen.
    target: cc-do
---

# CC-Plan

`cc-plan` 是 PDCA 的 Plan：把需求压成一份可执行任务合同，再交给 `cc-do`。

唯一默认输出是 `devflow/changes/<change-key>/task.md`。Git commit 是阶段历史，不另建过程文件。

## Load Table

| Need | Load |
| --- | --- |
| Planning workflow and setup | `PLAYBOOK.md` |
| Checklist before pause or exit | `references/checklist-contract.md` |
| Planning flow, Decision Questions, Design Pressure, Branch Chain | `references/planning-contract.md` |
| User-facing decision choice | `../cc-dev/references/user-choice-output-protocol.md` |
| Approved plan needs task blocks | `assets/TASKS_TEMPLATE.md` |
| Source roadmap item exists | roadmap helper scripts |

## Flow

REQ/FIX worktree -> repo evidence -> planning flow -> decision questions -> user release -> task blocks -> commit -> route.

```bash
DEVFLOW=".claude/skills/cc-dev/scripts/resolve-cc-devflow.sh"
bash "$DEVFLOW" config resolve --format policy
```

## Default Output

Answer with: Change, Scope, Tasks, Verification, Roadmap sync, Route (`cc-do`, `cc-investigate`, `roadmap`, or `stop`).
