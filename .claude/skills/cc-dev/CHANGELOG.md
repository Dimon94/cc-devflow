# Changelog

## v1.13.0 - 2026-06-04

- dispatch parallel child threads from explicit environment boundaries in
  `PARALLEL_TASKS_TEMPLATE.md` instead of hand-assembled partial sections
- require bounded environment packets to include Env metadata, Integration
  fields, merge gates, mutable resources, and complete Red/Green/Refactor task
  blocks

## v1.12.0 - 2026-06-04

- reject compact parent `task.md` files during parallel dispatch and route them
  back to `cc-plan` for template repair before child threads start

## v1.11.0 - 2026-06-03

- require parallel dispatch to reject execution environments that only contain
  branch labels, workstream names, or prose TODOs instead of full assigned task
  blocks
- extend the child dispatch packet with a task-block completeness check so each
  child receives executable TDD task contracts

## v1.10.0 - 2026-06-02

- require Codex parallel dispatch to preflight `create_thread`, `list_threads`,
  `read_thread`, `send_message_to_thread`, and `automation_update`
- add a bundled child dispatch packet template so parallel children receive the
  full environment contract instead of ad-hoc prompts
- add a read-only child integration audit script before cherry-picking child
  commits into the orchestration branch

## v1.9.1 - 2026-06-01

- require parallel `cc-dev` closeout to audit child worktrees after delivery
  and remove only known clean, integrated, disposable worktrees
- preserve and report dirty, unknown, or unintegrated child worktrees instead
  of force-cleaning them

## v1.7.0 - 2026-05-31

- slim the main `SKILL.md` entrypoint under 100 lines so autonomous workflow startup only reads route classification, state machine, hard rules, and output shape
- keep strict review convergence, worktree discipline, delivery choice, and completion audit details in `PLAYBOOK.md` for progressive disclosure
- preserve PDCA/IDCA route selection, exact terminal states, and no-default-delivery behavior in the entrypoint

## v1.6.3 - 2026-05-28

- make PDCA strict review convergence explicit: `cc-plan` contracts must be reviewed and repaired until no P1/P2-equivalent findings remain before `cc-do`
- require PDCA review gates to cover product value, scope/non-goals, interface and data contract, abstraction boundary, task slicing, test seam, verification path, overengineering risk, and release assumptions

## v1.6.2 - 2026-05-28

- make IDCA strict review convergence explicit: `cc-investigate` root-cause contracts must be reviewed and repaired until no P1/P2-equivalent findings remain before `cc-do`
- require IDCA review gates to cover reproduction truth, failure ownership, repair boundary, regression proof, blast radius, and reroute assumptions

## v1.6.1 - 2026-05-28

- clarify that `cc-dev` does not choose final delivery by default; after `cc-check`, it routes to `cc-act` for an explicit user-selected delivery mode
- keep `local-main-merge` and remote PR as sibling `cc-act` delivery choices instead of biasing `cc-dev` toward either route

## v1.6.0 - 2026-05-28

- add strict `cc-review` convergence mode for user-requested multi-round/subAgent review gates, repeating plan/investigation and implementation reviews until no P1/P2-equivalent findings remain
- require strict implementation review loops to respect `cc-review` repair-choice protocol and stop as `needs-clarification` when product, architecture, scope, or risk tradeoffs need user selection
- route explicit local `main` merge requests to `cc-act` `local-main-merge` mode with rebase, fast-forward merge, containing-commit, and no-push evidence

## v1.5.1 - 2026-05-24

- add `cc-review` as an explicit optional gate inside autonomous PDCA/IDCA so complex or high-risk plans, investigations, and implementations are reviewed before continuing
- require skipped review gates to record concrete low-risk reasons in the stage audit instead of relying on agent memory

## v1.5.0 - 2026-05-22

- add `detect-worktree-state.sh` as the standalone read-only preflight for primary, linked, submodule, detached, and branch-state truth
- make `prepare-change-worktree.sh` consume the detector and fail closed when called from the wrong linked worktree

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
