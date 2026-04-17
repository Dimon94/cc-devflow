# ROADMAP

## Roadmap Meta

- Roadmap version: `roadmap.v2`
- Skill version: `2.2.0`
- Status: `active`
- Last updated: `2026-04-16`
- Owner / decider: `product-owner`
- Current focus stage: `Stage 2`
- Confidence: `medium`
- Supersedes roadmap version: `roadmap.v1`

## Context Snapshot

- Product / repo: `workspace-lite`
- Project stage: teams actively collaborate after the first-share fixes
- Users: workspace admins managing larger invite waves
- Pain: inviting many users one by one is slow and error-prone
- Existing workaround: admins repeatedly paste emails or use external spreadsheets
- Strongest demand evidence: support calls now ask for admin-scale invite workflows
- Why now: the product graduated past the first-share bottleneck
- Distribution path: direct beta expansion to larger teams
- Deadline / forcing function: larger-team beta starts on `2026-04-30`
- Team / capacity: one engineer plus part-time design help
- Hard constraints: billing and audit behavior must remain trustworthy
- Adoption / trust bottleneck: admins will not trust bulk invite if seat usage and audit logs drift
- Known unknowns: how duplicate users, seat limits, and partial imports should behave

## Route Options

| Shape | Why this could work | Why this may fail | Decision |
|-------|---------------------|-------------------|----------|
| wedge-first | deliver a minimal CSV import | may hide dangerous admin edge cases | Rejected |
| platform-first | design import rules, billing boundaries, and audit consistency first | slower upfront | Recommended |
| rescue-first | keep manual import and patch docs | does not solve admin pain | Rejected |

## Recommended Route

- Recommendation: `platform-first`
- Why this route wins now: the biggest risk is trust and consistency, not button placement
- Why the rejected routes lose now: a superficially small import flow can corrupt admin expectations if rules are underspecified
- First signal to watch: admins can predict what happens for duplicates, seat limits, and partial success
- Kill signal / stop condition: if the team cannot specify bulk invite semantics before implementation starts

## Implementation Tracking

| RM-ID | Item | Stage | Priority | Status | REQ | Progress |
|------|------|-------|----------|--------|-----|----------|
| RM-010 | Add CSV bulk invite import for admins | Stage 2 | P1 | Verification blocked | REQ-002 | 80% |
