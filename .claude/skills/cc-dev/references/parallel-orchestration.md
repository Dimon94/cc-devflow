# Parallel Orchestration

Read `../execution-environment-contract/SKILL.md` as the source contract for
environment types, dependency semantics, child boundaries, final reports,
integration gates, and safe worktree closeout. This file is the cc-dev
operational reference for applying that contract.

Use this reference when `task.md` contains `## Execution Environments`, the
user asks for multi-threaded development, or a large change can be decomposed
into independently committable environments.

## Core Contract

`cc-dev` is the orchestrator. It may dispatch child environments, but it keeps
the authority to integrate commits, unlock phases, run final `cc-check`, and
route to `cc-act`.

Parallel work is valid only when `cc-plan` wrote an execution graph in
`task.md`. Do not invent parallel slices from unchecked task titles.
The parent `task.md` should use
`cc-plan/assets/PARALLEL_TASKS_TEMPLATE.md` when parallelism is intended. A
valid parallel parent contract includes `Contract Snapshot`,
`Parallelization Rationale`, an Env-level contract matrix, full status enum,
Failure Ledger, Execution Protocol, explicit child dispatch boundaries, and
complete task blocks inside each assigned environment. `assets/CHILD_DISPATCH_PACKET.md`
is only the child prompt envelope, not the durable parent task file.

## Environment Types

- `E###`: implementation environment, normally routes to `cc-do`.
- `R###`: standalone review-only environment, routes to `cc-review`; use only
  when explicitly requested or already frozen in `task.md`, not for normal PDCA
  final review convergence.
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
6. every `Tasks:` ID has a full task block in `task.md`, not only a branch name,
   workstream label, or prose TODO
7. the parent task file includes the full parallel skeleton: `Plan Meta`,
   `Contract Snapshot`, `Parallelization Rationale`, `Execution Environments`,
   `Env Contract Matrix`, `Failure Ledger`, and `Execution Protocol`
8. the environment has explicit `--- CHILD DISPATCH START <Env> ---` and
   `--- CHILD DISPATCH END <Env> ---` boundaries
9. the bounded environment block includes Env metadata, Child fields,
   Integration fields owned by parent `cc-dev`, and complete assigned task
   blocks
10. each implementation environment is a Red/Green/Refactor closed loop, or it
   records a `TDD exception` before dispatch
11. the environment records the project-relative task file path and explicit
   assigned task IDs for the child worktree
12. the dispatch packet is complete enough for a child thread without chat memory

If any condition is unclear, run serially or route back to `cc-plan`.

## Dispatch Packet

Every child receives a completed `assets/CHILD_DISPATCH_PACKET.md`. It includes:

- change key, current branch, base commit, and parent thread summary
- parent thread id when the host supports `send_message_to_thread`
- parent task file path and child-worktree task file path
- assigned task IDs for this environment
- the full child dispatch boundary from `task.md`, from
  `--- CHILD DISPATCH START <Env> ---` through
  `--- CHILD DISPATCH END <Env> ---`
- included task blocks in full from that boundary
- task-block completeness check: ID/title, environment, TDD phase,
  dependencies, files, read-first context, verification command, evidence,
  ready condition, and completion command
- environment completeness check: Env metadata, Child fields, Integration
  fields, Merge gate, Touches, Mutable resources, and Verification are present
- allowed route skill and explicit non-goals
- allowed touched paths and mutable resources
- read-first files and domain context instructions
- verification commands or review scope
- required final report format
- rule: commit required only for routes that changed files
- rule: after final report is ready, send a short handoff notice back to the
  parent thread when `send_message_to_thread` is available

Thread creation, not the child prompt, owns optional resource selection. In
Codex App, use the live `create_thread` schema and
`references/codex-thread-orchestration.md`; do not write model names, reasoning
labels, or `thinking` values into `assets/CHILD_DISPATCH_PACKET.md`.

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

The child completion handoff is only a wake-up hint. The orchestrator still must
read the child thread and apply the integration gate before trusting the result.

## Integration Gate

Before cherry-picking a child commit:

1. verify the child thread is completed
2. verify the child worktree is clean
3. inspect commit hash and touched files
4. run `scripts/audit-child-integration.sh` or an equivalent explicit audit
5. reject scope drift or unrelated dirty files
6. cherry-pick into the orchestration branch
7. run the environment focused verification
8. update only durable orchestration state in `task.md`
9. keep the child worktree until final delivery closeout audits whether it is
   disposable

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

Creating the heartbeat means an actual platform tool call, not a written plan.
If the automation call fails, report `waiting-for-child-results` with the child
thread ids and manual polling checklist; do not silently replace it with
repeated `read_thread` calls in the main conversation.

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

## Worktree Closeout

Run this after final delivery succeeds or when stopping with a handoff that must
leave clean local state. It covers only child worktrees created for the current
parallel run; unrelated user worktrees are out of scope.

Closeout steps:

1. read the child environment records from `task.md`
2. inspect `git worktree list --porcelain`
3. for each child path, run `git -C <path> status --short --branch`
4. verify commit-producing environments were integrated into the orchestration
   branch before considering removal
5. remove only clean, integrated, known child worktrees with
   `git worktree remove <path>`
6. run `git worktree prune` only after successful removals
7. report removed paths and preserved paths in the final audit

Never use broad destructive cleanup here. No `git reset --hard`, no broad
`git clean`, no broad `rm -rf`, and no branch deletion unless the user
explicitly approved that action in the current turn.

Preserve a child worktree when it is dirty, missing from `task.md`, missing from
`git worktree list`, has unintegrated commits, or has unknown ownership. Report
that preserved state as remaining risk or handoff evidence instead of silently
cleaning it.
