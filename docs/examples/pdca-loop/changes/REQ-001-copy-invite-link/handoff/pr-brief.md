# PR Brief

## Document Meta

- Output language: en

## Decision

- Recommended mode: `create-pr`
- Why now: verified work is ready for reviewer handoff and there is no existing PR to update
- Why not others: `update-pr` has nothing to refresh, `local-handoff` would delay an already verified change, and `post-merge-closeout` only applies after merge

## Requirement


## Ship Mode

- `create-pr`

## Branch Context

- Current branch: `feature/copy-invite-link`
- Base branch: `main`
- PR / MR: not created yet

## Review Range

- Reviewed base SHA: `example-base`
- Reviewed head SHA: `example-head`
- Review packet: `task.md#Contract Summary`; `task.md#T001-T003`
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
- PR body accuracy: regenerate the PR body from this brief, current validation evidence, and current diff

## Release Readiness

| Gate | Status | Evidence / reason | Rollback / watch |
|------|--------|-------------------|------------------|
| Local quality | passed | `npm test -- src/features/share/ShareDialog.test.tsx`; `npm run lint -- src/features/share/ShareDialog.tsx` | rerun focused component suite |
| Runtime config | not-applicable | no env or startup config changed | no config rollback needed |
| Migrations / data | not-applicable | no data model or persistence change | no migration rollback needed |
| Deploy / health | skipped | example PR brief does not deploy | target repo deploy gate required before release |
| Smoke / cleanup | not-applicable | no temporary records are created | no cleanup needed |
| Rollback / watch | passed | revert dialog and test changes together | watch copied-state feedback after merge |

## Issue Closeout

- Closed now: none
- Close on merge: none
- Related only: none
- Blocked / manual: none
- Reason: example fixture has no tracker issue in scope

## Pull Request Body Contract

- Language source: `Output language: en`
- PR body language: English
- Title rule: use English after the Conventional Commits `type(scope)` prefix; keep identifiers, paths, commands, and issue keys unchanged.
- Required sections: summary, problem, changes, validation, review/gate evidence, risk/rollback, docs/writeback, and follow-ups.
- Completeness gate: no empty headings, no stale inherited PR body, no generic "tests passed" without commands or evidence, and no `<placeholder>` text before `gh pr create`.

## Pull Request Body Draft

```markdown
## Summary

- removes a small but visible sharing friction in the beta flow
- keeps the patch inside the approved `tiny-design` boundary
- ships with fresh test, lint, and review proof

## Problem

- User-visible gap: users can see the invite URL but cannot copy it with one click from the share dialog.

## Changes

- adds a `Copy invite link` action beside the existing invite URL
- reuses the current invite link source of truth
- adds copied-state confirmation without redesigning the dialog

## Validation

- Verification verdict: `pass`
- `npm test -- src/features/share/ShareDialog.test.tsx`
- `npm run lint -- src/features/share/ShareDialog.tsx`

## Issue Closeout

- No tracker issue is in scope for this example; do not add closing keywords.

## Review / Gate Evidence

- Reviewed base SHA: `example-base`
- Reviewed head SHA: `example-head`
- Review packet: `task.md#Contract Summary`; `task.md#T001-T003`
- Finding triage: no findings
- QA / claim evidence: `qa=pass`, `tests-pass=pass`, `requirements-met=pass`
- Readiness: review freshness=`fresh`; QA coverage has no gaps; browser QA intentionally skipped for this fixture.

## Risk And Rollback

- Main risk: copied-state feedback may still be too subtle for some users.
- Rollback boundary: revert the share-dialog change and targeted test in one commit; no data migration or external side effect is involved.

## Docs And Writeback

- `CLAUDE.md`: unchanged
- `README.md`: unchanged

## Follow-ups

```

## Summary

- removes a small but visible sharing friction in the beta flow
- keeps the patch inside the approved `tiny-design` boundary
- ships with fresh test, lint, and review proof

## What Changed

- adds a `Copy invite link` action beside the existing invite URL
- reuses the current invite link source of truth
- adds copied-state confirmation without redesigning the dialog

## Verification Evidence

- Verification verdict: `pass`
- Merged-result verification: not applicable before merge
- Fresh evidence:
  - `npm test -- src/features/share/ShareDialog.test.tsx`
  - `npm run lint -- src/features/share/ShareDialog.tsx`

## Documentation Sync

- `CLAUDE.md`: unchanged
- `README.md`: unchanged
- process files: intentionally omitted

## Minimum Landing Pack

- Required for this mode:
  - `pr-brief.md`
  - fresh verification response
- Intentionally omitted:
  - process files

## How To Verify

- open the share dialog
- confirm the invite URL still matches the current source of truth
- click `Copy invite link`
- confirm the copied-state feedback appears
- re-run the targeted test and lint commands above

## Follow-Ups


## Risks

- copied-state feedback may still be too subtle for some users, but the current patch keeps that trade-off isolated
