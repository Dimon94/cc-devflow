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
| RM-020 | Add an audit-log export summary download | Stage 2 | P1 | cap-audit-log-export | - | admins can export raw audit data but not a compact summary for review | codify local export summary truth | support escalations keep asking for a lightweight summary bundle | - | - | csv-only or csv-plus-markdown summary | resume from local handoff once remote access returns | Yes |

## Dependency Handoff

- Serial spine: RM-020
- Parallel-ready next wave: -
- Notes on blockers: export work stays local-only until the next maintainer has remote access

## Ready For Req-Plan

- RM-020:
  - Primary Capability: `cap-audit-log-export`
  - Secondary Capabilities: `-`
  - Why now: the implementation and proof already exist, only the landing path is deferred
  - Success signal: admins can download a concise audit summary without manual spreadsheet cleanup
  - Entry constraints: stay local-only and avoid remote automation
  - Capability gap: admins can export raw audit data but not a compact summary for review
  - Expected spec delta: codify local export summary truth
  - Open risks: handoff may age if schema changes before the next maintainer resumes
  - First planning question: does the summary format need another review before remote landing?
  - Required context to load: admin export screen, generated summary fixture, local handoff notes
  - Depends On: `-`
  - Parallel With: `-`
  - Why this is ready now: the requirement is already proven and only needs a clean resume point

## Parked

- RM-XXX:
  - Reason parked:
  - Trigger to reopen:
  - Missing evidence:
