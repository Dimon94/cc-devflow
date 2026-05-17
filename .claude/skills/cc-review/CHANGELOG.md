# CC-Review Changelog

## 2.2.3 - 2026-05-17

- require ASCII Branch Chain labels, findings, and evidence summaries to follow the configured output language while keeping connectors ASCII

## 2.2.2 - 2026-05-17

- require ASCII Branch Chains for non-trivial plan, investigation, PR, implementation, and code-smell findings
- route plan and investigation review chains into `task.md` while keeping implementation and PR chains in the response or GitHub review instead of local process files

## 2.2.1 - 2026-05-14

- restore deep review method flow without restoring review process files
- add node-by-node review, risk-lane coverage, finding aggregation, decision question, plan facet, implementation diff, and test-quality guidance
- keep plan review output in `task.md` and implementation review output in the response/user-choice loop

## 2.2.0 - 2026-05-13

- split review exits by branch: plan and investigation reviews write findings directly into `task.md`
- make implementation reviews return findings plus repair options and wait for the user's chosen fix before editing code
- remove all other local review outputs; PR reviews are response/GitHub-only

## 2.1.2 - 2026-05-13

- remove `no-op` routing from review output and use `stop` for clean/no-action endings
- simplify review persistence language to a single no-process-files rule

## 2.1.1 - 2026-05-13

- compress default output to findings, blocking questions, residual risk, and route
- explicitly keep review output in the response or GitHub review only
- forbid JSON/JSONL/Markdown review process files in the output contract

## 2.0.1 - 2026-05-13

- require the shared `resolve-cc-devflow.sh` CLI resolver before writing review lifecycle events
- make missing `review` CLI capability a blocker instead of allowing manual ledger or report-card substitutes
- update review command examples to call `bash "$DEVFLOW" review ...`

## 2.0.0 - 2026-05-13

- break default review output away from Markdown plan/report files and make `review-ledger.jsonl` the required durable record
- add CLI-first lifecycle guidance for `review start`, `record-node`, `add-finding`, `close`, and on-demand `render`
- rename optional machine outputs to `review-findings.json` and `review-agent-results.jsonl`, with legacy `cc-review-*` files retained only as fallback inputs

## 1.3.0

- Added a risk-lane review swarm profile for broad implementation and PR-landing reviews.
- Required `cc-review-plan.md` and `cc-review-report.md` to record intent/regression, security/privacy, performance/reliability, and contracts/coverage lane coverage when applicable.
- Hardened main-thread aggregation so raw reviewer findings are accepted, merged, downgraded, or rejected before becoming final findings.

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
