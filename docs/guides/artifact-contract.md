# Artifact Contract

cc-devflow keeps the workflow surface intentionally small.

## Durable Files

- `devflow/changes/<change-key>/task.md`
- `devflow/changes/<change-key>/handoff/pr-brief.md` when PR or local handoff needs it
- `devflow/postmortems/incidents/<date>-<change-key>.md` when a FIX or recurring failure needs a postmortem
- `devflow/postmortems/INDEX.md` as the postmortem index

## State Source

Git records process history. Commit after each completed PDCA or IDCA environment/stage.

## Retired Surface

Do not create process files beyond the durable files above.
