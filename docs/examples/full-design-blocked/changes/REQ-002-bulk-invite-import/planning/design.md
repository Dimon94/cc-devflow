# DESIGN

## Document Meta

- Requirement version: `REQ-002.v2`
- Design version: `design.v2`
- CC-Plan skill version: `3.3.0`
- Requirement ID: `REQ-002`
- Design mode: `full-design`
- Why not `tiny-design`: the feature crosses import parsing, invite rules, billing limits, duplicate handling, and audit logging
- Design status: `in-review`
- Source roadmap item: `RM-010`
- Source roadmap version: `roadmap.v2`
- Source roadmap skill version: `2.2.0`
- Date: `2026-04-16`
- Owner: `product-owner`

## Source Handoff

- Source stage: `Stage 2`
- Why now from roadmap: admin demand is real, but trust risks dominate the design
- Inherited success signal: admins can predict every bulk invite outcome
- Inherited kill signal: if semantics remain underspecified, stop execution and reopen planning
- Inherited dependencies:
  - existing seat limit enforcement
  - current audit log contract
- Inherited non-goals:
  - no background job redesign
  - no enterprise provisioning layer
- Upstream evidence: support notes from larger teams
- Assumptions to re-validate:
  - duplicate emails can be skipped safely
  - seat-limit failures can be partially accepted

## Requirement Snapshot

- Raw ask: admins want to upload a CSV of emails instead of inviting people one by one
- User: workspace admins onboarding 20-200 collaborators
- Pain: manual invites are too slow and error-prone
- Smallest viable wedge: a CSV upload that clearly predicts accepted, skipped, and rejected rows
- Out of scope:
  - enterprise SCIM provisioning
  - background retry orchestration

## Success Criteria

- Observable success signals:
  - admin sees deterministic results for each CSV row
  - duplicate, over-limit, and invalid rows are explained consistently
- Business / operator success signals:
  - support no longer manually explains bulk invite outcomes
- Abort signals:
  - billing-seat or audit outcomes differ from the documented plan

## Options Considered

### Option A

- Shape: front-end-only CSV parsing with best-effort invite submission
- Reuses: existing single-invite API
- Pros: fast to prototype
- Cons: semantics depend on hidden backend edge cases
- Risks: partial success becomes impossible to explain

### Option B

- Shape: freeze a rule matrix first, then implement import around it
- Reuses: existing invite engine, but with explicit row-state mapping
- Pros: makes billing, duplicate, and audit behavior reviewable
- Cons: more upfront planning
- Risks: may expose a need for additional shared contracts

## Approved Direction

- Approved option: `Option B`
- Why this is the best trade-off now: the import UX is not trustworthy until row outcomes and seat limits are explicitly modeled
- Why not the other options now: best-effort submission would let implementation invent semantics during execution
- What we explicitly rejected: a UI-only CSV uploader that guesses row behavior
- Frozen decisions:
  - bulk import must classify each row into accepted, skipped, or rejected
  - seat-limit failures cannot silently pass
  - audit log entries must match the visible row outcome
- Deferred questions:
  - whether partial success needs an explicit rollback option

## Design

- Modules touched:
  - admin invite UI
  - invite validation rules
  - billing / seat limit decision points
  - audit log mapping
- Data flow:
  - CSV parse -> row validation -> invite decision -> row result summary -> audit log write
- Contracts:
  - one rule matrix for duplicate, invalid, over-limit, and existing-member rows
- Error handling:
  - every rejected row must expose a user-readable reason
- Rollout / migration:
  - release only after rule matrix and verification plan are both approved

## File Plan

| File | Change | Reason |
|------|--------|--------|
| `src/admin/BulkInvitePanel.tsx` | update | upload and result display |
| `src/admin/BulkInvitePanel.test.tsx` | update | row-state behavior tests |
| `src/invite/bulk-import.ts` | add | import rule orchestration |
| `src/invite/bulk-import.test.ts` | add | duplicate / seat / invalid cases |
| `src/audit/invite-log.ts` | update | audit consistency |

## Validation Strategy

- Unit: rule matrix tests for each row outcome
- Integration: admin upload flow covering duplicates and seat-limit failures
- Manual: CSV import with mixed valid and invalid rows
- Observability / evidence: row summary and audit log must agree

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| duplicate handling is underspecified | high | freeze explicit rule matrix before continuing |
| audit and visible row summary diverge | high | verify audit mapping in integration review |

## Review Gate

- Placeholder scan: pass
- Consistency scan: fail; current implementation evidence still assumes some row outcomes not frozen here
- Scope scan: pass
- Ambiguity scan: blocked; duplicate + seat-limit semantics still need sharper wording
- Feasibility scan: pass
- Source alignment: pass; roadmap still prioritizes trust over speed
- UI / interaction review summary: result states are acceptable if semantics are frozen first
- DX review summary: execution still needs a single row-outcome matrix
- Auto-decided items:
  - CSV upload stays inside admin settings
- Taste decisions:
  - show result rows directly after parse instead of a second confirmation wizard
- User challenges:
  - can admins predict partial failure without reading documentation?
- Recommendation: do not declare this design complete until the row-outcome matrix is explicit

## Approval

- User approval status: `in-review`
- Follow-up changes after review:
  - add a rule matrix section before execution resumes

## First-Read Test

- 10 秒内能看出这次为什么不是 `tiny-design`
- 10 秒内能看出批准方案和被拒方案的边界
- `cc-do` 是否还能被迫二次设计；这里答案仍然是“会”，所以设计还不能诚实闭环
