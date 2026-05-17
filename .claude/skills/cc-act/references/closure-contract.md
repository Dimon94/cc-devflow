# Closure Contract

## Allowed Durable Outputs

- `handoff/pr-brief.md`
- `devflow/postmortems/INDEX.md`
- `devflow/postmortems/incidents/<date>-<change-key>.md`

## Hard Rules

1. Git commits are the process record.
2. PR text is rebuilt from current commits, diff, `task.md`, and fresh validation.
3. Incident postmortems are factual and evidence-backed.
4. `cc-act` must make the postmortem trigger decision explicit with `POSTMORTEM_REQUIRED=yes/no`.
5. No process file beyond the allowed durable outputs.
6. If verification changes during Act, return to `cc-check`.

## Exit

Close with commit hashes, validation commands, PR/handoff state, and any incident postmortem path.
