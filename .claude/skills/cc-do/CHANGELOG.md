# CC-Do Skill Changelog

## v1.5.0 - 2026-04-24

- absorb `superpowers/test-driven-development` into the `cc-do` execution contract with an explicit `NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST` rule
- require Red failure reason verification, post-refactor Green evidence, and checkpoint fields that make TDD proof resumable
- add a narrow TDD exception contract so prototypes, generated files, and config-only changes cannot silently bypass test-first execution

Migration note:

- new task checkpoints should record `red`, `green`, `refactor`, and optional `tddException` fields before `cc-check` verifies the task

## v1.4.0 - 2026-04-19

- require `cc-do` to load `change-meta.json` and related capability specs before coding so execution stops guessing long-term constraints
- extend `build-task-context.sh` with primary capability, spec files, expected spec delta, and sync status
- make the execution contract explicit that `cc-do` validates spec alignment but does not mutate long-term spec truth

Migration note:

- new execution contexts should include `change-meta.json` beside `design.md` / `analysis.md`

## v1.3.1 - 2026-04-18

- replace GNU `sed` usage in `scripts/mark-task-complete.sh` with a portable `awk` implementation so task completion works on macOS BSD userlands

## v1.3.0 - 2026-04-17

- split root-cause investigation out of `cc-do` so bug execution now expects a frozen `ANALYSIS.md` handoff from `cc-investigate`
- teach `cc-do` to accept either `DESIGN.md` or `ANALYSIS.md` as the upstream contract
- clarify reroutes so repeated failed bug repairs return to `cc-investigate`, while true scope drift still returns to `cc-plan`

## v1.2.0 - 2026-04-17

- add structured frontmatter contract fields for reads, writes, reroutes, recovery, and tool budget
- add `Harness Contract` and `Visible State Machine` so execution boundaries are visible in the skill pack itself
- strengthen context reset and local recovery guidance to prefer checkpoint reload over chat-memory continuation

## v1.1.0 - 2026-04-15

- add `version` frontmatter and semver tracking
- add stronger trigger phrases in frontmatter
- add `Quick Start` to classify execution into implement / resume / cc-investigate-first / review-fix
- add `Good Output` so execution leaves clear recovery and verification evidence
