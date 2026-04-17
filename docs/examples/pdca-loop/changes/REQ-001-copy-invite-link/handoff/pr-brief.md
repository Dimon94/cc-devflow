# PR Brief

## Decision

- Recommended mode: `create-pr`
- Why now: verified work is ready for reviewer handoff and there is no existing PR to update
- Why not others: `update-pr` has nothing to refresh, `local-handoff` would delay an already verified change, and `post-merge-closeout` only applies after merge

## Requirement

- `RM-001` / `REQ-001`: add a one-click copy action to the existing share dialog

## Ship Mode

- `create-pr`

## Branch Context

- Current branch: `feature/copy-invite-link`
- Base branch: `main`
- PR / MR: not created yet

## Summary

- removes a small but visible sharing friction in the beta flow
- keeps the patch inside the approved `tiny-design` boundary
- ships with fresh test, lint, and review proof

## What Changed

- adds a `Copy invite link` action beside the existing invite URL
- reuses the current invite link source of truth
- adds copied-state confirmation without redesigning the dialog

## Verification Evidence

- `report-card.json` verdict: `pass`
- Fresh evidence:
  - `npm test -- src/features/share/ShareDialog.test.tsx`
  - `npm run lint -- src/features/share/ShareDialog.tsx`

## Documentation Sync

- `CLAUDE.md`: unchanged
- `README.md`: unchanged
- `release-note.md`: intentionally omitted for this mode
- `resume-index.md`: not needed because the change is ready for PR handoff

## Minimum Landing Pack

- Required for this mode:
  - `status.md`
  - `pr-brief.md`
  - fresh `report-card.json`
- Intentionally omitted:
  - `release-note.md`
  - `resume-index.md`

## How To Verify

- open the share dialog
- confirm the invite URL still matches the current source of truth
- click `Copy invite link`
- confirm the copied-state feedback appears
- re-run the targeted test and lint commands above

## Follow-Ups

- if users still miss the feedback, lift `RM-002` into the next requirement

## Risks

- copied-state feedback may still be too subtle for some users, but the current patch keeps that trade-off isolated
