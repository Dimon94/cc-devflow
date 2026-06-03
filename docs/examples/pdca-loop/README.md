# End-to-End PDCA Example

## Example Meta

- Example version: `1.0.0`
- Last reviewed: `2026-04-17`
- Bound skills: `cc-plan@3.25.0`, `cc-do@1.11.2`, `cc-check@1.18.0`, `cc-act@1.16.0`


The example is intentionally small:

- product context is fake
- requirement scope is real enough to feel concrete
- the chosen ship mode is `create-pr`
- process files are intentionally omitted

## Scenario

The fictional product is a small team workspace app.

The immediate pain is simple: users can open the share dialog and see the invite URL, but they cannot copy it with one click.

The sample requirement is:

- add a `Copy invite link` button to the existing share dialog

## Artifact Map

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

2. Why does the requirement stay `tiny-design` instead of `full-design`?
3. Which task proved the missing behavior first?
4. What fresh evidence let `cc-check` say `pass`?
5. Why does `cc-act` choose `create-pr` and omit process files?
