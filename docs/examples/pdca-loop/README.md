# End-to-End PDCA Example

## Example Meta

- Example version: `1.0.0`
- Last reviewed: `2026-04-17`
- Bound skills: `cc-roadmap@4.3.1`, `cc-plan@3.5.2`, `cc-do@1.5.1`, `cc-check@1.8.1`, `cc-act@1.6.1`

This folder shows one minimal but complete `cc-roadmap -> cc-plan -> cc-do -> cc-check -> cc-act` loop.

The example is intentionally small:

- product context is fake
- requirement scope is real enough to feel concrete
- the chosen ship mode is `create-pr`
- optional artifacts such as `release-note.md` are intentionally omitted when the mode does not require them

## Scenario

The fictional product is a small team workspace app.

The immediate pain is simple: users can open the share dialog and see the invite URL, but they cannot copy it with one click.

The sample requirement is:

- `RM-001`: add a `Copy invite link` button to the existing share dialog

## Artifact Map

- `ROADMAP.md`: what `cc-roadmap` decided and why this item is first
- `roadmap-tracking.json`: machine-readable roadmap/backlog truth that renders `ROADMAP.md` and `BACKLOG.md`
- `BACKLOG.md`: capability-aware handoff that makes `RM-001` ready for `cc-plan`
- `changes/req-001-copy-invite-link/planning/design.md`: approved tiny design
- `changes/req-001-copy-invite-link/planning/tasks.md`: executable task handoff
- `changes/req-001-copy-invite-link/planning/task-manifest.json`: machine-readable execution truth
- `changes/req-001-copy-invite-link/review/report-card.json`: `cc-check` proof and verdict
- `changes/req-001-copy-invite-link/handoff/pr-brief.md`: ship-ready PR handoff

## Why There Is No `release-note.md`

This sample chooses `create-pr`.

That mode needs:

- `pr-brief.md`
- synced docs if behavior changed

It does **not** need a public release note yet, so the example intentionally stops there.

## What To Look For

When reading the sample, check whether you can answer these in under a minute:

1. Why is `RM-001` the next roadmap item?
2. Why does the requirement stay `tiny-design` instead of `full-design`?
3. Which task proved the missing behavior first?
4. What fresh evidence let `cc-check` say `pass`?
5. Why does `cc-act` choose `create-pr` and omit `release-note.md`?
