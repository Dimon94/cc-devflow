# CC-Check Skill Changelog

## v1.5.0 - 2026-04-17

- accept `ANALYSIS.md` as an upstream verification contract so investigated bug fixes can flow through the same evidence gate
- add `cc-investigate` as an explicit reroute target when verification disproves the current root-cause story
- teach report rendering and gate validation scripts about the new reroute so blocked bug fixes stop at the right stage

## v1.4.0 - 2026-04-17

- move quality-gate execution and report-card assembly into skill-local scripts so `lib/harness/operations/verify.js` becomes a thinner shell
- add `scripts/render-report-card.js` as the skill-local report renderer
- teach `run-quality-gates.sh` to emit `skipped` gates explicitly instead of faking green passes for missing scripts

Migration note:

- `report-card.json` shape stays compatible
- internal callers should prefer the cc-check scripts for gate execution and report rendering logic

## v1.3.0 - 2026-04-17

- add structured frontmatter contract fields so cc-check can be consumed as an independent evaluator stage
- add `Harness Contract` and `Visible State Machine` to make pass/fail/blocked routing explicit in the public skill surface
- tighten the clean-room reset language so verdicts are rebuilt from fresh evidence instead of execution narration

Migration note:

- `report-card.json` shape remains compatible
- publish validation and registry generation now expect the new frontmatter keys on this public skill

## v1.2.0 - 2026-04-15

- upgrade `REPORT_CARD_TEMPLATE.json` with realistic gate, review, and blocking examples
- make the default template teach reroute and evidence quality on first read

## v1.1.0 - 2026-04-15

- add `version` frontmatter and semver tracking
- add stronger trigger phrases in frontmatter
- add `Quick Start` to classify evidence reality before selecting a verdict
- strengthen `Good Output` expectations so reroute and proof are obvious on first read
