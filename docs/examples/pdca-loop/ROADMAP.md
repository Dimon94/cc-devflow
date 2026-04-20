# ROADMAP

## Roadmap Meta

- Roadmap version: `roadmap.v1`
- Skill version: `4.3.1`
- Status: `active`
- Last updated: `2026-04-15`
- Owner / decider: `product-owner`
- Current focus stage: `Stage 1`
- Confidence: `medium`
- Supersedes roadmap version: `none`

## Context Snapshot

- Product / repo: `workspace-lite`
- Project stage: early beta for small internal teams
- Users: team leads sharing a workspace with 2-10 collaborators
- Pain: invite flow exists, but sharing still feels manual
- Existing workaround: users highlight the invite URL field and copy it by hand
- Strongest demand evidence: repeated support notes saying "copying the link feels broken"
- Why now: sharing friction blocks the first successful invite loop
- Distribution path: direct beta onboarding
- Deadline / forcing function: next beta reset on `2026-04-22`
- Team / capacity: one product-minded engineer
- Hard constraints: no API changes, no invite permission redesign
- Adoption / trust bottleneck: users hesitate when a basic collaboration action feels unfinished
- Known unknowns: whether users also need a copied-state confirmation toast

## Evidence Ledger

| Signal | Evidence | Confidence | Source | Why it matters |
|--------|----------|------------|--------|----------------|
| Demand | Beta users ask how to copy the invite URL | High | support notes | Sharing is a real bottleneck |
| Timing | Beta reset is one week away | High | launch plan | The fix must land this cycle |
| Feasibility | Existing dialog already renders the URL and clipboard API is available | High | current UI behavior | This is a tiny patch, not a redesign |
| Distribution | Successful sharing unlocks more beta seats | Med | product notes | A smoother invite loop increases activation |

## Route Options

| Shape | Why this could work | Why this may fail | Decision |
|-------|---------------------|-------------------|----------|
| wedge-first | Remove the sharpest sharing pain now | May leave deeper invite roles for later | Recommended |
| platform-first | Rebuild all sharing plumbing before polish | Too large for the current window | Rejected |
| rescue-first | Focus only on onboarding docs and support | Does not fix the broken-feeling UI | Rejected |

## Recommended Route

- Recommendation: `wedge-first`
- Why this route wins now: the strongest evidence is user friction in the current share path, not missing infrastructure
- Why the rejected routes lose now: both alternatives spend time away from the first visible activation bottleneck
- First signal to watch: users can copy the invite link without asking support
- Kill signal / stop condition: if the fix requires API or permission changes, reopen planning at a larger scope

## Product Thesis

- Users: small teams inviting collaborators during setup
- Pain: manual copying makes the share flow feel unfinished
- Why now: this friction sits directly on the first collaboration moment
- Strategic wedge: polish the existing share path before adding broader collaboration features
- Product promise: basic collaboration should feel one click away
- What we refuse to build yet: invite roles, expiration controls, share analytics
- 6-12 month pull: grow from frictionless invite into stronger collaboration controls

## Stage Overview

| Stage | Goal | Why now | Dependencies | Exit signal | Kill signal | Non-goals |
|-------|------|---------|--------------|-------------|-------------|-----------|
| Stage 1 | Remove first-share friction | Beta activation is blocked here | Existing share dialog | Users can copy the link in one click | Requires backend changes | Permission redesign |
| Stage 2 | Add safer invite controls | Only after the basic share action feels complete | Stable share interaction | Invite options are trusted | Stage 1 still confuses users | Analytics |
| Stage 3 | Measure collaboration adoption | Only after sharing is reliable | Stage 1 and 2 complete | Teams repeatedly invite collaborators | Usage remains too low to justify analytics | Growth experiments outside collaboration |

## Stage Detail

### Stage 1

- Goal: make the first invite flow feel complete
- Users unlocked: team leads onboarding collaborators
- Why this stage exists: collaboration cannot feel credible while copying the invite link is awkward
- Entry assumptions: existing invite link source remains stable
- Deliverables: one-click copy action, user feedback, targeted verification
- Dependencies: current share dialog and invite URL field
- Win condition: a user can click once and get confirmation
- Key risks: clipboard failure path may be unclear
- Kill signal: patch expands into cross-module share redesign
- What must stay out: new backend contract, new invite settings
- Candidate roadmap items: `RM-001`, `RM-002`

### Stage 2

- Goal: make invite controls safer
- Users unlocked: team leads managing collaborator access
- Why this stage exists: once sharing works, control and trust become the next bottleneck
- Entry assumptions: Stage 1 removed the basic friction
- Deliverables: role-aware invite options
- Dependencies: stable Stage 1 behavior
- Win condition: users no longer need manual role guidance
- Key risks: scope grows into auth redesign
- Kill signal: collaboration usage stays too low
- What must stay out: analytics dashboard
- Candidate roadmap items: `RM-003`

### Stage 3

- Goal: measure and improve collaboration adoption
- Users unlocked: operators deciding where to invest next
- Why this stage exists: instrumentation matters only after the share loop is credible
- Entry assumptions: Stages 1 and 2 hold steady
- Deliverables: collaboration funnel metrics
- Dependencies: repeated real usage
- Win condition: roadmap decisions use measured invite data
- Key risks: false precision with too little traffic
- Kill signal: beta usage remains tiny
- What must stay out: unrelated acquisition work
- Candidate roadmap items: `RM-004`

## Decision Notes

- Rejected path A: rebuild sharing infrastructure first
- Rejected path B: rely on docs and support instead of fixing the UI
- Open assumptions to verify next: whether a copied-state message is enough or a toast is needed
- What changed in this version: narrowed Stage 1 to the smallest visible sharing fix

## Implementation Tracking
- Tracking source: `roadmap-tracking.json`

<!-- roadmap-tracking:start -->
| RM-ID | Item | Stage | Priority | Primary Capability | Secondary Capabilities | Expected Spec Delta | Depends On | Status | REQ | Progress |
|------|------|------|------|------|------|------|------|------|------|------|
| RM-001 | Add one-click copy action to the share dialog | Stage 1 | P1 | cap-invite-links | - | tighten invite-link copy truth | - | In review | REQ-001 | 100% |
| RM-002 | Add copied-state feedback to the share dialog | Stage 1 | P2 | cap-invite-links | - | extend invite-link feedback truth | RM-001 | Planned | - | 0% |
| RM-004 | Collaboration analytics follow-up | - | - | - | - | - | - | - | - | - |
<!-- roadmap-tracking:end -->
