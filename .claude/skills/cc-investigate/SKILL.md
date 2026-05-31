---
name: cc-investigate
version: 1.15.0
description: Use when broken behavior needs root-cause proof before coding resumes.
triggers:
  - 帮我查这个 bug
  - 先别修先找根因
  - debug this bug
  - investigate this regression
  - why is this broken
  - root cause this
reads:
  - PLAYBOOK.md
  - references/investigation-contract.md
  - docs/guides/project-postmortem.md
  - assets/TASKS_TEMPLATE.md
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
  - Resolve CLI, create FIX key, prepare isolated exact-case `FIX/...` worktree before writing `task.md`.
  - Reproduce the symptom or closest honest feedback loop before naming root cause.
  - Classify mode and follow `PLAYBOOK.md` plus `references/investigation-contract.md`.
  - Inspect code, logs, history, artifacts, and postmortems before solution questions.
  - Record falsifiable hypotheses; first intuition is not root cause.
exit_criteria:
  - "`task.md#Root Cause Contract` proves symptom site, first bad state, violated contract, original trigger, counterfactual proof, and escape reason."
  - "`task.md#Root Cause Contract` records mode, feedback loop, evidence chain, hypotheses, Regression Proof Contract, ASCII Branch Chain, and dialogue checkpoints when used."
  - "`task.md` contains only proven `cc-do` tasks; gaps become Evidence Request, diagnose-only, reroute, or stop."
  - "No process file beyond `task.md`; roadmap progress is synced or explicitly skipped."
  - "Investigate-stage changes are committed to Git before handoff."
reroutes:
  - when: The issue is actually missing scope, spec truth, or product direction.
    target: cc-plan
  - when: Project priority or sequencing is the real question.
    target: roadmap
  - when: Root cause and repair boundary are already frozen.
    target: cc-do
---

# CC-Investigate

`cc-investigate` 是 IDCA 的调查入口：把 bug 现象压成可执行的根因合同，再交给 `cc-do` 修。

```text
NO REPAIR WITHOUT A FROZEN ROOT-CAUSE CONTRACT
```

根因不是报错点，而是坏状态第一次被制造的地方。唯一默认输出是 `devflow/changes/<change-key>/task.md`；Git commit 是阶段历史，不另建过程文件。

## Load Table

| Need | Load |
| --- | --- |
| Investigation workflow | `PLAYBOOK.md` |
| Checklist before pause or exit | `references/checklist-contract.md` |
| Evidence flow, modes, proof ladder, Branch Chain, Socratic dialogue | `references/investigation-contract.md` |
| Repair-boundary choice needs user confirmation | `../cc-dev/references/user-choice-output-protocol.md` |
| Recurring bug or escape reason needs history | `docs/guides/project-postmortem.md` |
| Frozen root cause needs repair tasks | `assets/TASKS_TEMPLATE.md` |
| Source roadmap item exists | roadmap helper scripts |

## Flow

FIX worktree -> reproduce -> trace first bad state -> freeze `task.md#Root Cause Contract` -> commit -> route.

## Default Output

Answer with: Change, Symptom, Root cause, Repair boundary, Evidence gaps, Route (`cc-do`, `cc-plan`, `roadmap`, or `stop`).
