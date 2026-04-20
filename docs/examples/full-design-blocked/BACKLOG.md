# BACKLOG

## Backlog Meta

- Roadmap version: `roadmap.v2`
- Skill version: `4.3.1`
- Last synced: `2026-04-19`
- Current focus stage: `Stage 2`
- Tracking source: `roadmap-tracking.json`

## Queue

| RM-ID | Title | Source Stage | Priority | Primary Capability | Secondary Capabilities | Capability Gap | Expected Spec Delta | Evidence | Depends On | Parallel With | Unknowns | Next Decision | Ready |
|------|------|------|------|------|------|------|------|------|------|------|------|------|------|
| RM-010 | Add CSV bulk invite import for admins | Stage 2 | P1 | cap-bulk-invite-import | cap-workspace-membership | admins can invite one user at a time but cannot safely import invite batches | define import semantics before widening current truth | sales onboarding asks for spreadsheet-scale invites | - | - | duplicate-email policy, seat enforcement, audit fan-out | reroute to full design before more execution work | Yes |

## Dependency Handoff

- Serial spine: RM-010
- Parallel-ready next wave: -
- Notes on blockers: verification is blocked until the import contract covers limits, duplicates, billing, and audit consistency

## Ready For Req-Plan

- RM-010:
  - Primary Capability: `cap-bulk-invite-import`
  - Secondary Capabilities: `cap-workspace-membership`
  - Why now: demand is real, but the contract is too wide to keep improvising in code
  - Success signal: the capability has a trusted import contract before implementation resumes
  - Entry constraints: must freeze limits, duplicates, warnings, and audit behavior first
  - Capability gap: admins can invite one user at a time but cannot safely import invite batches
  - Expected spec delta: define import semantics before widening current truth
  - Open risks: another partial implementation pass would deepen the semantic drift
  - First planning question: which subflows share one import contract and which need explicit splits?
  - Required context to load: invite limits, billing rules, duplicate handling, audit logging
  - Depends On: `-`
  - Parallel With: `-`
  - Why this is ready now: the blocker is design truth, not implementation effort

## Parked

- RM-XXX:
  - Reason parked:
  - Trigger to reopen:
  - Missing evidence:
