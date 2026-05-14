# End-to-End PDCA Example

## Example Meta

- Example version: `1.0.0`
- Last reviewed: `2026-04-17`
- Bound skills: `cc-roadmap@5.3.0`, `cc-plan@3.10.4`, `cc-do@1.7.2`, `cc-check@1.12.2`, `cc-act@1.9.1`

This folder shows one minimal but complete `cc-roadmap -> cc-plan -> cc-do -> cc-check -> cc-act` loop.

The example is intentionally small:

- product context is fake
- requirement scope is real enough to feel concrete
- the chosen ship mode is `create-pr`
- process files are intentionally omitted

## Scenario

The fictional product is a small team workspace app.

The immediate pain is simple: users can open the share dialog and see the invite URL, but they cannot copy it with one click.

The sample requirement is:

- `RM-001`: add a `Copy invite link` button to the existing share dialog

## Artifact Map

- `roadmap.json`: editable roadmap truth that renders the generated views
- `ROADMAP.md`: generated view of what `cc-roadmap` decided and why this item is first
- `BACKLOG.md`: deprecated capability-aware projection that makes `RM-001` ready for `cc-plan`
- `changes/REQ-001-copy-invite-link/task.md`: executable task handoff
- `changes/REQ-001-copy-invite-link/handoff/pr-brief.md`: ship-ready PR handoff

## Why There Are No Process Files

This sample chooses `create-pr`.

That mode needs:

- `pr-brief.md`
- synced docs if behavior changed

It does **not** need process files, so the example intentionally stops there.

## What To Look For

When reading the sample, check whether you can answer these in under a minute:

1. Why is `RM-001` the next roadmap item?
2. Why does the requirement stay `tiny-design` instead of `full-design`?
3. Which task proved the missing behavior first?
4. What fresh evidence let `cc-check` say `pass`?
5. Why does `cc-act` choose `create-pr` and omit process files?
