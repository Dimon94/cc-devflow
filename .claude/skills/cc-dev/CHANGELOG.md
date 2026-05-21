# Changelog

## v1.4.0 - 2026-05-21

- route ambiguous PDCA/IDCA and terminal-state choices through the shared user-choice output protocol instead of plain blocking prose
- keep open-ended clarification as a normal blocking question, but require structured choice UI whenever the user is choosing between routes

## v1.3.0 - 2026-05-18

- add a Default Output contract for terminal audits across PDCA, IDCA, resume, PR, and handoff routes

## 1.2.0

- add a stage-transition checklist contract so autonomous PDCA/IDCA pauses on branch, task, Git, verification, and PR truth before each route hop

## 1.1.3

- add `prepare-change-worktree.sh` so new REQ/FIX work starts in an isolated worktree while the main checkout stays on `main`
- make cc-dev route lower-level stages into the returned `WORKTREE_PATH` before durable artifacts are written

## 1.1.2

- make the resolver live-probe `workflow-context` so stale CLIs that still ask for manifest or planning process files are rejected

## 1.1.1

- simplify the autopilot state contract around `task.md`, Git, and PR/handoff reality
- remove old process-file filename lists from cc-dev recovery wording

## 1.0.3

- add the shared `resolve-cc-devflow.sh` CLI resolver for PDCA/IDCA stage transitions
- require capability-checked `query workflow-context`, `task-contract`, `next-change-key`, and `review` support before trusting workflow commands
- make old global CLIs and adapter-only entrypoints blockers instead of letting agents compensate with handwritten machine artifacts

## 1.0.2

- internalize operating discipline at the PDCA/IDCA loop level: state assumptions, route interpretation, success criteria, stop conditions, and token checkpoint risk before lower-level action
- make budget pressure, skipped gates, stale evidence, and ambiguous success blockers instead of terminal success

## 1.0.1

- Added `workflow-context` as the context index so cc-dev can drive PDCA/IDCA without reloading the whole loop history each step.
- Required every post-planning stage transition to follow the query's `nextAction`, `mustNotForget`, `sourceHashes`, `defaultOpen`, and `openWhen.conditions` fields.

## 1.0.0

- Added goal-style PDCA/IDCA development autopilot that drives current-worktree work to a remote PR without merging.
