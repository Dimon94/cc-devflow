# DESIGN

## Document Meta

- Requirement version: `REQ-001.v1`
- Design version: `design.v1`
- CC-Plan skill version: `3.5.0`
- Requirement ID: `REQ-001`
- Design mode: `tiny-design`
- Why this stays `tiny-design`: the patch is limited to an existing dialog and test file, with no API or data model changes
- Approval status: `approved`
- Source roadmap item: `RM-001`
- Source roadmap version: `roadmap.v1`

## Source Handoff

- Why now: Stage 1 needs the smallest possible share-flow win
- Inherited success signal: a user can copy the invite link with one click
- Inherited kill signal: if the patch requires backend or permission changes, reopen planning
- Inherited non-goals: no invite role controls, no analytics, no dialog redesign
- Upstream evidence: repeated support notes and observed manual copying

## Frozen Design Card

- Change: add a `Copy invite link` button beside the existing read-only invite URL in the share dialog
- Keep out: no new invite generation flow and no fallback redesign for unsupported browsers
- Touched files:
  - `src/features/share/ShareDialog.tsx`
  - `src/features/share/ShareDialog.test.tsx`
- Contract changes: none; reuse the existing invite link source and existing dialog props
- Key decisions that `cc-do` must not re-decide:
  - use `navigator.clipboard.writeText`
  - keep the current invite URL source of truth
  - show a lightweight copied-state confirmation inside the current dialog
- Upgrade trigger to `full-design`: if clipboard support requires new platform fallbacks, or if the patch spills into shared share-service contracts

## Validation

- Primary check: targeted dialog test proves the button renders and copies the current invite URL
- Secondary checks:
  - existing share dialog tests remain green
  - lint stays green for the touched files
- Evidence to collect:
  - failing test before implementation
  - passing targeted test after implementation
  - fresh gate output for `cc-check`

## Main Risk

- Risk: copied-state feedback may be too subtle for users
- Mitigation: keep the first patch minimal and log a follow-up roadmap item if support friction remains

## Review Gate

- Placeholder scan: pass
- Consistency scan: pass; scope, files, and validation all point to the same tiny patch
- Scope scan: pass; no backend, no permission work
- Ambiguity scan: pass; execution does not need to re-decide button placement or clipboard source
- Feasibility scan: pass; existing dialog and tests already cover the target surface
- Final recommendation: approved as `tiny-design`

## Approval

- User approval status: approved
- Deferred questions:
  - if copied-state feedback still feels weak, open a separate requirement for richer UX

## First-Read Test

- This is clearly small because it stays inside one UI surface and one test surface
- The upgrade path is explicit: any contract or fallback work forces `full-design`
- `cc-do` should not need to ask where the URL comes from or how the copy action is triggered
