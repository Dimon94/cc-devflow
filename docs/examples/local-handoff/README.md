# Local-Handoff Example

## Example Meta

- Example version: `1.0.0`
- Last reviewed: `2026-04-17`
- Bound skills: `roadmap@2.2.0`, `cc-plan@3.3.0`, `cc-do@1.3.0`, `cc-check@1.5.0`, `cc-act@1.2.0`

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
3. How `resume-index.md` becomes the next-entry truth source

## Artifact Map

- `ROADMAP.md`
- `BACKLOG.md`
- `requirements/REQ-003-audit-log-export/DESIGN.md`
- `requirements/REQ-003-audit-log-export/TASKS.md`
- `requirements/REQ-003-audit-log-export/task-manifest.json`
- `requirements/REQ-003-audit-log-export/report-card.json`
- `requirements/REQ-003-audit-log-export/status-report.md`
- `requirements/REQ-003-audit-log-export/resume-index.md`

## Why There Is No `pr-brief.md`

This sample intentionally chooses `local-handoff`.

That mode needs:

- `status-report.md`
- `resume-index.md`

It does **not** require a PR brief yet.
