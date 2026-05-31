# Parallel Orchestration

Use this reference when `task.md` contains `## Execution Environments`, the
user asks for multi-threaded development, or a large change can be decomposed
into independently committable environments.

## Core Contract

`cc-dev` is the orchestrator. It may dispatch child environments, but it keeps
the authority to integrate commits, unlock phases, run final `cc-check`, and
route to `cc-act`.

Parallel work is valid only when `cc-plan` wrote an execution graph in
`task.md`. Do not invent parallel slices from unchecked task titles.

## Environment Types

- `E###`: implementation environment, normally routes to `cc-do`.
- `R###`: review-only environment, routes to `cc-review`.
- `C###`: verification-only environment, routes to `cc-check`.
- `A###`: isolated closeout or handoff environment, routes to `cc-act`; it must
  not choose final delivery mode for the orchestrator.
- `EF###`: diagnosis environment created after a child, integration, or phase
  gate failure; routes to `cc-diagnose`.

## Scheduling Gate

Dispatch only environments that satisfy all conditions:

1. status is `planned` or an explicitly retryable `blocked`
2. all `DependsOn` environments are `integrated`, `completed` for no-commit
   routes, or `skipped` with an approved reason
3. `Parallel: yes` for sibling concurrent dispatch, or the batch is serial
4. touched paths and mutable resources do not overlap with other running
   siblings
5. each environment has its own verification or review evidence gate
6. the dispatch packet is complete enough for a child thread without chat memory

If any condition is unclear, run serially or route back to `cc-plan`.

## Dispatch Packet

Every child receives:

- change key, current branch, base commit, and parent thread summary
- current environment block from `task.md`
- included task blocks in full
- allowed route skill and explicit non-goals
- allowed touched paths and mutable resources
- read-first files and domain context instructions
- verification commands or review scope
- required final report format
- rule: commit required only for routes that changed files

## Child Final Report

Each child must return:

```text
Environment:
Route:
Status: completed | blocked
Commit: <hash subject> | none
Verification:
- <command or review scope>: pass | fail | blocked
Dirty state: clean | dirty <files>
Touched files:
-
Blockers:
-
Route recommendation: integrate | retry | cc-plan | cc-diagnose | blocked
```

For `cc-do` and `cc-diagnose`, a verified commit is required before the child is
complete. For `cc-review` and `cc-check`, no commit is required unless the skill
updated allowed durable files.

## Integration Gate

Before cherry-picking a child commit:

1. verify the child thread is completed
2. verify the child worktree is clean
3. inspect commit hash and touched files
4. reject scope drift or unrelated dirty files
5. cherry-pick into the orchestration branch
6. run the environment focused verification
7. update only durable orchestration state in `task.md`

Cherry-pick is the default integration strategy. Fast-forward merge is allowed
only when there are no sibling environments and the environment owns the full
change branch. Merge commits are not the default.

## Phase Gate

After all required environments in a phase are integrated or completed:

- run the phase gate commands from `task.md`
- if a new bug appears, create an `EF###` diagnosis environment under the same
  change and record the failure in `Failure Ledger`
- if the failure disproves scope or architecture, route to `cc-plan`
- unlock the next environments only after the gate passes or is explicitly
  skipped with a reason

## Monitoring

If platform thread and automation tools are available, confirm each child has
started, record durable coordinates, create a heartbeat monitor, then stop the
orchestrator conversation as `waiting-for-child-results`. Do not busy-poll
running child threads in the main conversation.

On Codex App, this means loading `codex-thread-orchestration.md` and using the
actual `create_thread`, `read_thread`, `send_message_to_thread`, and
`automation_update` tools. Do not substitute generic subagents or prose
delegation for Codex threads.

If no automation tool is available, stop as `waiting-for-child-results` with a
manual polling checklist.

Do not write heartbeat polling logs into `task.md`. Record only durable facts:
child id, worktree, branch, commit, status, blocker, integrated commit, and gate
result.

## Final Gate

When all required environments are integrated, run `cc-check` for the whole
change. Child focused checks do not replace final verification. Route to
`cc-act` only after final `cc-check` returns `pass`.
