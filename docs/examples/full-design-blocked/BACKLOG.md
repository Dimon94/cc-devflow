# BACKLOG

## Backlog Meta

- Roadmap version: `roadmap.v2`
- Skill version: `4.0.0`
- Last synced: `2026-04-16`
- Current focus stage: `Stage 2`

## Queue

| RM-ID | Title | Source Stage | Priority | Evidence | Dependency | Unknowns | Next Decision | Ready |
|------|-------|--------------|----------|----------|------------|----------|---------------|-------|
| RM-010 | Add CSV bulk invite import for admins | Stage 2 | P1 | repeated admin demand | billing and audit rules | duplicate and partial-failure behavior | reopen full design and freeze import semantics | No |

## Ready For CC-Plan

- RM-010:
  - Why now: larger-team onboarding now needs admin-scale invite tools
  - Success signal: admins can import a CSV and predict every outcome
  - Entry constraints: billing seats, duplicate users, and audit logs must stay consistent
  - Open risks: current implementation evidence shows the semantics are still underspecified
  - First planning question: what is the single source of truth for duplicate handling and seat-limit enforcement?
  - Required context to load: admin invite flow, billing rules, audit log rules, current diff
  - Why this is ready now: the pain is real, but the design must be reopened before execution can honestly continue
