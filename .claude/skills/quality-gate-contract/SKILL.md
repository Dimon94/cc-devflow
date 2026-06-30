---
name: quality-gate-contract
version: 1.0.0
description: Chain Skill defining shared review, verification, simplification, Failure Ledger, postmortem, and cc-act closeout quality semantics.
skill_class: chain
route_family: contract
reads: []
writes: []
---

# Quality Gate Contract

This is a Chain Skill. Quality readers use it to share one meaning for review
severity, verification verdicts, confirmed smells, review escapes, Failure
Ledger classification, postmortem input, and cc-act closeout input. It is not a
User Entry Skill and must not grow `triggers`.

## Scope

This contract owns quality-gate semantics only. It does not own task.md shape,
workflow routing, execution environment orchestration, skill authoring rules, a
full reviewer swarm, productization surface, or detailed test-layer taxonomy.
Those stay in `task-contract`, `workflow-chain-contract`,
`execution-environment-contract`, `skill-authoring-gate`, and branch-specific
skill references.

`cc-simplify` belongs here only as a quality-gate participant: it may act on a
confirmed smell before `cc-check` or `cc-act`, but this contract does not import
its full internal simplification workflow.

## Review Severity

Review findings are ordered by shipping risk:

- `P0`: data loss, security, release breakage, or a dishonest gate.
- `P1`: required behavior, contract, or integration path is broken.
- `P2`: maintainability or test-trust risk that can hide real failure.
- `P3`: advisory improvement that does not block the current gate.

Only P0/P1/P2 findings block a quality pass. Advisory P3 findings are recorded
or deferred without pretending they are release blockers.

## Verification Verdicts

Quality gates end in exactly one verdict: pass, fail, and blocked.

- `pass`: fresh evidence proves the claim and no blocking finding remains.
- `fail`: fresh evidence proves the implementation, contract, or test is wrong.
- `blocked`: required evidence, tooling, review resources, or external state is
  unavailable, so pass would be dishonest.

A green claim without current command, review, or source evidence is not a pass.

## Quality Gate Packet

A Quality Gate Packet is transient evidence assembled by `cc-check` for the
current quality gate. It contains only:

- `head`: commit or tree identity used to reject stale packets.
- `commands`: normalized command results, claim proven, and evidence reference.
- `findings`: blocking or advisory review findings with severity, impact, route,
  and evidence reference.
- `simplify`: `cc-simplify` verdict, changes, and verification reference.
- `verdict`: exactly `pass`, `fail`, or `blocked`.
- `route`: next skill or terminal route.

It must not contain raw command output, raw review output, history, notes, or a
catch-all metadata field. It is not written to a quality-gate file, is not
Durable Truth, and does not enter the Failure Ledger.

`cc-act` may check packet freshness and final-commit coverage before delivery,
and treats missing, stale, failed, or blocked packets as non-deliverable. It must
not reinterpret the verdict, downgrade P0/P1/P2 findings, or turn a blocked
packet into a skipped gate.

## Confirmed Smell

A confirmed smell is cleanup work with code fact, usage fact, requirement fact,
and verification fact. `cc-simplify` edits only confirmed smells inside the
current diff. Speculative cleanup remains a report, not a patch.

## Review Escape

A review escape is repeatable and preventable evidence that a review, test,
design, or model pattern let a real issue through. Eligible classes are
`process-escape`, `test-escape`, `design-escape`, and `model-pattern-escape`.

Ordinary findings, style preferences, and one-off mistakes do not enter the
Failure Ledger.

## Failure Ledger And Closeout

Failure Ledger entries become postmortem input only after classification proves
they changed execution, verification, routing, or future review truth.

`cc-check` classifies candidates as `confirmed-lesson`, `noise`, or
`unresolved-risk`. `cc-act` uses only confirmed lessons for postmortem and
closeout; raw findings and unclassified review escapes are not cc-act closeout
input.
