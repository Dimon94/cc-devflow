# CC-Act Skill Changelog

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
