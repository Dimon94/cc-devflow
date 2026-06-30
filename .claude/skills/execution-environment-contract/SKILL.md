---
name: execution-environment-contract
version: 1.0.0
description: Chain Skill defining parallel execution environment graph, child boundaries, integration gates, and safe worktree closeout semantics.
reads: []
writes: []
---

# Execution Environment Contract

This is a Chain Skill. Parallel workflow skills read it to share one meaning for
execution environments; it is not a User Entry Skill and must not grow
`triggers`.

## Scope

This contract owns parallel graph and integration semantics: environment types,
dependency fields, child dispatch boundary requirements, child final report
shape, parent integration gates, focused verification after integration, and
safe worktree closeout.

It does not own Codex thread tool wrappers, heartbeat implementation, model
selection, platform UI behavior, task.md prose shape, workflow stage routing,
quality gate verdicts, or skill-writing rules. Those stay in platform adapter
references, `task-contract`, `workflow-chain-contract`,
`quality-gate-contract`, and `skill-authoring-gate`.

## Machine Check

Use `scripts/validate-execution-environments.js --tasks <task.md>` as the
read-only machine check for this contract. The script validates only the
Execution Environments portion of `task.md`; it does not parse the whole task
contract, choose dispatch strategy, read Git state, create threads, route
workflow stages, or make quality verdicts.

The JSON report uses three levels:

- `error`: contract structure is invalid; `cc-plan` cannot freeze parallel
  work and `cc-dev` routes back to `cc-plan`.
- `blocker`: the contract exists but a specific environment is not ready.
- `warning`: the environment can still proceed, but the risk should be
  reported.

Only `error` makes the CLI exit non-zero. `blocker` and `warning` stay in JSON
so the orchestrator can decide what to skip, retry, or report.

## Environment Types

- `E###`: implementation environment, normally routed to `cc-do`.
- `R###`: review-only environment, routed to `cc-review` when frozen.
- `C###`: verification-only environment, routed to `cc-check`.
- `A###`: closeout or handoff environment, routed to bounded `cc-act`.
- `EF###`: diagnosis environment for child, integration, or phase-gate failure.

## Environment Fields

Each environment records the fields needed to decide readiness without chat
memory:

- route and durable status
- `DependsOn` with ready-state semantics
- `Parallel` eligibility for sibling dispatch
- `Tasks` and `Assigned task IDs`
- `Touches` and `Mutable resources`
- `Verification`
- merge gate and unlock targets
- child coordinates: thread, worktree, task file, branch, and commit
- integration owner, cherry-pick state, and focused verification result

An environment is ready only when every dependency is `integrated`, completed
without a commit requirement, or skipped with durable approval; touched paths
and mutable resources must not overlap with running siblings.

## Child Dispatch Boundary

A valid child packet includes the exact
`--- CHILD DISPATCH START <Env> ---` through
`--- CHILD DISPATCH END <Env> ---` block from `task.md`.

That boundary contains Env metadata, Child fields, Integration fields owned by
parent `cc-dev`, Merge gate, Touches, Mutable resources, Verification, and full
task blocks for every assigned task id. A branch label, workstream name, or
prose TODO is not enough.

## Child Final Report

Each child returns this shape:

```text
Environment:
Route:
Status: completed | blocked
Task file:
Assigned task IDs:
Thread:
Worktree:
Branch:
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

File-changing `cc-do` and `cc-diagnose` environments need a verified commit
before they are complete. Review and check environments need no commit unless
they update allowed durable files.

## Integration Gate

Parent `cc-dev` owns integration. Before accepting a child, it verifies child
completion, clean worktree, commit proof when required, touched-path audit,
scope boundaries, and focused verification after cherry-pick.

`completed` is not `integrated`. Children do not cherry-pick themselves, unlock
sibling environments, mark integration complete, or run the final whole-change
`cc-check`.

## Worktree Closeout

Closeout happens only after final delivery succeeds or a handoff explicitly
needs clean local state.

Remove only child worktrees that are known from `task.md`, clean, integrated
when they produced commits, and present in `git worktree list`. Preserve dirty,
unknown, missing, or unintegrated worktrees and report them as handoff risk.

Never use broad destructive cleanup: no `git reset --hard`, broad `git clean`,
raw `rm -rf`, or branch deletion without current explicit user approval.
