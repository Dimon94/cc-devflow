# Limit PostToolUse To Devflow Script Failures

The first runtime harness will not add a general PostToolUse failure commentator. Post-tool output is allowed only for failures from cc-devflow-owned workflow scripts such as `resolve-cc-devflow.sh`, `select-ready-tasks.sh`, and `mark-task-complete.sh`, where the hook can name the exact task contract or evidence issue to fix. General test, lint, build, shell, or application failures remain normal development feedback and should not trigger runtime harness chatter.
