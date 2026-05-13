# Execution Recovery

Recover from:

- Git branch
- Git status
- recent commits
- `task.md`
- current test output

Do not recover from process files. They are not part of the workflow.

## Resume Steps

1. Read `task.md`.
2. Run `git status --short`.
3. Inspect recent commits.
4. Select the first unchecked task whose dependencies are satisfied.
5. Restate the task's goal, public seam, files, verification, and do-not-re-decide items.
6. Re-run the task's verification command if previous output is stale.
7. If Red/Green evidence is missing, rebuild the TDD loop before editing production code.
8. Continue or reroute.

## Bad Recovery Signals

- Current task cannot be restated from `task.md`.
- Dirty files do not match the selected task.
- Prior green output is stale or came from chat memory.
- Test seam is private or mock-heavy.
- Completion script would only be satisfied by hand-editing status.

Any of these forces a reset from Git, `task.md`, and fresh command output.
