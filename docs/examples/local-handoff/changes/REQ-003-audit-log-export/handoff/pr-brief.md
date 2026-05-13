# PR Brief

## Current Reality

- Requirement: `REQ-003`
- Roadmap item: `RM-020`
- Verification state: `pass`
- Ship mode: `local-handoff`
- Current branch: `feature/audit-summary-export`
- Blocking environment fact: remote push / PR creation is unavailable right now

## What Is Already Done

- design approved as `tiny-design`
- implementation tasks `T001-T003` completed
- targeted test and lint evidence collected
- `report-card.json` confirms `pass`

## Release Notes

- Not released yet; this is a local handoff entry.
- User impact if later shipped: admins can export the currently visible audit summary rows as CSV.
- Verification: `review/report-card.json` verdict is `pass`.

## Resume Entry

- Requirement: `REQ-003`
- Current stage: `cc-act`
- Current task: `ship:local-handoff`
- Next action: when remote access is restored, rerun `detect-ship-target`; if the branch still has no PR, switch from `local-handoff` to `create-pr`.
- Truth sources: use this `pr-brief.md` and `report-card.json` for the next ship step.

## Read First

- `design.md`
- `tasks.md`
- `task-manifest.json`
- `report-card.json`

## How To Re-Verify

- `npm test -- src/admin/AuditSummaryPanel.test.tsx`
- `npm run lint -- src/admin/AuditSummaryPanel.tsx`

## Open Follow-Up

- if operators ask for JSON or scheduled exports, lift that into a new roadmap item instead of reopening `REQ-003`
