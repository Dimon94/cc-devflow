# Full-Design Blocked Example

## Example Meta

- Example version: `1.0.0`
- Last reviewed: `2026-04-17`
- Bound skills: `roadmap@2.2.0`, `cc-plan@3.3.0`, `cc-do@1.3.0`, `cc-check@1.5.0`

This example shows a requirement that **looked executable**, but `cc-check` correctly stopped it and sent it back to `cc-plan`.

The shape is intentional:

- roadmap item is real enough to matter
- design requires `full-design`
- tasks were executed far enough to produce evidence
- `report-card.json` is still `blocked`
- reroute is `cc-plan`, not `cc-do`

## Scenario

The fictional product now wants CSV-based bulk invites for workspace admins.

At first glance, it looks like an import feature inside the admin console.

But the real surface is wider:

- invite limit enforcement
- duplicate email handling
- billing-seat warnings
- audit log consistency

The sample shows what happens when implementation moved before the integration design was fully trustworthy.

## What To Look For

1. Why this requirement cannot stay `tiny-design`
2. Which signals forced `full-design`
3. Why tests passing is still not enough
4. Why reroute goes to `cc-plan` instead of `cc-do`

## Artifact Map

- `ROADMAP.md`
- `BACKLOG.md`
- `changes/REQ-002-bulk-invite-import/planning/design.md`
- `changes/REQ-002-bulk-invite-import/planning/tasks.md`
- `changes/REQ-002-bulk-invite-import/planning/task-manifest.json`
- `changes/REQ-002-bulk-invite-import/review/report-card.json`

## Why There Is No `cc-act` Output

There is no final handoff file here because `cc-check` did **not** return `pass`.

The loop must stop honestly before `cc-act`.
