# BACKLOG

## Backlog Meta

- Roadmap version: `roadmap.v1`
- Skill version: `4.0.0`
- Last synced: `2026-04-15`
- Current focus stage: `Stage 1`

## Queue

| RM-ID | Title | Source Stage | Priority | Evidence | Dependency | Unknowns | Next Decision | Ready |
|------|-------|--------------|----------|----------|------------|----------|---------------|-------|
| RM-001 | Add one-click copy action to the share dialog | Stage 1 | P1 | repeated support friction | existing share dialog | copied-state feedback shape | freeze tiny design and execute | Yes |
| RM-002 | Add copied-state feedback to the share dialog | Stage 1 | P2 | likely useful after RM-001 | RM-001 outcome | toast vs inline state | decide after first patch ships | No |

## Ready For CC-Plan

- RM-001:
  - Why now: it removes the first visible collaboration friction in the beta flow
  - Success signal: users can copy the invite link with one click
  - Entry constraints: no backend changes, no share dialog redesign
  - Open risks: clipboard failure copy may still need follow-up UX
  - First planning question: can this stay a `tiny-design` patch without changing contracts?
  - Required context to load: current share dialog, current invite URL source, existing tests
  - Why this is ready now: the ask is narrow, the evidence is real, and the dependency surface is already known

## Parked

- RM-004:
  - Reason parked: collaboration analytics is premature before Stage 1 and 2 prove usage
  - Trigger to reopen: repeated invite usage after beta activation
  - Missing evidence: stable collaboration volume
