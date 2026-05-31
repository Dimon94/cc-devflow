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
- A `pendingWorktreeId` or similar provisioning token is not a child thread id.
  It means the App is still creating the worktree/thread and the environment is
  not yet dispatched.

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
- include the parent thread id and require a completion handoff notice with
  `send_message_to_thread` when the child reaches a final report

Required parent record after dispatch:

```text
Environment: E###
Thread: <thread id from create_thread>
Target: project worktree | project local
Status: dispatched
```

Do not claim `parallel-dispatched` until `create_thread` returned thread ids
for every environment in the batch.

If `create_thread` returns `pendingWorktreeId` instead of a thread id, use this
bounded discovery loop:

1. record the environment as `pending-thread`, not `dispatched`
2. do not call `read_thread` with `pendingWorktreeId`
3. do not ask the user to supply the thread id manually
4. call `list_threads` after a short delay and locate the new thread by the
   dispatch marker: environment id, requested title, project target, branch or
   worktree path, and recent creation time
5. call `read_thread` on the candidate id and verify it is the intended
   environment before storing it as the child thread id
6. only then update the parent record to `Status: dispatched`

If no exact candidate appears after bounded polling, report
`waiting-for-child-results` with the `pendingWorktreeId`, project target, title,
and attempted discovery filters. Do not recreate the child repeatedly; duplicate
threads make integration ambiguous.

## Monitoring

Use heartbeat automation for running child threads. The orchestrator must not
busy-poll by repeatedly reading the thread in the same conversation.

After a child thread is confirmed as `running`, the orchestrator must:

1. write only durable coordinates to `task.md`: environment id, thread id,
   worktree path, branch, and current status
2. create or update a heartbeat with `automation_update` on a 10 minute cadence
3. stop the current conversation as `waiting-for-child-results`

The `automation_update` call is a hard gate, not prose. The orchestrator must
actually call the tool before it reports that monitoring is active. If the call
fails or the tool is unavailable, do not continue manual `read_thread` polling;
stop as `waiting-for-child-results` and report that heartbeat setup failed,
including the child thread ids and a manual polling checklist.

The heartbeat owns periodic polling:

1. call `read_thread` for each child thread id
2. if running, summarize current progress briefly
3. if completed, inspect final result before integration
4. if blocked or off-boundary, call `send_message_to_thread` with a correction
   prompt for that exact thread id
5. when all required environments are integrated and final closeout is done,
   call `automation_update` with `mode=delete` for the heartbeat id

Heartbeat output is user-facing status, not durable truth. Keep durable state in
`task.md` concise.

For environments in `pending-thread`, the heartbeat first runs the dispatch
discovery loop above with `list_threads`. It must not treat a provisioning token
as completion, failure, or a usable thread id.

Manual repeated `read_thread` calls in the orchestrator are allowed only for a
bounded dispatch/discovery check or after the heartbeat reports a terminal child
state that needs integration. They are not a substitute for the 10 minute
heartbeat wait.

## Heartbeat Prompt Shape

The heartbeat prompt must include:

- active environment IDs and child thread IDs
- the 10 minute cadence
- the integration gate
- the rule that no new phase unlock happens before required children are
  completed and verified
- the rule that completed children are inspected before cherry-pick
- the rule to delete the heartbeat after closeout

Do not write raw XML heartbeat directives by hand. Use `automation_update`.
Do not say "heartbeat created", "monitoring", or "will check later" unless the
`automation_update` tool call has succeeded and returned an automation id.

## Child Completion Handoff

When the dispatch packet includes a parent thread id and
`send_message_to_thread` is available in the child, the child must send a short
handoff notice to the parent after its final report is ready.

The handoff prompt should contain only wake-up coordinates and a compact result
summary:

```text
Environment: E###
Status: completed | blocked
Child thread: <child thread id if known>
Commit: <hash subject> | none
Dirty state: clean | dirty <files>
Verification: <short pass/fail/block summary>
Route recommendation: integrate | retry | cc-plan | cc-diagnose | blocked
```

This child-to-parent message is a completion hint, not an integration gate. The
orchestrator must still call `read_thread` for that child and verify final
report, commit hash, dirty state, touched files, blockers, and verification
evidence before integrating.

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
