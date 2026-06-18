---
name: workflow-chain-contract
version: 1.0.0
description: Chain Skill defining the cc-devflow stage state machine, route families, reroutes, terminal states, and stage evidence.
reads: []
writes: []
---

# Workflow Chain Contract

This is a Chain Skill. Workflow skills read it to share one stage state machine;
it is not a User Entry Skill and must not grow `triggers`.

## Scope

This contract owns route order, reroute meaning, terminal states, entry
evidence, and exit evidence.

It does not own task.md structure, quality gate semantics, child dispatch
mechanics, or skill-writing rules. Those stay in `task-contract`,
`quality-gate-contract`, `execution-environment-contract`, and
`skill-authoring-gate`.

## Main Route

The main route moves one planned change through:

```text
cc-next or user objective -> cc-dev -> cc-plan -> cc-do -> cc-check -> cc-act
```

- `cc-dev` selects or resumes the route from Durable Truth.
- `cc-plan` freezes scope into `task.md`.
- `cc-do` executes the frozen task slice.
- `cc-check` supplies fresh verification and review convergence.
- `cc-act` performs the chosen delivery closeout.

## Bug Route

Broken behavior, regressions, crashes, or inconsistent runtime truth route to
`cc-diagnose` first. A bug may enter `cc-do` only after the fix is frozen in
`task.md`.

## PR Route

Standalone PR review enters `cc-pr-review`. Landing an approved PR enters
`cc-pr-land`. Verified local work that needs PR creation or update enters
`cc-act`; `cc-dev` does not choose the delivery mode.

## Reroutes

- `cc-plan`: scope, contract, split, or design evidence is wrong or incomplete.
- `cc-diagnose`: root cause is unknown or current evidence disproves it.
- `cc-do`: implementation, test, docs, or task evidence needs repair.
- `cc-check`: implementation is done but verification is stale or incomplete.
- `cc-act`: verification passed and only delivery closeout remains.
- `stop`: no valid next stage exists without user input or external state.

## Terminal States

`cc-dev` ends in exactly one terminal state:

- `remote-pr-opened`
- `remote-pr-updated`
- `local-handoff`
- `local-main-merged`
- `parallel-dispatched`
- `waiting-for-child-results`
- `needs-clarification`
- `blocked`

Other route skills end with their own explicit verdict, commit, handoff, or
blocker, then return the next route or terminal state to the caller.

## Evidence

Every stage needs entry evidence before it starts and exit evidence before it
hands off:

| Stage | Entry evidence | Exit evidence |
| --- | --- | --- |
| `cc-plan` | user objective, repo context, current workflow truth | committed `task.md` with frozen scope |
| `cc-do` | assigned task block, allowed files, TDD exception or Red target | verified diff, task completion state, commit |
| `cc-check` | current diff, task truth, fresh commands to run | pass/fail/blocked verdict with command evidence |
| `cc-act` | passing check evidence and delivery choice | delivery artifact, release gate result, or blocker |
| `cc-diagnose` | reproducible symptom or violated contract | root cause, owner, and repair route |
| `cc-pr-review` | PR, base, diff, and review scope | findings or clean verdict |
| `cc-pr-land` | approved PR and merge policy | landed commit evidence or blocker |

The stage may not inherit green claims from chat when Durable Truth, Git, PR
state, or fresh command output can prove the current state.
