# Artifact Contract

cc-devflow keeps the workflow surface intentionally small.

## Durable Files

- `devflow/changes/<change-key>/task.md`
- `devflow/changes/<change-key>/handoff/pr-brief.md` when PR or local handoff needs it
- `devflow/postmortems/incidents/<date>-<change-key>.md` when a FIX or recurring failure needs a postmortem
- `devflow/postmortems/INDEX.md` as the postmortem index
- `devflow/research/index.jsonl` as the cc-research metadata index
- `devflow/research/entries/<date>-<slug>.md` when cc-research writes reusable project evidence

## State Source

Git records process history. Commit after each completed planned workflow environment/stage.

## Retired Surface

Do not create process files beyond the durable files above. Research files are
owned by `cc-research`; other skills must not write them directly.
