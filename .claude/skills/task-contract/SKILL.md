---
name: task-contract
version: 1.0.0
description: Chain Skill defining the durable task.md contract for cc-devflow planning, execution, verification, review, and closeout.
reads: []
writes: []
---

# Task Contract

This is a Chain Skill. Workflow skills read it to share one meaning for
`task.md`; it is not a User Entry Skill and must not grow `triggers`.

## Shape

`task.md` is Durable Truth for one planned change. It contains:

- Plan Meta: source skill version, template source, work branch, and output
  language.
- Contract Snapshot: goal, non-goals, approved direction, open decisions,
  verification, risks, parallel rationale when present, and doc-to-contract
  facts when present.
- Execution Environments: durable orchestration state for parallel work.
- Environment Contracts: child dispatch blocks and complete task blocks.
- Failure Ledger: real execution, review, tool, user-correction, or reroute
  failures that changed the work conclusion.

`task.md` is not a parser input language, DSL, CLI surface, workflow router, or
delivery policy. Scripts may read it as repository evidence, but the contract
stays human-auditable Markdown.

## Status

Use the smallest status vocabulary that describes durable workflow reality:

- `planned`: frozen but not dispatched.
- `pending-thread`: provisioning exists but no real child thread is verified.
- `dispatched`: a real child thread or bounded executor owns the environment.
- `running`: current evidence shows work is active and not terminal.
- `completed`: child work reported final evidence; parent has not integrated it.
- `integrated`: parent audited, cherry-picked or accepted, and verified it.
- `skipped`: no longer required, with approval or evidence.
- `blocked`: cannot continue without repair, reroute, or user/external action.

`completed` is not `integrated`. A provisioning token is not a thread id.

## Task Blocks

Every executable task block names the task id, environment, goal, contract,
non-goals, TDD phase or exception, suite/runtime, confidence value,
fixture/mock boundary, low-value tests to avoid, files, read-first inputs,
verification commands, evidence, completion command, public verification path,
and readiness condition.

A branch label, workstream name, or prose TODO is not a task block.

## Failure Ledger

The Failure Ledger records real failures only when they alter execution,
verification, routing, or future review truth. Each entry needs symptom,
evidence, attempted fix, result, lesson candidate, review status, and whether it
should be kept for postmortem.

Do not use it for heartbeat logs, ordinary review findings, chat summaries, or
large command output.

## Execution Environments

Execution Environments describe independent units of work, not platform tool
wrappers. Each environment records route, status, dependencies, assigned task
ids, allowed touches, mutable resources, verification, merge gate, child
coordinates, commit state, integration owner, and unlocks.

Children may update only their assigned environment and task evidence. Parent
`cc-dev` owns integration, phase unlocks, cherry-picks, and sibling state.

## Readers And Writers

- `cc-plan` writes the initial task contract and updates it only while planning
  scope is still being frozen.
- `cc-dev` reads task truth to dispatch, monitor, integrate, and route; it
  writes orchestration status and parent integration evidence.
- `cc-do` reads the assigned task block, writes implementation evidence,
  completion state, and Failure Ledger entries for real execution failures.
- `cc-check` reads the whole task contract for fresh verification and writes
  only verification-related Failure Ledger classification when needed.
- `cc-review` reads the task contract to freeze review scope and writes only
  task-contract repairs or eligible review escape evidence.
- `cc-act` reads the verified task contract for delivery and writes delivery
  handoff or postmortem artifacts, not new task scope.

The rule is simple: workflow truth lives in `task.md`, source skills define how
to read it, and generated mirrors never become the source of truth.
