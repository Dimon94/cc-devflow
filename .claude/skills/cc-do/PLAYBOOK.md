# CC-Do Playbook

## State Machine

`cc-plan | cc-investigate -> cc-do -> cc-check`

`cc-do` edits code. It does not create process files.

## Task Gates

1. Task selected from `task.md`
2. Task shape checked: one behavior, public seam, mock boundary, Green minimality
3. Red observed for the expected behavior or TDD exception recorded
4. Green observed with minimal production change
5. Refactor complete or explicitly unnecessary
6. Verification run
7. `mark-task-complete.sh` updates `task.md`
8. Git commit created

## TDD Gates

- No production code before an expected failing test unless the task records a TDD exception.
- Red must fail because the target behavior is missing, not because of syntax, fixture, or mock mistakes.
- Red must enter through a public seam; private implementation tests do not unlock Green.
- Green must satisfy only the current Red.
- Refactor happens only after Green and stays inside the current slice.
- Fixture shortcuts and boundary mocks must not hide input contract problems.

## Recovery

Recover from Git and `task.md`:

- current branch
- latest commits
- dirty files
- completed checkboxes
- next unchecked task

Do not recover from process files. Only `task.md`, Git, and current repo truth count.

## Reroute Triggers

- New evidence disproves root cause: `cc-investigate`
- New evidence breaks scope, interface, or task contract: `cc-plan`
- Repeated patch attempts fail after the same task: stop and reroute
- Review feedback exceeds frozen scope: `cc-plan`

## Commit Rule

Every completed task or execution environment gets its own commit. Split by behavior or layer when needed, but do not leave completed work uncommitted between stages.
