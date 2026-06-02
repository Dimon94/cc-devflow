# CC-Do Skill Changelog

## v1.11.2 - 2026-06-02

- list the task selection, completion, status, conflict detection, and shared
  helper scripts in skill metadata so execution agents can discover the scripts
  already required by the `cc-do` contract

## v1.11.1 - 2026-05-31

- add the shared Domain Context Contract so execution reads relevant
  `CONTEXT.md`, `CONTEXT-MAP.md`, and ADRs before editing
- require execution closeout to propose context growth only when implementation
  evidence proves durable language or ADR truth wrong or incomplete

## v1.11.0 - 2026-05-31

- slim the entrypoint to the Do purpose, TDD iron law, load table, core flow, and default output
- move the execution loop, detailed TDD discipline, Failure Ledger rules, parallel rule, and handoff details into `PLAYBOOK.md`
- keep interrupted-work recovery in `references/execution-recovery.md` so the entrypoint stays fast without weakening resume safety

## v1.10.2 - 2026-05-31

- add a Vertical Red/Green Guard so execution finishes one observable behavior's Red -> Green -> Refactor cycle before starting the next behavior
- reject horizontal Red/Green batches and reroute oversized tasks back to `cc-plan` for splitting

## v1.10.1 - 2026-05-23

- require task preflight to validate suite layer, runtime expectation, and confidence-per-minute proof value before coding
- reject low-value Red evidence such as broad snapshots, duplicate happy paths, no-op smoke tests, brittle internal assertions, and overmocked implementation details
- update the checklist and playbook so Green cannot start until Red proves a real bug, regression, or user-visible failure through a public seam

## v1.10.0 - 2026-05-20

- require real rework, reroutes, stale validation, wrong-file touches, repeated tool failures, and user corrections to be recorded in `task.md#Failure Ledger`
- keep the ledger as现场 evidence for `cc-check` and `cc-act` instead of creating separate execution reports

## v1.9.0 - 2026-05-18

- add a fixed Default Output contract for task execution, TDD evidence, verification, commit, and next route

## v1.8.0 - 2026-05-18

- add an execution-specific checklist contract for task preflight, Red/Green evidence, refactor proof, completion script use, verification, and task commit

## v1.7.2 - 2026-05-14

- restore the execution discipline that was over-pruned during artifact minimization: tracer-bullet TDD, public seam Red evidence, mock/fixture honesty, Green minimality, refactor-after-green, and repeated-failure reroutes
- keep execution proof in `task.md`, command output, final response, and Git commits instead of reviving per-task process files
- strengthen recovery rules so stale chat memory and manual checkbox edits cannot substitute for task evidence

## v1.7.1 - 2026-05-13

- simplify execution recovery so state comes from `task.md`, Git, and current repo truth
- remove old event/status/checkpoint filename lists from the default execution contract

## v1.6.9 - 2026-05-13

- require the shared `resolve-cc-devflow.sh` CLI resolver before loading workflow context or review state
- block execution when the available CLI lacks `query workflow-context`, `task-contract`, or `review`
- make old adapter logs and handwritten task-status JSON invalid substitutes for current machine artifact truth

## v1.6.8 - 2026-05-13

- internalize execution operating rules so `cc-do` reads callers/exports/helpers before editing, keeps diffs surgical, matches repo conventions, and fails loudly on blockers
- require deterministic task-state updates through scripts while keeping tests focused on behavior intent through public seams
- retarget execution recovery to `planning/tasks.md` plus generated machine artifacts, with legacy design/analysis as fallback only

## v1.6.7 - 2026-05-13

- stop generating per-task `context.md` and `checkpoint.json` during execution; `build-task-context.sh` now prints stdout only
- make task recovery read code, Git state, `planning/tasks.md`, `task-manifest.json`, review verdicts, and CLI logs instead of AI-written process files
- keep `events.jsonl` as an optional CLI log for debug or failure paths, not a default narrative artifact

## v1.6.6 - 2026-05-12

- make `cc-devflow query workflow-context` the first execution context reset so `cc-do` reads compact task truth before opening full planning artifacts
- route ready-task, trusted-command, and deep-open decisions through the runtime packet instead of chat memory
- keep `select-ready-tasks.sh` and `build-task-context.sh` as deeper recovery tools rather than the default context load

## v1.6.5 - 2026-05-11

- require a per-task Project Postmortem quick search before execution touches code
- record postmortem recall results in checkpoint/events so recurring model and engineering failures become task guardrails
- update the execution loop to open matching incident prevention summaries and Git evidence before Red/Green work starts

