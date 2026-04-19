# ROADMAP

## Roadmap Meta

- Roadmap version: `roadmap.v3`
- Skill version: `4.0.0`
- Status: `active`
- Last updated: `2026-04-16`
- Owner / decider: `product-owner`
- Current focus stage: `Stage 2`
- Confidence: `medium`
- Supersedes roadmap version: `roadmap.v2`

## Context Snapshot

- Product / repo: `workspace-lite`
- Project stage: collaboration and admin reporting are now both in use
- Users: workspace admins reviewing activity and sharing reports internally
- Pain: admins can inspect audit events, but cannot export a concise summary
- Existing workaround: manually copy rows into an internal note
- Strongest demand evidence: admins ask for a downloadable summary during weekly reviews
- Why now: admin trust now depends on visibility and operational clarity
- Distribution path: internal admin beta
- Deadline / forcing function: internal ops review on `2026-04-25`
- Team / capacity: one engineer
- Hard constraints: keep export local to the current admin console
- Adoption / trust bottleneck: admins want proof they can take activity history out of the UI cleanly
- Known unknowns: whether CSV alone is enough or if JSON export will be needed later

## Recommended Route

- Recommendation: `wedge-first`
- Why this route wins now: a simple downloadable summary removes the current reporting pain without broader analytics work
- Why the rejected routes lose now: platform and rescue variants add scope before the current operator need is solved
- First signal to watch: admins can finish weekly review without copying rows manually
- Kill signal / stop condition: if export requires a shared reporting pipeline redesign

## Implementation Tracking

| RM-ID | Item | Stage | Priority | Status | REQ | Progress |
|------|------|-------|----------|--------|-----|----------|
| RM-020 | Add an audit-log export summary download | Stage 2 | P1 | Local handoff | REQ-003 | 100% |
