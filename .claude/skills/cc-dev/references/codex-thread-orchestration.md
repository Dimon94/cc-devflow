# Codex Thread Orchestration Adapter

This adapter maps the generic parallel orchestration contract to Codex App
thread and heartbeat tools. In Codex App, do not replace this with generic
subagents, Task tools, ad-hoc background shells, or prose-only delegation.

Required Codex tools:

- `create_thread`: create one background Codex thread for one execution
  environment.
- `read_thread`: poll that exact thread by id before judging status.
- `send_message_to_thread`: send correction or retry instructions to that exact
  thread.
- `automation_update`: create/update/delete heartbeat monitoring for the parent
  thread when autonomous polling is requested.

If these tools are unavailable, stop as `waiting-for-child-results` or use the
platform-specific adapter. Do not guess another mechanism.

## Thread Model

- One environment gets one child Codex thread created with `create_thread`.
- The orchestrator thread keeps the primary change branch.
- Child threads may run `cc-do`, `cc-review`, `cc-check`, `cc-diagnose`, or
  bounded `cc-act` according to the environment route.
- Child threads report results; the orchestrator reads, verifies, and
  integrates.
- The `create_thread` target must be a project worktree target when the
  environment changes files. Use a project local target only for read-only
  review/check work that must inspect the current checkout.

## Dispatch

Call `create_thread` for each dispatched environment. The prompt is the
dispatch packet from `parallel-orchestration.md` plus Codex-specific tool
requirements. It must say:

- execute only the assigned environment
- do not touch unrelated environments
- commit required for file-changing routes
- final answer must include environment, commit, verification, dirty state,
  touched files, blockers, and route recommendation
- report the git branch/worktree path used by the child thread

Required parent record after dispatch:

```text
Environment: E###
Thread: <thread id from create_thread>
Target: project worktree | project local
Status: dispatched
```

Do not claim `parallel-dispatched` until `create_thread` returned thread ids
for every environment in the batch.

## Monitoring

Use heartbeat automation when the user wants autonomous progress:

1. call `read_thread` for each child thread id
2. if running, summarize current progress briefly
3. if completed, inspect final result before integration
4. if blocked or off-boundary, call `send_message_to_thread` with a correction
   prompt for that exact thread id
5. when all required environments are integrated and final closeout is done,
   call `automation_update` with `mode=delete` for the heartbeat id

Heartbeat output is user-facing status, not durable truth. Keep durable state in
`task.md` concise.

## Heartbeat Prompt Shape

The heartbeat prompt must include:

- active environment IDs and child thread IDs
- the integration gate
- the rule that no new phase unlock happens before required children are
  completed and verified
- the rule that completed children are inspected before cherry-pick
- the rule to delete the heartbeat after closeout

Do not write raw XML heartbeat directives by hand. Use `automation_update`.

## Integration

Never blindly cherry-pick because a child says it is done. The orchestrator must
call `read_thread`, inspect commit hash, verification evidence, dirty state,
blockers, and touched files first. After cherry-pick, rerun the focused command
in the orchestration branch.

If cherry-pick conflicts, resolve in the orchestrator branch, run focused
verification, and record the conflict in `Failure Ledger` if it changes the
execution conclusion.

## Bad Substitutions

These are invalid in Codex App parallel orchestration:

- saying "spawn subagents" without `create_thread`
- using an internal planning list as if work had been dispatched
- asking the user to manually open child conversations when thread tools exist
- treating a child thread preview as completion without `read_thread`
- integrating a commit that was not reported by the child thread final answer
