# cc-do Checklist Contract

## Diagnosis

Execution mistakes are usually skipped basics: wrong task, private seam tests, manual checkbox edits, stale verification, or missing commit.

## Checklist Mode

- Mode: read-do
- Evidence sink: `task.md`, changed code/tests, verification output, and task-slice commit
- Failure route: `cc-check` when done, `cc-plan` for scope drift, `cc-investigate` for disproven root cause, or stop

## Pause Points

1. Before editing: identify the one task, allowed files, public seam, and verification command.
2. Before marking complete: confirm Red/Green/refactor evidence and completion script output.
3. Before exit: commit the task/environment and name the next route.

## Required Checks

- [ ] current task can be restated from `task.md` and repo evidence
- [ ] Red test name, public seam, behavior, suite layer/runtime, proof value, mock boundary, Green minimality guard, and refactor candidate are known
- [ ] Red evidence fails for the intended behavior before Green when TDD applies, and would catch a real bug/regression/user-visible failure rather than only a snapshot, duplicate happy path, no-op smoke, internal call-count, or overmocked implementation detail
- [ ] task status is updated through `scripts/mark-task-complete.sh`, not manual checkbox editing
- [ ] verification ran or blocker is explicit and the completed slice is committed

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
