# Codex Simplify Thread Orchestration

This contract maps the pre-act `cc-simplify` gate to Codex App child thread and
heartbeat tools. In Codex App, do not replace this with generic subagents,
ad-hoc background shells, prose-only delegation, or repeated manual polling.

## Required Tools

- `create_thread`: create the background Codex thread for the simplify gate.
- `list_threads`: discover a real child thread id when `create_thread` returns
  a provisioning token such as `pendingWorktreeId`.
- `read_thread`: poll the exact child thread before judging status or trusting
  a handoff.
- `send_message_to_thread`: send correction or retry instructions to the exact
  child thread, and allow the child to send a completion handoff to the parent.
- `automation_update`: create/update/delete heartbeat monitoring for the parent
  thread while the child is running.

Discover all five tools before child dispatch. If any are unavailable, run the
same `cc-simplify` gate in the main thread and report
`Agents used: no (child thread orchestration unavailable)`. Do not claim child
mode or heartbeat monitoring without the actual tools.

## Thread Resource Contract

The live `create_thread` schema is the resource truth source. Host-default
resources are the default: omit `model` and `thinking` unless the user
explicitly requested a model or reasoning effort for the simplify child thread.

When the user explicitly requested a resource, pass it through `create_thread`
only if the live schema supports that field. After `create_thread` returns, or
after `list_threads` resolves a pending thread, verify the actual child thread
matches any explicit requested resource before treating it as dispatched. If the
tool rejects the field, the field is absent from the live schema, or readback
does not match the explicit request, do not silently downgrade; fall back to
main-thread simplify and report the unsupported resource. Do not write model
names, reasoning labels, or `thinking` values into the child packet or prompt.

## Dispatch

Call `create_thread` once for the pre-act simplify gate. Omit `model` and
`thinking` unless the user explicitly requested a supported resource. The prompt
is `assets/SIMPLIFY_CHILD_DISPATCH_PACKET.md` filled from current Git evidence,
latest `cc-check` evidence, the changed implementation surface, and the parent
thread id when available.

The child must:

- run only `cc-simplify`
- stay inside the changed implementation surface
- fix only confirmed smells
- send a compact completion handoff with `send_message_to_thread` when possible
- return the required final report

Required parent record after dispatch:

```text
Environment: pre-act-simplify
Thread: <thread id from create_thread>
Target: project worktree | project local
Status: dispatched | pending-thread | running | completed | blocked
Heartbeat: <automation id> | none
```

Do not treat a `pendingWorktreeId` as a child thread id. If `create_thread`
returns a provisioning token, use this bounded discovery loop:

1. record status as `pending-thread`
2. do not call `read_thread` with the provisioning token
3. call `list_threads` after a short delay and locate the new thread by dispatch
   marker, requested title, target, branch/worktree path, and recent creation
   time
4. call `read_thread` on the candidate id and verify it is the intended
   pre-act simplify thread
5. only then record `Status: dispatched`

If no exact candidate appears after bounded polling, report
`waiting-for-child-results` with the provisioning token, title, target, and
attempted discovery filters. Do not recreate duplicate simplify threads.

## Monitoring

Use heartbeat automation for running child threads. The parent must not
busy-poll by repeatedly reading the child in the same conversation.

After the child thread is confirmed as running, the parent must:

1. keep only durable coordinates in the normal evidence sink: child thread id,
   target, branch/worktree path, and status
2. create or update a heartbeat with `automation_update` on a 10 minute cadence
3. stop the current conversation as `waiting-for-child-results`

The `automation_update` call is a hard gate. Do not say "heartbeat created",
"monitoring", or "will check later" unless the tool call succeeded and returned
an automation id. If the call fails, stop as `waiting-for-child-results` and
report child thread ids plus a manual polling checklist.

The heartbeat owns periodic polling:

1. call `read_thread` for the child thread id
2. if running, summarize current progress briefly
3. if completed, inspect the final result before Act continues
4. if blocked or off-boundary, call `send_message_to_thread` with a correction
   prompt for that exact thread id
5. after Act either reroutes to `cc-check` or finishes delivery, delete the
   heartbeat with `automation_update`

For `pending-thread`, the heartbeat first runs the discovery loop with
`list_threads`. It must not treat a provisioning token as completion, failure,
or a usable thread id.

## Handoff And Trust

The child-to-parent handoff is only a wake-up hint. Before Act ships, the parent
must call `read_thread` and verify:

- final report status
- commit hash, if files changed
- dirty state
- touched files
- blockers
- verification evidence
- route recommendation

If the child changed code, tests, or verification posture, Act routes to
`cc-check`. If the child reports `NO FINDINGS` with no edits and the parent
verifies the report, Act may continue with delivery-mode handling.

## Bad Substitutions

These are invalid:

- saying "spawn subagents" without `create_thread`
- using an internal checklist as if work had been dispatched
- treating a handoff notice as proof without `read_thread`
- claiming heartbeat monitoring without a successful `automation_update` call
- replacing the 10 minute heartbeat with repeated manual polling
- shipping after simplify edits without returning to `cc-check`
