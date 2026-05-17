# cc-pr-land Checklist Contract

## Diagnosis

Landing risk concentrates at stale reviews, conflict resolution by guesswork, and unproven main parity.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: GitHub PR state, `origin/main`, local main, and final parity proof
- Failure route: `cc-pr-review` for stale/unreviewed risk, `cc-dev` for fixes, or blocked when parity cannot be proven

## Pause Points

1. Before merge/rebase: refresh PR truth and review status.
2. Before resolving conflicts: stop if product intent would be guessed.
3. After landing: prove remote/local/active-main parity.

## Required Checks

- [ ] live PR truth is fetched before landing
- [ ] prior review exists or review pass is performed before merge
- [ ] material rebase/conflict resolution triggers re-review
- [ ] requirement shrinkage is rejected or ruled out
- [ ] remote main, local main, and active main worktree parity are verified

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
