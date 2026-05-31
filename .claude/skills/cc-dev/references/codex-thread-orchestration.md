# Codex Thread Orchestration Adapter

This adapter maps the generic parallel orchestration contract to Codex App
thread and heartbeat capabilities. Use it only when those tools are available.

## Thread Model

- One environment gets one child Codex thread and one sibling git worktree.
- The orchestrator thread keeps the primary change branch.
- Child threads may run `cc-do`, `cc-review`, `cc-check`, `cc-diagnose`, or
  bounded `cc-act` according to the environment route.
- Child threads report results; the orchestrator reads, verifies, and
  integrates.

## Dispatch

Create a child thread with the dispatch packet from
`parallel-orchestration.md`. The prompt must say:

- execute only the assigned environment
- do not touch unrelated environments
- commit required for file-changing routes
- final answer must include environment, commit, verification, dirty state,
  touched files, blockers, and route recommendation

## Monitoring

Use heartbeat automation when the user wants autonomous progress:

1. read each child thread status
2. if running, summarize current progress briefly
3. if completed, inspect final result before integration
4. if blocked or off-boundary, send a correction prompt to that thread
5. when all required environments are integrated and final closeout is done,
   delete the heartbeat automation

Heartbeat output is user-facing status, not durable truth. Keep durable state in
`task.md` concise.

## Integration

Never blindly cherry-pick because a child says it is done. The orchestrator must
inspect commit hash, verification evidence, dirty state, blockers, and touched
files first. After cherry-pick, rerun the focused command in the orchestration
branch.

If cherry-pick conflicts, resolve in the orchestrator branch, run focused
verification, and record the conflict in `Failure Ledger` if it changes the
execution conclusion.
