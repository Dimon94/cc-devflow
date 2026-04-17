# Resume Index

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
- `status-report.md` explains why the work is in handoff mode instead of PR mode

## Next Entry

- when remote access is restored, rerun `detect-ship-target`
- if the branch still has no PR, switch from `local-handoff` to `create-pr`
- use `status-report.md` and `report-card.json` as the truth sources for the next ship step

## Read First

- `DESIGN.md`
- `TASKS.md`
- `task-manifest.json`
- `report-card.json`
- `status-report.md`

## How To Re-Verify

- `npm test -- src/admin/AuditSummaryPanel.test.tsx`
- `npm run lint -- src/admin/AuditSummaryPanel.tsx`

## Open Follow-Up

- if operators ask for JSON or scheduled exports, lift that into a new roadmap item instead of reopening `REQ-003`
