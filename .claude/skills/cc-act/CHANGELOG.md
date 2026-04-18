# CC-Act Skill Changelog

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
