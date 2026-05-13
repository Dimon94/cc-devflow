# DESIGN

## Document Meta

- Requirement version: `REQ-003.v1`
- Design version: `design.v1`
- CC-Plan skill version: `3.9.3`
- Work branch: `REQ/003-audit-log-export`
- Requirement ID: `REQ-003`
- Design mode: `tiny-design`
- Why this stays `tiny-design`: the patch adds one export action inside the existing admin audit UI without changing data contracts
- Approval status: `approved`
- Source roadmap item: `RM-020`
- Source roadmap version: `roadmap.v3`

## Source Handoff

- Why now: admins need a lightweight way to take weekly activity summaries out of the UI
- Inherited success signal: admins can download the summary without manual row copying
- Inherited kill signal: if export requires a shared reporting pipeline, reopen planning
- Inherited non-goals: no JSON export mode, no scheduled reporting
- Upstream evidence: repeated internal admin requests during weekly reviews

## Frozen Design Card

- Change: add a `Download summary` action that exports the visible audit summary rows as CSV
- Keep out: no multi-format export and no shared reporting backend
- Touched files:
  - `src/admin/AuditSummaryPanel.tsx`
  - `src/admin/AuditSummaryPanel.test.tsx`
- Contract changes: none; reuse the existing summary rows already shown in the panel
- Key decisions that `cc-do` must not re-decide:
  - export only what is already visible in the panel
  - use CSV as the single output format
  - keep the action inside the current admin panel
- Upgrade trigger to `full-design`: if export needs background generation or new reporting contracts

## PRD-Grade Brief

- Problem statement: admins can review audit summary rows in the UI, but taking them into weekly reports requires manual copying.
- Solution summary: admins can download the currently visible audit summary rows as a CSV from the existing admin panel.
- Actors / personas:
  - workspace admin reviewing weekly activity
- User stories:
  - US-001: As a workspace admin, I want to download visible audit summary rows as CSV, so that I can include them in weekly reporting without manual copying.
- Implementation decisions:
  - Export only the rows already visible in the panel.
  - Keep CSV as the only output format.
- Testing decisions:
  - Test through the admin panel action and visible row data.
  - Existing audit summary panel tests are the prior art.
- Out of scope: JSON export, scheduled reporting, and shared reporting backend work.
- Further notes: richer machine-readable exports should become a separate requirement.

## Validation

- Primary check: targeted panel test proves the export action is available and uses current summary rows
- Secondary checks:
  - existing audit summary rendering stays green
  - lint passes for the touched panel
- Evidence to collect:
  - failing test before implementation
  - passing test and lint after implementation

## Main Risk

- Risk: admins may soon ask for more export formats
- Mitigation: treat JSON or scheduled exports as later roadmap items

## AI Leverage Decision Lens

- Real user / operator: workspace admin preparing weekly review notes
- Status quo workaround: manually copy visible audit rows
- Human-team effort for full scope: about one day for an engineer to implement, test, and document the local export
- CC / agent effort for full scope: about 30 minutes for visible-row CSV export plus targeted test and lint
- AI compression ratio: roughly 10x for the bounded local export path
- Complete-lake boundary: visible-row CSV export, panel action, current data source, targeted panel test, and lint
- Ocean boundary: JSON export, scheduled reporting, shared reporting backend, and cross-panel reporting platform
- Scope recommendation: `boil-lake`
- Cost model: low agent time, low human review time, targeted panel test plus lint, low maintenance cost while scoped to visible rows, reversible UI action
- Verdict: `boil-lake`
- Missing evidence or pivot reason: none

## External Best-Practice Validation

- Needed: No
- Decision status: not-needed
- Generalized search terms:
- Sources checked:
- Repo-fit verdict: skipped
- Changes to frozen design:
- Skipped reason: the local handoff exports existing visible rows and does not introduce a new reporting standard

## Review Gate

- Placeholder scan: pass
- Consistency scan: pass
- Scope scan: pass
- Ambiguity scan: pass
- Feasibility scan: pass
- PRD brief scan: pass; the export story and scope boundaries are explicit
- AI Leverage Decision Lens scan: pass; visible-row export lake is bounded enough to complete while reporting platform work stays out
- External best-practice scan: pass; not needed for a repo-local visible-row export
- Decision question scan: pass; `D1` approved the tiny-design CSV-export boundary
- Final recommendation: approved as `tiny-design`

## Decision Questions

| ID | Gate | Known evidence | Recommendation | User choice | Impact on `cc-do` | Status |
|----|------|----------------|----------------|-------------|-------------------|--------|
| D1 | approach-approval | Existing admin panel already owns visible summary rows and the change does not need a reporting backend | Approve the tiny-design CSV export | Tiny design CSV export | Export only visible rows from the current panel; do not create reporting contracts | answered |

## Approval

- User approval status: approved
- Deferred questions:
  - if admins ask for machine-readable export next, open a separate requirement

## First-Read Test

- 一眼能看出这次为什么够小
- 一眼能看出什么情况会逼它升级成 `full-design`
- `cc-do` 看完不会继续追问“导出的字段从哪里来”
