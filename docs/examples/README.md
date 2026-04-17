# Example Gallery

This page is now a compact list view.

The canonical one-page entry is [START-HERE.md](./START-HERE.md).

Use this page only when you already know you want the short list.

If you need to verify that examples still match the current skill contracts, use [example-bindings.json](./example-bindings.json) and [scripts/check-example-bindings.sh](./scripts/check-example-bindings.sh).

## Available Examples

### 1. Happy Path: tiny-design + `create-pr`

- Path: [./pdca-loop/README.md](./pdca-loop/README.md)
- Shows:
  - `roadmap -> cc-plan -> cc-do -> cc-check -> cc-act`
  - `tiny-design`
  - `pass`
  - `create-pr`

### 2. Counterexample: `full-design` + `blocked` + reroute to `cc-plan`

- Path: [./full-design-blocked/README.md](./full-design-blocked/README.md)
- Shows:
  - a requirement that was planned too narrowly for the real integration surface
  - tests may pass, but `cc-check` still returns `blocked`
  - the correct next move is to reopen planning instead of faking completion

### 3. Counterexample: verified work + `local-handoff`

- Path: [./local-handoff/README.md](./local-handoff/README.md)
- Shows:
  - work that is truly verified
  - a case where remote / PR actions are intentionally skipped
  - `cc-act` leaving exactly one final handoff file, with `resume-index.md` only for local-handoff

If you need symptom routing or artifact-based lookup, go back to [START-HERE.md](./START-HERE.md).
