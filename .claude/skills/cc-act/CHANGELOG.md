# CC-Act Skill Changelog

## v1.6.1 - 2026-04-25

- remove external tool provenance from the public skill contract so ship and documentation release rules read as native `cc-act` behavior
- keep idempotent ship, documentation audit, changelog protection, and PR regeneration requirements unchanged

## v1.6.0 - 2026-04-24

- add the native `cc-act` ship and documentation closeout contract
- add ship hygiene rules for base detection, version/package/changelog drift, bisectable commits, final verification, push idempotency, and PR idempotency
- strengthen documentation release rules so README/CLAUDE/architecture/handoff/changelog/TODO updates are audited from the final diff before PR or handoff
- require PR bodies to be regenerated from current `cc-check`, scope drift, plan completion, verification, documentation, and test-plan facts

Migration note:

- new `create-pr` and `update-pr` closeouts should treat documentation sync and PR-body regeneration as first-class ship steps rather than optional post-processing

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