## v1.6.4 - 2026-05-11

- stop writing derived top-level `task-manifest.json.status`; task completion is owned by `tasks[].status` and aggregate state is derived
- read capability/spec handoff from `change-meta.json` first when building task context, keeping spec sync state out of task manifests

## v1.6.3 - 2026-05-10

- require task completion to go through `scripts/mark-task-complete.sh` instead of manual checkbox or manifest edits
- add a ClaudeCode / Codex task status protocol so execution reads full task blocks and advances `currentTaskId` through scripts
- document failure behavior when the completion script rejects missing checkpoint or review-gate evidence

## v1.6.2 - 2026-05-06

- absorb the external TDD skill's execution details into native `cc-do`: spec-style test names, one logical behavior per Red, and public verification paths
- strengthen Green evidence with minimality guards so implementation does not pre-build future unproven behavior
- expand checkpoint recovery fields with interface-testability proof and concrete refactor candidates such as duplication, long methods, shallow modules, feature envy, primitive obsession, naming, and nested branches

## v1.6.1 - 2026-04-29

- reject parent/child touched-path overlaps when selecting parallel execution surfaces
- report submodule touches separately so unrelated tasks are not serialized by mere `.gitmodules` presence
- document quick-lane and wave scheduling gates so small tasks still leave checkpoint, verification, and handoff truth

## v1.6.0 - 2026-04-28

- prohibit horizontal TDD execution by requiring one tracer bullet Red/Green/Refactor cycle per observable behavior
- add test fixture discipline so partial fixtures, type assertions, generated stubs, and mocks must preserve public seam behavior
- require checkpoints to record fixture risk when test data shortcuts could hide a seam or contract problem

## v1.5.3 - 2026-04-28

- require Red evidence to prove behavior through a public seam instead of private methods, internal call counts, or implementation-shaped tests
- add mock-boundary and test-quality gates to the TDD execution contract so internal collaborators are not mocked as fake proof
- allow `write-task-checkpoint.sh --tdd-json` and runtime checkpoint schema to preserve structured TDD evidence for recovery and review

## v1.5.2 - 2026-04-27

- require execution evidence that adds human-readable summaries to resolve the runtime output policy first
- record `Output language` as the machine-enforced language contract while treating `agent_preferences` as advisory style input

## v1.5.1 - 2026-04-25

- remove external tool provenance from the public skill contract so test-first execution reads as native `cc-do` behavior
- keep the Red/Green/Refactor iron law and exception checkpoint contract unchanged

## v1.5.0 - 2026-04-24

- add test-first execution to the `cc-do` contract with an explicit `NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST` rule
- require Red failure reason verification, post-refactor Green evidence, and checkpoint fields that make TDD proof resumable
- add a narrow TDD exception contract so prototypes, generated files, and config-only changes cannot silently bypass test-first execution

Migration note:

- new task checkpoints should record `red`, `green`, `refactor`, and optional `tddException` fields before `cc-check` verifies the task

## v1.4.0 - 2026-04-19

- require `cc-do` to load `change-meta.json` and related capability specs before coding so execution stops guessing long-term constraints
- extend `build-task-context.sh` with primary capability, spec files, expected spec delta, and sync status
- make the execution contract explicit that `cc-do` validates spec alignment but does not mutate long-term spec truth

Migration note:

- new execution contexts should include `change-meta.json` beside `design.md` / `analysis.md`

## v1.3.1 - 2026-04-18

- replace GNU `sed` usage in `scripts/mark-task-complete.sh` with a portable `awk` implementation so task completion works on macOS BSD userlands

## v1.3.0 - 2026-04-17

- split root-cause investigation out of `cc-do` so bug execution now expects a frozen `ANALYSIS.md` handoff from `cc-investigate`
- teach `cc-do` to accept either `DESIGN.md` or `ANALYSIS.md` as the upstream contract
- clarify reroutes so repeated failed bug repairs return to `cc-investigate`, while true scope drift still returns to `cc-plan`

## v1.2.0 - 2026-04-17

- add structured frontmatter contract fields for reads, writes, reroutes, recovery, and tool budget
- add `Harness Contract` and `Visible State Machine` so execution boundaries are visible in the skill pack itself
- strengthen context reset and local recovery guidance to prefer checkpoint reload over chat-memory continuation

## v1.1.0 - 2026-04-15

- add `version` frontmatter and semver tracking
- add stronger trigger phrases in frontmatter
- add `Quick Start` to classify execution into implement / resume / cc-investigate-first / review-fix
- add `Good Output` so execution leaves clear recovery and verification evidence
