# BACKLOG

## Backlog Meta

- Roadmap version: `roadmap.v1`
- Skill version: `4.3.1`
- Last synced: `2026-04-19`
- Current focus stage: `Stage 1`
- Tracking source: `roadmap-tracking.json`

## Queue

| RM-ID | Title | Source Stage | Priority | Primary Capability | Secondary Capabilities | Capability Gap | Expected Spec Delta | Evidence | Depends On | Parallel With | Unknowns | Next Decision | Ready |
|------|------|------|------|------|------|------|------|------|------|------|------|------|------|
| RM-001 | Add one-click copy action to the share dialog | Stage 1 | P1 | cap-invite-links | - | share dialog exposes invite URL but not direct copy action | tighten invite-link copy truth | repeated support friction | - | - | copied-state feedback shape | freeze tiny design and execute | Yes |
| RM-002 | Add copied-state feedback to the share dialog | Stage 1 | P2 | cap-invite-links | - | invite links lack durable copied-state feedback after action completion | extend invite-link feedback truth | likely useful after RM-001 | RM-001 | - | toast vs inline state | decide after first patch ships | No |

## Dependency Handoff

- Serial spine: RM-001 -> RM-002
- Parallel-ready next wave: none until RM-001 proves the copy action shape
- Notes on blockers: RM-002 should reuse the final interaction contract from RM-001, not race it

## Ready For Req-Plan

- RM-001:
  - Primary Capability: `cap-invite-links`
  - Secondary Capabilities: `-`
  - Why now: it removes the first visible collaboration friction in the beta flow
  - Success signal: users can copy the invite link with one click
  - Entry constraints: no backend changes, no share dialog redesign
  - Capability gap: share dialog exposes invite URL but not direct copy action
  - Expected spec delta: tighten invite-link copy truth
  - Open risks: clipboard failure copy may still need follow-up UX
  - First planning question: can this stay a tiny-design patch without changing contracts?
  - Required context to load: current share dialog, current invite URL source, existing tests
  - Depends On: `-`
  - Parallel With: `-`
  - Why this is ready now: the ask is narrow, the evidence is real, and the dependency surface is already known

## Parked

- RM-004:
  - Reason parked: collaboration analytics is premature before Stage 1 and 2 prove usage
  - Trigger to reopen: repeated invite usage after beta activation
  - Missing evidence: stable collaboration volume
