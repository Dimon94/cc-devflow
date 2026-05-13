# CC-Check Skill Changelog

## v1.11.4 - 2026-05-13

- require the shared `resolve-cc-devflow.sh` CLI resolver before reading workflow context or review truth
- block verification when the available CLI cannot prove `query workflow-context` and `review` support
- forbid replacing missing review truth or report-card generation with simulated adapter output or handwritten artifacts

## v1.11.3 - 2026-05-13

- make `review/report-card.json` script-owned: agents must regenerate it through `scripts/render-report-card.js` and validate it with `scripts/verify-gate.sh`
- forbid direct manual edits to report-card fields such as timestamp, summary, QA/browser evidence, UAT, claim evidence, or reroute
- route unsupported evidence shapes back into renderer/schema changes instead of allowing one-off JSON patching

## v1.11.2 - 2026-05-13

- internalize verification operating rules so conflicting proof sources must be resolved explicitly instead of averaged
- block `pass` when gates are skipped, evidence is stale, ownership is ambiguous, or tests prove implementation shape instead of user intent
- retarget investigated bug verification to `planning/tasks.md#Root Cause Contract`

## v1.11.1 - 2026-05-13

- treat `passed`, `done`, `completed`, and `verified` task statuses as complete when rendering the `requirements-met` claim evidence
- keep report-card task-gap detection aligned with `mark-task-complete.sh` and shared lifecycle status semantics

## v1.11.0 - 2026-05-13

- read requirement-level review truth from `review-findings.json` first, then `review-ledger.jsonl`, then legacy `cc-review-report.md`
- block with `review-missing` when no machine review record or legacy report exists
- document that legacy Markdown fallback has unknown freshness and cannot silently support a high-confidence pass

## v1.10.2 - 2026-05-12

- add a `workflow-context` context-index reset before verification so `cc-check` starts from current next-action truth instead of full artifact reload
- make deep verification reads conditional on the workflow context `openWhen.conditions` triggers
- preserve fresh-evidence requirements while reducing default context needed to choose `cc-check` vs reroute

## v1.10.1 - 2026-04-29

- add named runtime failure fields with artifact references, owners, and rescue actions
- add human UAT evidence to the report card so manual acceptance can block or reroute honestly
- require review findings to carry explicit rescue actions instead of vague follow-up text

## v1.10.0 - 2026-04-28

- add test fixture honesty review for partial fixtures, generated stubs, casts, and missing mock payload fields
- require fixture shortcuts to preserve public seam behavior instead of hiding contract or input-shape problems

## v1.9.0 - 2026-04-28

- add QA feedback-loop evidence so bugfix and behavior checks record reproduction mode, determinism, signal quality, and blocked loop reasons before a pass verdict
- add behavior evidence fields for expected behavior, actual behavior, reproduction steps, consistency, and domain language
- tighten test-quality review around public-interface tests, system-boundary mocks, and architecture follow-ups when no correct test seam exists
- update the report-card template, renderer, and gate validation for the new QA evidence shape while keeping older reports structurally compatible

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
