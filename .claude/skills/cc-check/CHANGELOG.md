# CC-Check Skill Changelog

## v1.8.4 - 2026-04-28

- add review freshness, quality score, specialist review facets, and finding confidence fingerprints so stale or noisy review evidence cannot masquerade as current proof
- add QA coverage audit and browser evidence fields for user-flow, route, screenshot, console, and skip-reason proof
- add runtime failure ownership so failing commands are classified as in-branch, pre-existing, environment, or ambiguous before verdict selection
- update the report-card template, renderer, and gate validation for the richer review and QA evidence shape

## v1.8.3 - 2026-04-28

- add native claim evidence matrix guidance so each completion claim maps to command or artifact proof
- add QA regression and test-quality review fields for red/green proof, mock boundaries, and test-only API smells
- require review packets and finding triage so review results can be audited without chat memory
- update report-card template, renderer, and gate validation for optional `claimEvidence` and `qa` fields

## v1.8.2 - 2026-04-27

- require verification reports to resolve the runtime output policy before writing human-readable verdicts or summaries
- record `Output language` as the machine-enforced language contract while treating `agent_preferences` as advisory style input

## v1.8.1 - 2026-04-25

- remove external tool provenance from the public skill contract so diff review reads as native `cc-check` behavior
- keep plan completion, scope drift, critical pass, outside-diff lookup, and documentation staleness requirements unchanged

## v1.8.0 - 2026-04-24

- add the native `cc-check` requirement diff review contract
- add plan completion audit, scope drift detection, critical pass categories, outside-diff lookup, documentation staleness, and adversarial synthesis to the review pipeline
- require findings to carry severity, confidence, source, evidence, and action so report cards route failures without chat-memory interpretation

Migration note:

- new `review/report-card.json` files should populate `review.diffReview` with plan completion, scope drift, critical pass, and documentation staleness facts when applicable

## v1.7.0 - 2026-04-23

- tighten the public skill around an explicit `NO PASS WITHOUT FRESH EVIDENCE` iron law so `cc-check` cannot degrade into inherited narration from `cc-do`
- add a four-phase verification model, layered boundary checks, and stop-reset signals in native verification semantics
- clarify that runtime gates, review proof, requirement diff truth, and spec sync readiness are separate layers and any single-layer drift blocks `pass`

## v1.6.0 - 2026-04-19

- extend `report-card.json` with `specAlignment`, `specDeltaVerified`, `specSyncReady`, and `gaps` so closeout can judge spec readiness directly
- teach the report renderer to derive spec verification signals from manifest capability metadata
- relax gate validation to accept both existing reports and the richer spec-aware fields during the transition

Migration note:

- new `cc-check` runs should write the spec-aware report fields
- old reports remain structurally valid during migration

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
