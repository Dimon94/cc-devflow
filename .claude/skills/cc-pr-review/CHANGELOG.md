# Changelog

## v1.7.1 - 2026-05-31

- add an API Contract Landing Blocker so changed public API contracts without proof tests cannot route to `cc-pr-land`
- require blockers to cite the PR diff hunk, changed contract surface, and missing contract, regression, or caller proof

## v1.7.0 - 2026-05-24

- add PR-scoped hardening specialist selection for security, observability, release-readiness, and test-strategy risk
- add PR-scoped productization surface review so API, agent, audit, admin, feature flag, idempotency, and operator gaps can block or route landing
- require selected PR hardening/productization facets to close as checked, skipped, or blocked with proof path and residual risk

## v1.6.0 - 2026-05-19

- add mandatory Phenomenal, Essential, and Philosophical cognitive layers to non-trivial PR review chains
- require PR findings to follow the fixed thought path from phenomenon intake through essence diagnosis, philosophy reflection, essence integration, and phenomenon output

## v1.5.0 - 2026-05-19

- require non-trivial PR review chains to record evidence, diagnosis, causal path, at least three upstream layers, and at least three downstream layers
- extend the PR Review Chain template with explicit upstream PR/task/proof and downstream seam/behavior/release-risk sections

## v1.4.0 - 2026-05-18

- add a Default Output contract for remote PR review verdicts and route decisions

## 1.3.0

- inline the complexity hotspot scanner and optimization references so PR review can use complexity-optimizer behavior without an external skill dependency
- add PR-scoped complexity review for nested scans, repeated membership checks, sort-in-loop, render recomputation, and N+1 database/API patterns
- require complexity findings to include before/after complexity estimates, behavior-equivalence risk, and needed tests or measurements

## 1.2.0

- add a remote-PR checklist contract so review pauses on live GitHub truth, linked task evidence, checks, diff findings, and landing route before any recommendation

## 1.1.3

- require ASCII PR Review Chain labels, findings, and evidence summaries to follow the PR/task/handoff output language while keeping connectors ASCII
- replace hard-coded English PR Review Chain examples with an `en` / `zh-CN` label table and semantic slots

## 1.1.2

- require ASCII PR Review Chains for non-trivial remote PR findings without creating local process files

## 1.1.1

- simplify PR review output persistence to a no-process-files rule

## 1.0.0

- Added independent remote PR review workflow that separates review from landing.
