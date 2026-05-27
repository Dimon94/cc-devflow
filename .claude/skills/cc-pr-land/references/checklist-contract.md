# cc-pr-land Checklist Contract

## Diagnosis

Landing risk concentrates at unauthenticated GitHub reads, stale reviews, lost review-gate coverage, conflict resolution by guesswork, and unproven main parity.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: GitHub PR state, `origin/main`, local main, and final parity proof
- Failure route: `cc-pr-review` for stale/unreviewed or missing-gate risk, `cc-dev` for fixes, or blocked when parity cannot be proven

## Pause Points

1. Before any PR read: resolve GitHub tooling and prove authenticated GitHub access.
2. Before merge/rebase: refresh PR truth and review status.
3. Before resolving conflicts: stop if product intent would be guessed.
4. After landing: prove remote/local/active-main parity.

## Required Checks

- [ ] `gh` is resolved from PATH or a common absolute install path before it is declared unavailable
- [ ] GitHub PR, review, and check reads use authenticated `gh` or authenticated REST/curl
- [ ] token preflight prints only environment variable names, never token values
- [ ] anonymous GitHub `404` blocks landing unless authenticated live proof resolves it
- [ ] local refs, fetched refs, and `git ls-remote` are not used as PR/review/check substitutes
- [ ] live PR truth is fetched before landing
- [ ] prior review exists or review pass is performed before merge
- [ ] review-gate coverage from `cc-pr-review` is carried forward: complexity, hardening/productization, and release/readiness facets are checked, skipped with reason, not applicable, or routed away
- [ ] blocked, failed, changes-requested, must-fix-before-release, missing, or stale facet coverage blocks landing
- [ ] material rebase/conflict resolution triggers re-review
- [ ] requirement shrinkage is rejected or ruled out
- [ ] remote main, local main, and active main worktree parity are verified

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
