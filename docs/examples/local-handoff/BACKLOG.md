# BACKLOG

## Backlog Meta

- Roadmap version: `roadmap.v3`
- Skill version: `2.2.0`
- Last synced: `2026-04-16`
- Current focus stage: `Stage 2`

## Queue

| RM-ID | Title | Source Stage | Priority | Evidence | Dependency | Unknowns | Next Decision | Ready |
|------|-------|--------------|----------|----------|------------|----------|---------------|-------|
| RM-020 | Add an audit-log export summary download | Stage 2 | P1 | repeated admin reporting pain | existing audit log page | CSV vs JSON follow-up | hand off locally for final maintainer review | Yes |

## Ready For CC-Plan

- RM-020:
  - Why now: admins already rely on audit history and need a simple export path
  - Success signal: admins can download a summary without manual copy/paste
  - Entry constraints: no shared reporting service and no format explosion
  - Open risks: later requests may expand into richer export modes
  - First planning question: can this stay inside the existing admin audit UI?
  - Required context to load: current audit log page, summary fields, export button surface
  - Why this is ready now: the operator pain is clear and the first patch can stay local
