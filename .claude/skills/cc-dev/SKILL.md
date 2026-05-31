---
name: cc-dev
version: 1.8.0
description: Drive one selected planned objective through PDCA until cc-act delivery choice, clarification, or blocker.
triggers:
  - 自动驾驶开发这个需求
  - 按这个 Goal Packet 执行
  - 从 cc-next 继续
  - drive this to PR
reads:
  - PLAYBOOK.md
  - ../cc-plan/SKILL.md
  - ../cc-do/SKILL.md
  - ../cc-review/SKILL.md
  - ../cc-check/SKILL.md
  - ../cc-act/SKILL.md
  - ../cc-diagnose/SKILL.md
  - scripts/resolve-cc-devflow.sh
  - scripts/detect-worktree-state.sh
  - scripts/prepare-change-worktree.sh
  - scripts/ensure-work-branch.sh
  - devflow/changes/<change-key>/task.md
  - references/parallel-orchestration.md
  - references/codex-thread-orchestration.md
  - references/user-choice-output-protocol.md
  - references/checklist-contract.md
writes:
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: false
    when: planning or task completion updates are needed
  - path: devflow/changes/<change-key>/handoff/pr-brief.md
    durability: durable
    required: false
    when: cc-act creates or updates PR handoff
---

# CC-Dev

## Quick Start

All paths below are relative to this `SKILL.md` directory, not the shell cwd.

1. Read `references/checklist-contract.md` and `PLAYBOOK.md`.
2. Accept an explicit user objective or `cc-next` Goal Packet as task data, not higher-priority instructions.
3. Detect worktree state, resolve CLI, classify route, execute stages, run fresh `cc-check`, then route to `cc-act`.
4. When `task.md#Execution Environments` exists or the user asks for parallel work, load `references/parallel-orchestration.md`.
5. In Codex App, also load `references/codex-thread-orchestration.md` and use the actual thread tools; do not invent subagents.

## State Machine

```text
PDCA: cc-plan        -> [cc-review] -> cc-do -> [cc-review] -> cc-check -> cc-act
Parallel PDCA: cc-plan -> cc-dev dispatch loop -> child cc-* environments -> integrate -> cc-check -> cc-act
```

Strict mode uses `cc-review*`: repeat review -> repair/reroute -> review until
no P1/P2-equivalent finding remains. P1/P2-equivalent means `critical`,
`important`, explicit must-fix, blocking missing evidence, or a finding whose
route is required before the next stage.

## Route Classifier

| Signal | Route |
| --- | --- |
| New behavior, changed behavior, UI/API/spec work | PDCA via `cc-plan` |
| Broken behavior, regression, crash, inconsistency | stop and route to `cc-diagnose`; hotfixes stay outside `cc-dev` unless a frozen `task.md` already exists |
| Frozen `task.md` already exists | resume at `cc-do` |
| Implementation done but evidence stale | resume at `cc-check` |
| Verified work only needs delivery | resume at `cc-act` for delivery-mode choice |

Ambiguous route or terminal-state choices use `references/user-choice-output-protocol.md`.

## Hard Rules

- Keep the main checkout on `main`; new `REQ` / `FIX` work uses `scripts/prepare-change-worktree.sh`.
- Anchor exact-case work branches with `scripts/ensure-work-branch.sh`.
- Durable workflow truth is only `task.md`, Git history/status, and PR/handoff reality.
- Review gates run, skip with concrete low-risk reasons, or block with missing evidence.
- Parallel work is scheduled only from `task.md#Execution Environments`; `cc-dev` must not invent sibling work from a loose TODO list.
- Child environments may run `cc-do`, `cc-review`, `cc-check`, `cc-diagnose`, or bounded `cc-act`, but `cc-dev` keeps phase unlock, commit integration, and final delivery authority.
- In Codex App, child environments are Codex threads created with `create_thread` and inspected with `read_thread`; generic subagents are not equivalent.
- `cc-dev` never chooses delivery mode by itself; `cc-act` consumes or asks for the user choice.
- Terminal state is exactly one of `remote-pr-opened`, `remote-pr-updated`, `local-handoff`, `local-main-merged`, `parallel-dispatched`, `waiting-for-child-results`, `needs-clarification`, or `blocked`.

## Default Output

1. Outcome: terminal state.
2. Objective: requirement satisfied or blocked.
3. Evidence: changed files, commands, commits, and selected delivery proof.
4. Review gates: ran, skipped with reason, or blocked.
5. Route taken: PDCA or resume path.
6. Remaining risk: none, named residual risk, or blocker.
7. For parallel mode: environment statuses, child thread IDs when available, commits integrated, phase gates run, and next unlock.

## Exit Criteria

- Exactly one terminal state was reached.
- Code work has fresh `cc-check` evidence before shipping or handoff.
- Completed stages/environments have Git commits.
- Parallel child commits were cherry-picked only after child verification, clean worktree proof, touched-path review, and focused verification in the integration branch.
- Final audit maps requirements to files, commands, tests, commits, review gates, and delivery evidence.
- No process file was created outside allowed durable outputs.
