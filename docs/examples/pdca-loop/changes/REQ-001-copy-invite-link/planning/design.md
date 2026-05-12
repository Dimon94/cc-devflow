# DESIGN

## Document Meta

- Requirement version: `REQ-001.v1`
- Design version: `design.v1`
- CC-Plan skill version: `3.8.6`
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

## PRD-Grade Brief

- Problem statement: users can see the invite URL, but copying it still requires manual selection and creates avoidable share-flow friction.
- Solution summary: users get a one-click copy action in the existing share dialog and see lightweight confirmation after the link is copied.
- Actors / personas:
  - workspace member sharing an invite
- User stories:
  - US-001: As a workspace member, I want to copy the invite link with one click, so that I can share it without manually selecting text.
- Implementation decisions:
  - Reuse the existing invite URL source and dialog props.
  - Keep clipboard behavior inside the current share dialog surface.
- Testing decisions:
  - Test through the dialog behavior, not an internal helper.
  - Existing share-dialog tests are the prior art.
- Out of scope: new invite generation, role controls, analytics, or clipboard fallback redesign.
- Further notes: if confirmation remains unclear, open a separate UX requirement.

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

## AI Leverage Decision Lens

- Real user / operator: workspace member sharing an invite
- Status quo workaround: manually select the visible invite URL
- Human-team effort for full scope: about half a day for one engineer including test and review
- CC / agent effort for full scope: about 20 minutes for a targeted UI patch plus test update
- AI compression ratio: roughly 10x for this bounded UI slice
- Complete-lake boundary: copy action, current invite URL source, copied-state feedback, and dialog behavior test
- Ocean boundary: invite generation, permissions, analytics, and clipboard fallback redesign
- Scope recommendation: `boil-lake`
- Cost model: low agent time, low human review time, targeted dialog test, no backend maintenance cost, reversible UI patch
- Verdict: `boil-lake`
- Missing evidence or pivot reason: none

## External Best-Practice Validation

- Needed: No
- Decision status: not-needed
- Generalized search terms:
- Sources checked:
- Repo-fit verdict: skipped
- Changes to frozen design:
- Skipped reason: existing share-dialog behavior and repo tests are sufficient for the tiny design

## Review Gate

- Placeholder scan: pass
- Consistency scan: pass; scope, files, and validation all point to the same tiny patch
- Scope scan: pass; no backend, no permission work
- Ambiguity scan: pass; execution does not need to re-decide button placement or clipboard source
- Feasibility scan: pass; existing dialog and tests already cover the target surface
- PRD brief scan: pass; problem, story, implementation decision, testing decision, and out-of-scope are durable
- AI Leverage Decision Lens scan: pass; bounded same-dialog lake is cheap enough to complete, not just render a happy-path button
- External best-practice scan: pass; not needed for a repo-local tiny design
- Decision question scan: pass; `D1` approved the tiny-design copy-action boundary
- Final recommendation: approved as `tiny-design`

## Decision Questions

| ID | Gate | Known evidence | Recommendation | User choice | Impact on `cc-do` | Status |
|----|------|----------------|----------------|-------------|-------------------|--------|
| D1 | approach-approval | Existing dialog already renders the invite URL and the change stays inside one UI/test surface | Approve the tiny-design copy action | Tiny design copy action | Keep implementation inside the share dialog; do not add backend or permission work | answered |

## Approval

- User approval status: approved
- Deferred questions:
  - if copied-state feedback still feels weak, open a separate requirement for richer UX

## First-Read Test

- This is clearly small because it stays inside one UI surface and one test surface
- The upgrade path is explicit: any contract or fallback work forces `full-design`
- `cc-do` should not need to ask where the URL comes from or how the copy action is triggered
