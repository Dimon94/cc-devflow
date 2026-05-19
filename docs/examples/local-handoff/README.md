# Local-Handoff Example

## Example Meta

- Example version: `1.0.0`
- Last reviewed: `2026-04-17`
- Bound skills: `cc-roadmap@5.5.0`, `cc-plan@3.12.0`, `cc-do@1.9.0`, `cc-check@1.14.0`, `cc-act@1.11.0`

This example shows verified work that is **ready to move forward**, but `cc-act` still chooses `local-handoff`.

That is not a failure.

It simply means:

- the requirement passed verification
- a PR or remote push is intentionally not the next action
- the workflow still must leave a clean handoff for the next maintainer

## Scenario

The fictional product now adds a downloadable audit-log export summary inside the admin console.

The implementation is done and verified.

But the current environment is local-only:

- remote access is unavailable
- the branch should not be pushed yet
- another maintainer will pick it up later

## What To Look For

1. Why `cc-check` is `pass`
2. Why `cc-act` still does not choose `create-pr`
3. How `handoff/pr-brief.md` becomes the only final handoff file

## Artifact Map

- `roadmap.json` (editable roadmap truth)
- `ROADMAP.md` (generated view)
- `BACKLOG.md` (deprecated projection)
- `changes/REQ-003-audit-log-export/task.md`
- `changes/REQ-003-audit-log-export/handoff/pr-brief.md`

## Why There Is A Local `pr-brief.md`

This sample intentionally chooses `local-handoff`.

That mode still needs one durable PR/handoff file:

- `handoff/pr-brief.md`

It does **not** require process files.
