# Changelog

## v1.5.0 - 2026-05-31

- slim the entrypoint to landing boundary, load table, core flow, and default output
- move GitHub truth preflight and Review Gate Carry-Forward details into `PLAYBOOK.md`
- keep reviewed-verdict and main parity proof in the playbook so landing remains review-first without a thick entrypoint

## v1.4.1 - 2026-05-31

- add a Reviewed Verdict And Main Parity Guard so landing cannot merge on implied approval
- require local main, remote main, and active main worktree parity to be proven by command evidence before declaring landing complete

## v1.4.0 - 2026-05-27

- require landing sessions to carry forward `cc-pr-review` gate coverage for complexity, hardening/productization, and release/readiness facets
- block landing when required facet coverage is missing, stale, failed, blocked, changes-requested, or marked `must-fix-before-release`
- route missing/stale review coverage back to `cc-pr-review` and concrete implementation fixes back to `cc-dev`

## v1.3.1 - 2026-05-20

- require `gh` resolution through PATH and common install paths before declaring it unavailable
- require authenticated GitHub truth for PRs, reviews, and checks, with anonymous `404` treated as a stop condition
- clarify that fetched refs and `git ls-remote` are branch evidence only, not PR truth substitutes

## v1.3.0 - 2026-05-18

- add a Default Output contract for PR landing status, review proof, main parity, and blockers

## 1.2.0

- add a landing checklist contract for review freshness, rebase truth, conflict intent, requirement preservation, merge result, and local/remote main parity proof

## 1.0.0

- Added review-first, rebase-first PR landing workflow with main parity proof.
