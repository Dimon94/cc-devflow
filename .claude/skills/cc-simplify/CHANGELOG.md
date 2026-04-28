# CC-Simplify Skill Changelog

## v1.4.0 - 2026-04-28

- add deep-module architecture review checks for shallow wrappers, hypothetical seams, and complexity that should move behind a smaller interface
- require architecture findings to pass a deletion test before cleanup deletes, keeps, or reshapes a module or helper
- preserve capability invariants and public contracts when evaluating pass-through abstractions

## v1.3.0 - 2026-04-28

- add scope-aware Codex reviewer dispatch with small-diff skip rules and conditional security, API contract, release, frontend performance, and red-team facets
- require reviewer agents to emit JSONL findings with confidence, evidence, fingerprint, specialist, and optional test stubs
- add finding deduplication, multi-specialist confidence boost, confidence gates, and a Fix-First auto-fix vs ask/reroute decision table
- expand testing smell coverage for negative paths, edge cases, isolation, flaky tests, and security enforcement tests
- add false-positive suppressions and a "new diff smells only" boundary so cleanup does not become historical debt sweeping

## v1.2.0 - 2026-04-28

- translate the skill body into Chinese and remove the non-Codex `${AGENT_TOOL_NAME}` placeholder
- define a Codex-native simplification workflow that can use read-only reviewer agents for spec/scope, reuse/structure, and quality/efficiency/test findings
- require findings to be verified against code, usage, requirements, and fresh validation evidence before any cleanup edit is made
- add explicit YAGNI, test-anti-pattern, reroute, and cc-check return rules for cleanup changes

## v1.1.0 - 2026-04-19

- expand `cc-simplify` review scope to catch spec drift alongside reuse, quality, and efficiency issues
- require the cleanup pass to flag missing `change-meta.json` or capability spec sync when behavior changes outrun the spec chain

## v1.0.0 - 2026-04-17

- initial distributed `cc-simplify` maintenance skill for pre-ship cleanup
