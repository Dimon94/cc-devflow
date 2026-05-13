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
4. Select the first unchecked task.
5. Re-run the task's verification command if previous output is stale.
6. Continue or reroute.
