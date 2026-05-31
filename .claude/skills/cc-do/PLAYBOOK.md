# CC-Do Playbook

## State Machine

`cc-plan | cc-investigate -> cc-do -> cc-check`

`cc-do` edits code. It does not create process files.

## Task Gates

1. Task selected from `task.md`
2. Task shape checked: one behavior, public seam, suite layer/runtime, proof value, mock boundary, Green minimality
3. Red observed for the expected behavior or TDD exception recorded
4. Green observed with minimal production change
5. Refactor complete or explicitly unnecessary
6. Verification run
7. `mark-task-complete.sh` updates `task.md`
8. Git commit created

## Execution Loop

1. Select the first unchecked task whose dependencies are satisfied; use `scripts/select-ready-tasks.sh` when readiness is unclear.
2. Read only the current task's necessary code, tests, callers, exports, helpers, and prior evidence.
3. Red: write the smallest failing test and verify the failure is the missing behavior.
4. Green: implement the minimum production change; do not pre-build future branches.
5. Refactor: clean only the smell exposed by the current slice while tests stay green.
6. Review: check scope, public seam, mock boundary, fixture honesty, error path, and docs impact.
7. Complete: run `scripts/mark-task-complete.sh --tasks devflow/changes/<change-key>/task.md --task <task-id>`.
8. Commit the completed task or execution environment.

## TDD Gates

- No production code before an expected failing test unless the task records a TDD exception.
- Red must fail because the target behavior is missing, not because of syntax, fixture, or mock mistakes.
- Red must enter through a public seam; private implementation tests do not unlock Green.
- Red must carry confidence per minute: name the suite layer, expected command/runtime, and the real bug, regression, or user-visible failure it would catch.
- Broad snapshots, duplicate happy paths, no-op smoke tests, brittle internal assertions, and overmocked self-modules do not unlock Green.
- Green must satisfy only the current Red.
- Refactor happens only after Green and stays inside the current slice.
- Fixture shortcuts and boundary mocks must not hide input contract problems.

## Execution Discipline

- Execution quality lives in the current task block, completion evidence, final response, and Git commit.
- One Red proves one logical behavior. Bulk Reds, implementation-step test names, and internal state checks require test redesign.
- Mocks belong only at system boundaries: external API, time, randomness, filesystem, network, or required database seams. Mocking owned modules is a seam warning.
- Fixtures must be honest. Partial fixtures, casts, generated stubs, and missing-field payloads must name the real contract fields and the filled test-only fields.
- New interfaces should be small and deep. Pass dependencies from callers; prefer concrete boundary operations over generic catch-all adapters.
- Three failed patch attempts against the same task mean question `Root Cause Contract` or `Contract Summary`, then reroute to `cc-investigate` or `cc-plan`.
- If the completion script fails, fix missing evidence, dependency metadata, or task block shape; do not hand-edit checkboxes.

## Vertical Red/Green Guard

The execution unit is one observable behavior: finish the current Red -> Green -> Refactor cycle before starting the next behavior.

- Reject horizontal batches: do not write several Reds, then several Greens.
- Do not pre-build future behavior while making the current Red pass.
- If the next behavior needs a different seam, fixture, mock boundary, or task
  split, stop and update the current task evidence before continuing.
- If a task cannot be reduced to one observable behavior, reroute to `cc-plan`
  to split it before implementation continues.

## Recovery

Recover from Git and `task.md`:

- current branch
- latest commits
- dirty files
- completed checkboxes
- next unchecked task

Do not recover from process files. Only `task.md`, Git, and current repo truth count.

## Failure Ledger

`task.md#Failure Ledger` is现场 evidence, not the postmortem. Record only real execution failures:

- Rework: same task needs reimplementation, rerun, or path change.
- Reroute: current evidence disproves plan, root cause, or verification boundary.
- Misread: green tests did not prove behavior, stale output looked current, or review missed real risk.
- Tool, Git, or release failure: command, permission, dependency, branch, or release failure changes the execution conclusion.
- User correction: the user points out a wrong judgment, scope, or implementation direction.

Each entry is `FL-###` with symptom, evidence, attempted fix, result, and lesson candidate. Start `Status` as `unreviewed`; default `Keep for postmortem` to `no`.

## Parallel Rule

Parallelize only when the task explicitly allows it, dependencies are satisfied, touched paths do not overlap, and each execution environment can commit independently. Otherwise stay serial.

## Reroute Triggers

- New evidence disproves root cause: `cc-investigate`
- New evidence breaks scope, interface, or task contract: `cc-plan`
- Repeated patch attempts fail after the same task: stop and reroute
- Review feedback exceeds frozen scope: `cc-plan`

## Commit Rule

Every completed task or execution environment gets its own commit. Split by behavior or layer when needed, but do not leave completed work uncommitted between stages.

## Handoff

Exit with task ID, observable behavior, Red evidence, Green evidence, refactor note or exception, verification command/status, commit hash or reason absent, and next route.
