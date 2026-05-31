# Spec Contract

## Files

- `devflow/specs/INDEX.md`
- `devflow/specs/capabilities/<capability>.md`

## Rules

- Specs describe stable capability truth.
- Specs do not track per-change state.
- Per-change decisions live in `task.md`, PR text, commits, or postmortems.
- Capability names must follow project language and avoid duplicate terms.

## Overlap Decision Gate

Overlapping capability names must be resolved before writing durable spec truth.
Choose one decision: split, merge, deprecate, or keep separate.

Record the canonical vocabulary, aliases to avoid, ownership boundary, and
relationship constraints in the affected capability spec or `INDEX.md`.
