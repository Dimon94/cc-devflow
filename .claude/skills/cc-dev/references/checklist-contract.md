# cc-dev Checklist Contract

## Diagnosis

Autonomous driving fails when stage transitions inherit memory instead of re-reading durable truth.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: `task.md`, Git commits, PR/handoff state, and the final audit
- Failure route: `cc-plan`, `cc-investigate`, `cc-do`, `cc-check`, `cc-act`, `cc-pr-review`, or stop

## Pause Points

1. Before first lower-level stage: resolve CLI, route, change key, worktree, and branch.
2. Before each stage transition: reread `task.md`, Git, and PR/handoff truth.
3. Before exit: map every objective requirement to file, command, commit, PR, or blocker evidence.

## Required Checks

- [ ] objective or Goal Packet is explicit
- [ ] route is PDCA, IDCA, resume, or blocked with reason
- [ ] main checkout remains on `main` and work happens in the isolated change branch/worktree
- [ ] `task.md`, Git status/history, and PR/handoff truth are reread before each transition
- [ ] terminal state is one of remote-pr-opened, remote-pr-updated, local-handoff, needs-clarification, or blocked

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
