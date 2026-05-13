# CC-Do Playbook

## State Machine

`cc-plan | cc-investigate -> cc-do -> cc-check`

`cc-do` edits code. It does not create process files.

## Task Gates

1. Task selected from `task.md`
2. Red observed or TDD exception recorded
3. Green observed
4. Refactor complete or unnecessary
5. Verification run
6. `mark-task-complete.sh` updates `task.md`
7. Git commit created

## Recovery

Recover from Git and `task.md`:

- current branch
- latest commits
- dirty files
- completed checkboxes
- next unchecked task

Do not recover from process files. Only `task.md`, Git, and current repo truth count.

## Commit Rule

Every completed task or execution environment gets its own commit. Split by behavior or layer when needed, but do not leave completed work uncommitted between stages.
