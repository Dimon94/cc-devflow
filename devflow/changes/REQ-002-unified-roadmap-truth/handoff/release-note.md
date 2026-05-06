# Release Note

## Document Meta

- Output language: en

## User Impact

- verdict=pass; fresh gates prove roadmap.json state, generated projections, helper priority, public contract metadata, examples, Codex mirror parity, publish validation, and diff hygiene.

## What Is New
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
- T012 [VERIFY] Run full planning gates for cc-check handoff (dependsOn:T010,T011) `devflow/changes/REQ-002-unified-roadmap-truth/review/report-card.json`

## Verification

- CC-Check verdict: pass
- npm test -- --runInBand exited 0; 41 test suites and 275 tests passed.
- npm run adapt:check exited 0; No drift detected.
- npm run verify:examples exited 0; Example bindings are in sync with current skill versions.
- npm run verify:publish exited 0; Pack runtime smoke passed and publish validation passed.
- git diff --check exited 0; no whitespace errors were reported.
- rg old-roadmap-truth scan exited 0; remaining roadmap-tracking.json mentions are legacy fallback, migration notes, changelog history, or regression tests.
- Verify with: `npx jest test/roadmap-tracking.test.js --runInBand`
- Verify with: `npx jest test/locate-roadmap-item.test.js test/roadmap-tracking.test.js --runInBand`
- Verify with: `npx jest lib/compiler/__tests__/skills-registry.test.js lib/skill-runtime/__tests__/cli-bootstrap.integration.test.js --runInBand`
- Verify with: `npm run verify:examples`
- Verify with: `npm run adapt:codex`
- Verify with: `npm run adapt:check`
- Verify with: `npx jest test/roadmap-tracking.test.js test/locate-roadmap-item.test.js --runInBand`
- Verify with: `npm test -- --runInBand`
- Verify with: `npm run verify:publish`
- Verify with: `git diff --check`

## Ops Notes

- Ship mode: post-merge-closeout
- Spec sync ready: true
- Current branch: main
- Base branch: main
- PR status: none

## Follow-Ups

- summary: Decide the release where deprecated BACKLOG.md projection is removed. | current: BACKLOG.md is generated as a compatibility projection for one release. | desired: A future roadmap decision removes the deprecated projection after downstream compatibility evidence is collected. | interfaces: cc-roadmap, docs/examples, downstream project initialization | acceptance: Downstream refresh evidence shows roadmap.json adoption; Docs and examples no longer require BACKLOG.md projection | out-of-scope: Removing BACKLOG.md in REQ-002
- Which future release removes deprecated BACKLOG.md output?
- Should architecture diagrams support grouped subgraphs after flat node/edge usage proves insufficient?
- When should downstream projects be upgraded after this requirement lands?
