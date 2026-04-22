# CC-Act Skill Changelog

## v1.5.1 - 2026-04-22

- make `cc-act` compatible with the newer `report-card.json` schema by extracting verification commands from `quickGates` / `strictGates` when top-level `evidence` is absent
- let handoff rendering reuse gate summaries as evidence so `pr-brief.md`, `release-note.md`, and `resume-index.md` still carry proof after schema evolution
- treat spec sync as already closed when `specSyncReady=true` instead of blindly repeating the old closeout reminder

## v1.5.0 - 2026-04-19

- require `cc-act` to finish formal spec synchronization before ship closeout when `cc-check` marks `specSyncReady=true`
- surface spec sync state and target capability files in `sync-act-docs.sh` outputs so closeout materials stay aligned with capability truth
- tighten act entry rules so a passing report without spec readiness can no longer masquerade as a complete closeout

Migration note:

- change closeout now expects `change-meta.json`, related capability specs, and `report-card.json.specSyncReady`

## v1.4.1 - 2026-04-18

- compress duplicated commit-rule summaries in `SKILL.md` and `PLAYBOOK.md` so `references/git-commit-guidelines.md` stays the single truth source
- keep only stage-level enforcement language in the main docs and move commit-detail semantics fully behind the reference
- reduce drift risk between skill overview text and playbook execution text

## v1.4.0 - 2026-04-18

- add `references/git-commit-guidelines.md` as the canonical commit-history reference for `cc-act`
- require `create-pr` and `update-pr` flows to generate commit messages and commit boundaries by that guideline instead of relying on vague "clear message" wording
- surface the commit guideline in `Read First`, bundled resources, playbook integration steps, and working rules so commit generation has one explicit truth source

## v1.3.0 - 2026-04-18

- add an explicit pre-ship validation stage for `cc-simplify`, unit tests, and coordinator-directed e2e runs
- require `create-pr` and `update-pr` flows to commit verified changes, push the branch, and use `gh pr create` or refresh the existing PR instead of duplicating it
- tighten reroute rules so any simplify or test-driven code change sends the requirement back through `cc-check` before act can continue

## v1.2.0 - 2026-04-17

- add structured frontmatter contract fields so cc-act exposes ship-mode rules, reroutes, recovery, and tool budget directly in the skill
- add `Harness Contract` and `Visible State Machine` to make closeout behavior readable without internal harness code
- add memory-consolidation guidance so delivery truth is compressed into status, brief, and resume artifacts before handoff

Migration note:

- existing `pr-brief.md`, `status-report.md`, and `resume-index.md` files remain valid
- registry and publish tooling now expect the new public frontmatter keys on this skill

## v1.1.0 - 2026-04-15

- add stronger trigger phrases in frontmatter
- add `Quick Start` mode selector for first-use clarity
- add `Minimum Output By Mode` to reduce overproduction
- add `Good Output` criteria so ship materials stay concise and mode-aware
- align protocol and read-first sections with versioned changelog workflow
