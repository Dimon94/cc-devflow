# PR Brief

## Document Meta

- Output language: en

## Requirement

- REQ-002-unified-roadmap-truth

## Ship Mode

- `post-merge-closeout`

## Branch Context

- Current branch: main
- Base branch: main
- PR / MR: none

## Review Range

- Reviewed base SHA: d0d974b6a65e4a967b201e26cb5ae4dc892c568e
- Reviewed head SHA: ac2c98e97965cecd7b7da4685a39a96b4fe1da8a+wtree:755f4478f59f71fe60132be4f0276965776bea7fd5ea634861dce0761e4227ed
- Review packet: devflow/changes/REQ-002-unified-roadmap-truth/task.md
- Finding triage: no findings
- QA / claim evidence: qa=pass, claims=tests-pass:pass, roadmap-state-contract-met:pass, distributed-contract-met:pass, examples-and-docs-current:pass, publish-validation-clean:pass, requirements-met:pass

## Readiness Dashboard

- Review freshness: status=fresh, reviewed=ac2c98e97965cecd7b7da4685a39a96b4fe1da8a+wtree:755f4478f59f71fe60132be4f0276965776bea7fd5ea634861dce0761e4227ed, current=ac2c98e97965cecd7b7da4685a39a96b4fe1da8a+wtree:755f4478f59f71fe60132be4f0276965776bea7fd5ea634861dce0761e4227ed, commitsSinceReview=0
- Review quality: qualityScore=9
- Specialist review facets: testing:pass, api-contract:pass, docs:pass, browser:skipped, security:skipped
- QA coverage: status=pass, coverage=n/a, gaps=1, e2eRequired=false, evalRequired=false
- Browser QA: status=skipped, mode=not-applicable, routes=0, issues=0, consoleErrors=0, skip=REQ-002 changes CLI, skill contract, renderer, docs, and examples; no browser or UI route changed.
- Feedback loop: status=pass, mode=automated-test-and-shell-validation, determinism=high, reproductionRate=1/1 fresh cc-check run
- Behavior evidence: status=pass, boundary=cc-roadmap operator and downstream agent workflow, expected=roadmap.json is the editable roadmap state; ROADMAP.md and deprecated BACKLOG.md are generated projections; helper commands prefer roadmap.json while preserving legacy migration fallback., actual=Fresh tests and validation gates verify v3 state rendering, legacy upgrade, generated Mermaid architecture, deprecated BACKLOG notice, helper lookup/sync priority, public metadata, and examples., steps=4
- Failure ownership: no open failures recorded
- Documentation release: CLAUDE=see doc-sync-report.md; README=see doc-sync-report.md
- PR body accuracy: body must be regenerated from this pr-brief, current validation evidence, and current diff before PR create/update

## Summary

- verdict=pass; fresh gates prove roadmap.json state, generated projections, helper priority, public contract metadata, examples, Codex mirror parity, publish validation, and diff hygiene.

## What Changed

- T001 [TEST] Add failing v3 roadmap state and legacy upgrade coverage (dependsOn:none) `test/roadmap-tracking.test.js`
- T002 [IMPL] Implement v3 roadmap state normalization and legacy upgrade (dependsOn:T001) `.claude/skills/cc-roadmap/scripts/lib/roadmap-tracking/schema.js`
- T003 [TEST] Add failing render coverage for ROADMAP and deprecated BACKLOG projection (dependsOn:T002) `test/roadmap-tracking.test.js`
- T004 [IMPL] Render roadmap view, architecture diagram, and deprecated backlog projection (dependsOn:T003) `.claude/skills/cc-roadmap/scripts/lib/roadmap-tracking/markdown.js`
- T005 [TEST] Add failing locator and sync priority coverage for roadmap.json (dependsOn:T004) `test/locate-roadmap-item.test.js`
- T006 [IMPL] Update helper defaults and compatibility aliases (dependsOn:T005) `.claude/skills/cc-roadmap/scripts/locate-roadmap-item.sh`
- T007 [TEST] Add failing public contract tests for roadmap outputs (dependsOn:T006) `lib/compiler/__tests__/skills-registry.test.js`
- T008 [IMPL] Update cc-roadmap source contract, templates, and changelog (dependsOn:T007) `.claude/skills/cc-roadmap/SKILL.md`
- T009 [TEST] Add failing example validation expectations for roadmap.json (dependsOn:T008) `docs/examples/scripts/check-example-bindings.sh`
- T010 [IMPL] Update examples, docs, and generated Codex mirror (dependsOn:T009) `docs/examples/pdca-loop/roadmap.json`
- T011 [REFACTOR] Simplify roadmap state renderer after green behavior (dependsOn:T002,T004,T006) `.claude/skills/cc-roadmap/scripts/lib/roadmap-tracking/store.js`
- T012 [VERIFY] Run full planning gates for cc-check handoff (dependsOn:T010,T011) `devflow/changes/REQ-002-unified-roadmap-truth/`

## Verification Evidence

