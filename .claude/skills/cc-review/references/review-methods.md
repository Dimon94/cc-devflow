# CC-Review Methods

Use this reference for every `cc-review` run. It defines the shared method library. Load branch-specific references for concrete workflow steps.

## Method Selection

Select every method needed by the current risk and write the selected methods into `cc-review-plan.md`. This table is a routing map, not a cap.

| Risk | Method |
| --- | --- |
| unclear goal | goal tree |
| repeated symptom | current reality tree |
| hidden tradeoff | conflict diagram |
| uncertain fix impact | future reality tree |
| implementation complexity | logic tree and smell scan |
| UI/runtime mismatch | E2E/plugin verification |
| code quality or simplification risk | cc-simplify reference plus smell scan |

## Review Plan Nodes

Before findings, create ordered nodes:

```text
R001 plan.strategy.outcome
  target: planning/design.md
  method: goal tree
  check: outcome and scope consistency
  status: pending

R002 plan.engineering.data-flow
  target: planning/design.md + referenced code
  method: engineering facet
  check: single truth source and state transitions
  status: pending
```

Node rules:

- one node reviews one coherent question, artifact, or changed surface
- every selected method creates at least one node
- every changed file or user-facing surface is assigned to a node or explicitly skipped
- every node ends as `checked`, `skipped`, or `blocked`
- no finding limit exists while nodes remain pending
- when a prior ledger exists, reuse checked nodes only if their target and dependencies did not change

## Stateful Delta Review

Use git and prior records to avoid repeating stale work:

1. Find the previous reviewed SHA from `cc-review-ledger.jsonl` or `cc-review-report.md`.
2. Compare `git diff <previous-sha>...HEAD` when possible.
3. If no previous SHA exists, compare against the base branch or reviewed artifact timestamps.
4. Re-review changed nodes and dependent nodes.
5. Preserve previous clean nodes only when their target content and assumptions are unchanged.

If git cannot identify the delta, mark the delta source as `unknown` and review the full in-scope surface.

## Thinking Tools

### Goal Tree

Use when the plan has too many proposed actions and not enough outcome clarity.

```text
GOAL
├── necessary condition A
│   ├── measurable signal
│   └── blocked by
├── necessary condition B
└── NOT IN SCOPE
```

### Current Reality Tree

Use for bugs and recurring failures.

```text
SYMPTOM
├── direct cause
│   └── deeper cause
├── enabling condition
└── missing control
```

### Conflict Diagram

Use when two requirements appear incompatible.

```text
Objective
├── Need A -> Want X
└── Need B -> Want not-X
Assumption to break: ...
```

### Future Reality Tree

Use before recommending a non-trivial redesign.

```text
CHANGE
├── desired effect
├── possible negative branch
│   └── prevention
└── verification signal
```

### Logic Tree

Use for implementation reviews.

```text
Entry point
├── path A
│   ├── happy
│   ├── empty
│   └── error
└── path B
```

## Code Smell Taxonomy

Only report smells inside the current requirement blast radius or smells made worse by the current work.

| Smell | Review question | Preferred fix shape |
| --- | --- | --- |
| rigidity | Does a small change force unrelated edits? | move decision to one owner |
| duplication | Is the same logic repeated with small variations? | reuse existing helper or make one narrow helper |
| cycle | Do modules know each other's internals? | invert dependency or extract boundary |
| fragility | Can one change break unrelated behavior? | isolate side effects and add focused tests |
| obscurity | Is intent hidden behind clever names or control flow? | rename, split, or make data shape explicit |
| data-clump | Do fields always travel together? | group them into one object/value |
| unnecessary-complexity | Is abstraction solving a hypothetical future? | delete seam or collapse to direct code |

## Severity

- `critical`: ships wrong behavior, data/security risk, silent failure, broken root cause, or impossible verification.
- `important`: likely maintenance, test, UX, DX, performance, or operability problem in current scope.
- `advisory`: good improvement but not required for this change.

## Confidence

- `9-10`: directly verified in code, artifact, command output, UI run, or log.
- `7-8`: strong evidence from nearby patterns and diff.
- `5-6`: plausible but needs confirmation; mark as verify-first.
- `<5`: do not put in main findings unless critical impact.

## Decision Questions

Ask only when a finding requires user judgment. Do not stop the whole review at the first decision unless that answer blocks the next review node.

Use:

```text
D<N> - <decision title>
Evidence: <concrete artifact/path/line/log/UI action>
Risk: <what breaks if ignored>
Recommendation: A because <principle>
Options:
A) <fix now> (recommended) - impact
B) <defer> - impact
C) <skip> - impact
STOP: wait for the user answer before continuing.
```

After the node pass, present a decision queue:

```text
Decision Queue
├── D1 scope or architecture decision
├── D2 user-visible behavior decision
└── D3 test strategy decision
```

Then ask decisions one by one. Do not batch unrelated issues inside one decision.
