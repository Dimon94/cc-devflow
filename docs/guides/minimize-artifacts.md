# Minimize Artifacts

The workflow is intentionally Git-first.

## Keep

- `task.md`
- `handoff/pr-brief.md` when a PR or local handoff needs it
- incident postmortem when a FIX or recurring failure needs it
- `cc-research` entries under `devflow/research/` when reusable project
  evidence must persist

## Do Not Keep

Do not generate process files beyond the durable files above. Only
`cc-research` writes `devflow/research/`.

## Commit Rule

Each completed planned workflow environment/stage gets a Git commit. Use the commit graph as the process record.