- `` verdict: pass
- Act verification on `main`: refreshed on the current working tree before closeout; all commands below exited 0.
- npm test -- --runInBand exited 0; 41 test suites and 275 tests passed.
- npm run adapt:check exited 0; No drift detected.
- npm run verify:examples exited 0; Example bindings are in sync with current skill versions.
- npm run verify:publish exited 0; Pack runtime smoke passed and publish validation passed.
- git diff --check exited 0; no whitespace errors were reported.
- rg old-roadmap-truth scan exited 0; remaining roadmap-tracking.json mentions are legacy fallback, migration notes, changelog history, or regression tests.
- - tests-pass: pass via npm test -- --runInBand - 41 test suites and 275 tests passed in this run.
- - roadmap-state-contract-met: pass via npm test -- --runInBand - test/roadmap-tracking.test.js and test/locate-roadmap-item.test.js passed inside the full suite.
- - distributed-contract-met: pass via npm test -- --runInBand && npm run adapt:check - cc-roadmap public metadata now exposes required devflow/roadmap.json and optional deprecated devflow/BACKLOG.md, and Codex mirror has no drift.
- - examples-and-docs-current: pass via npm run verify:examples - Example bindings are in sync with current skill versions and examples require roadmap.json.
- - publish-validation-clean: pass via npm run verify:publish - Pack runtime smoke passed and publish validation passed.
- - requirements-met: pass via devflow/changes/REQ-002-unified-roadmap-truth/task.md +  - T001 through T012 are checked off, manifest status is implemented, currentTaskId is null, and every task has spec/code review pass.
- - qa.coverage: pass, gaps=1
- - qa.browser: skipped, mode=not-applicable
- - qa.feedbackLoop: pass, mode=automated-test-and-shell-validation, signal=Failures point to roadmap state contract, helper priority, public metadata, example drift, publish package validity, or diff hygiene.
- - qa.behavior: pass, expected=roadmap.json is the editable roadmap state; ROADMAP.md and deprecated BACKLOG.md are generated projections; helper commands prefer roadmap.json while preserving legacy migration fallback., actual=Fresh tests and validation gates verify v3 state rendering, legacy upgrade, generated Mermaid architecture, deprecated BACKLOG notice, helper lookup/sync priority, public metadata, and examples.

## QA Behavior Evidence

- Feedback loop: status=pass, mode=automated-test-and-shell-validation, determinism=high, reproductionRate=1/1 fresh cc-check run
- Behavior evidence: status=pass, boundary=cc-roadmap operator and downstream agent workflow, expected=roadmap.json is the editable roadmap state; ROADMAP.md and deprecated BACKLOG.md are generated projections; helper commands prefer roadmap.json while preserving legacy migration fallback., actual=Fresh tests and validation gates verify v3 state rendering, legacy upgrade, generated Mermaid architecture, deprecated BACKLOG notice, helper lookup/sync priority, public metadata, and examples., steps=4
- Reproduction step: run npm test -- --runInBand
- Reproduction step: run npm run adapt:check
- Reproduction step: run npm run verify:examples
- Reproduction step: run npm run verify:publish
- Domain language: roadmap.json
- Domain language: roadmap state
- Domain language: generated projection
- Domain language: deprecated BACKLOG.md projection
- Domain language: architecture nodes
- Domain language: architecture edges

## Documentation Sync

- `CLAUDE.md`: see doc-sync-report.md
- `README.md`: see doc-sync-report.md
- `pr-brief.md`: refreshed
- ``: refreshed

## How To Verify

- `npx jest test/roadmap-tracking.test.js --runInBand`
- `npx jest test/locate-roadmap-item.test.js test/roadmap-tracking.test.js --runInBand`
- `npx jest lib/compiler/__tests__/skills-registry.test.js lib/skill-runtime/__tests__/cli-bootstrap.integration.test.js --runInBand`
- `npm run verify:examples`
- `npm run adapt:codex`
- `npm run adapt:check`
- `npx jest test/roadmap-tracking.test.js test/locate-roadmap-item.test.js --runInBand`
- `npm test -- --runInBand`
- `npm run verify:publish`
- `git diff --check`

## Follow-Ups

- summary: Decide the release where deprecated BACKLOG.md projection is removed. | current: BACKLOG.md is generated as a compatibility projection for one release. | desired: A future roadmap decision removes the deprecated projection after downstream compatibility evidence is collected. | interfaces: cc-roadmap, docs/examples, downstream project initialization | acceptance: Downstream refresh evidence shows roadmap.json adoption; Docs and examples no longer require BACKLOG.md projection | out-of-scope: Removing BACKLOG.md in REQ-002
- Which future release removes deprecated BACKLOG.md output?
- Should architecture diagrams support grouped subgraphs after flat node/edge usage proves insufficient?
- When should downstream projects be upgraded after this requirement lands?

## Risks

- Deprecated `BACKLOG.md` remains as a generated compatibility projection for one release, so downstream cleanup must happen in a later roadmap item instead of this requirement.
