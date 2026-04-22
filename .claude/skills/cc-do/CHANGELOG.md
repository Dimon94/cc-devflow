# CC-Do Skill Changelog

## v1.4.3 - 2026-04-22

- serialize manifest review updates in `record-review-decision.sh` so parallel `spec` / `code` writes no longer clobber each other
- serialize checkpoint, `events.jsonl`, and task completion writes so concurrent `cc-do` workers stop overwriting each other's runtime truth
- add a shared mkdir-based lock helper in `cc-do-common.sh` for macOS-safe coordination without `flock`

## v1.4.2 - 2026-04-22

- align `cc-do` helper scripts with the canonical `devflow/changes/<change-key>/{planning,execution,review,handoff}` layout instead of special-casing flat paths
- teach `mark-task-complete.sh` to resolve canonical change roots before gate checks so planning-path inputs no longer break closeout
- strengthen spec-link validation so dangling capability-map entries, `secondaryCapabilities`, and `specFiles` are caught before closeout

## v1.4.1 - 2026-04-21

- teach `scripts/select-ready-tasks.sh` to treat `externalDep` as a first-class readiness gate instead of pretending only intra-manifest `dependsOn` exists
- add an explicit `externalDepsReady` / `externalDepStatus=ready|satisfied|done|passed|verified` unlock path so cross-REQ or fixture gates stop relying on chat memory
- expose `waitingOnInternal` and `waitingOnExternal` separately in ready-task summaries, and surface external gates in `build-task-context.sh`

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
