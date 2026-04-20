# DESIGN

## Document Meta

- Requirement version: `REQ-003.v1`
- Design version: `design.v1`
- CC-Plan skill version: `3.4.0`
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

## Review Gate

- Placeholder scan: pass
- Consistency scan: pass
- Scope scan: pass
- Ambiguity scan: pass
- Feasibility scan: pass
- Final recommendation: approved as `tiny-design`

## Approval

- User approval status: approved
- Deferred questions:
  - if admins ask for machine-readable export next, open a separate requirement

## First-Read Test

- 一眼能看出这次为什么够小
- 一眼能看出什么情况会逼它升级成 `full-design`
- `cc-do` 看完不会继续追问“导出的字段从哪里来”
