# CC-Review Changelog

## 1.2.0

- Added automatic read-only reviewer subAgent dispatch for selected plan and implementation review nodes.
- Required reviewer packets to be self-contained so each subAgent works from independent context instead of inherited chat assumptions.
- Added `cc-review-agent-results.jsonl` for raw reviewer outputs and report-level accepted/merged/downgraded/rejected triage.
- Required truthful main-thread fallback when the host does not expose subAgent tools.

## 1.1.0

- Added stateful review planning with `cc-review-plan.md` and per-node `cc-review-ledger.jsonl`.
- Required prior review records and git/artifact deltas before re-reviewing the same plan or implementation.
- Replaced short finding-list behavior with node-by-node review, per-node checks, and no artificial finding cap.
- Added decision queues so user-judgment findings are collected after traversal and confirmed one by one before non-mechanical fixes.
- Added `cc-simplify` selection guidance for code-smell and simplification review nodes.

## 1.0.0

- Added `cc-review` as an optional deep review workflow that branches between plan-stage and implementation-stage review.
- Added progressive references for TOC/root-cause methods, plan review, implementation review, and Codex plugin E2E verification.
- Added durable review report and structured findings output contracts.
