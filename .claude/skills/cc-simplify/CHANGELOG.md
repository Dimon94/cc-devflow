# CC-Simplify Skill Changelog

## v1.7.1 - 2026-05-31

- add a Confirmed Smell Gate so speculative cleanup candidates are reported without edits
- require confirmed smells to have code, usage, requirement, and verification facts before simplifying and rechecking

## v1.7.0 - 2026-05-21

- route `ask` simplification decisions through the shared user-choice output protocol before changing public API, user-visible behavior, security boundaries, or broad design
- keep fixed A/B/C text as fallback only when Codex or Claude Code exposes no structured choice tool

## v1.6.0 - 2026-05-18

- add a Default Output contract for simplification findings, fixes, verification, and route decisions

## v1.5.0 - 2026-05-18

- add a simplify-specific checklist contract that preserves the existing smell pipeline as explicit scope, reviewer, evidence, fix, and verification pause points

## v1.4.2 - 2026-05-13

- replace reviewer-agent JSONL findings with short response-only finding lines
- keep dedupe and confidence rules without requiring JSON schemas or process files
- clarify that simplify output is a compact report in the response, not a durable JSON document
- remove old no-op and verification-report wording from simplify output rules

## v1.4.1 - 2026-05-10

- make `cc-simplify` itself the explicit trigger for automatic read-only subagent review in ClaudeCode and Codex environments
- prefer ClaudeCode `Task` / subAgent support or Codex built-in `explorer` / `default` agents without requiring an extra user prompt
- require a truthful fallback report when the host does not expose any subagent tool, instead of pretending subagents ran

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
