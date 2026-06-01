# cc-dev Checklist Contract

## Diagnosis

Autonomous driving fails when stage transitions inherit memory instead of re-reading durable truth.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: `task.md`, Git commits, selected cc-act delivery state, and the final audit
- Failure route: `cc-plan`, `cc-diagnose`, `cc-do`, `cc-check`, `cc-act`, `cc-pr-review`, or stop

## Pause Points

1. Before first lower-level stage: resolve CLI, route, change key, worktree, and branch.
2. Before each stage transition: reread `task.md`, Git, PR/handoff truth, and final check gate decisions when present.
3. Before exit: map every objective requirement to file, command, commit, selected delivery, or blocker evidence.

## Required Checks

- [ ] objective or Goal Packet is explicit
- [ ] route is PDCA, resume, or blocked with reason
- [ ] main checkout remains on `main` and work happens in the isolated change branch/worktree
- [ ] `task.md`, Git status/history, and PR/handoff truth are reread before each transition
- [ ] `cc-dev` did not insert automatic review-only subthreads between `cc-plan`, `cc-do`, and `cc-check`
- [ ] final `cc-check`, when reached, owns subAgent `cc-review` convergence until no P0/P1/P2 finding remains
- [ ] P0/P1/P2 findings from final review convergence reroute to `cc-plan`, `cc-do`, or `cc-diagnose` instead of being bypassed
- [ ] final delivery mode was selected by the user or through the shared choice protocol before `cc-act` executed
- [ ] local-main merge mode, when selected, has rebase, `--ff-only` merge, containing-commit proof, and no-push evidence
- [ ] parallel mode, when used, audited child worktrees and removed only known clean, integrated, disposable worktrees
- [ ] terminal state is one of remote-pr-opened, remote-pr-updated, local-handoff, local-main-merged, parallel-dispatched, waiting-for-child-results, needs-clarification, or blocked

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
