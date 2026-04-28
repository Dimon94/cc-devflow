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

## Review Range

- Reviewed base SHA: `example-base`
- Reviewed head SHA: `example-head`
- Review packet: `planning/tasks.md#T001-T003`; `planning/design.md`
- Finding triage: no findings
- QA / claim evidence: `qa=pass`, `tests-pass=pass`, `requirements-met=pass`

## Readiness Dashboard

- Review freshness: `fresh`, reviewed `example-head`, current `example-head`
- Review quality: `qualityScore=9`
- Specialist review facets: `testing:pass`
- QA coverage: `status=pass`, gaps `0`, e2eRequired `false`
- Browser QA: `skipped`, example fixture uses targeted component evidence instead of a live browser
- Failure ownership: no open failures recorded
- Documentation release: README and CLAUDE unchanged for this scoped example
- PR body accuracy: regenerate the PR body from this brief, current report-card, and current diff

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
- Merged-result verification: not applicable before merge
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
