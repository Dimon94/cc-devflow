# Plan Review Branch

Use this reference when the review target is a plan, investigation handoff, or mixed branch whose plan contract may be wrong.

## Intake

Read, in order:

1. `planning/design.md` or `planning/analysis.md`
2. `planning/tasks.md`
3. `planning/task-manifest.json`
4. `change-meta.json`
5. related roadmap/spec/docs/code referenced by the plan

If no change directory exists, review the user-provided plan text and clearly mark missing durable artifacts.

## Review Shape

First select applicable facets, then create one or more review nodes for each selected facet. Do not load every facet when the plan is small, but do not skip a selected facet merely to keep the answer short.

For complex plans, assign selected facets to independent read-only reviewers when subagent support is available. Strategy, engineering, design, DX, and TOC reviewers should not share intermediate conclusions; the main thread merges their findings after each reviewer returns.

### 1. Strategy Facet

Use a native strategy review question set:

- Is this the right problem?
- Is the stated user/business outcome direct or a proxy?
- What happens if we do nothing?
- What does the 12-month ideal look like?
- What existing code or workflow already solves part of this?

Output:

```text
CURRENT -> THIS PLAN -> 12-MONTH IDEAL
```

Node examples:

- `plan.strategy.problem-fit`
- `plan.strategy.outcome-signal`
- `plan.strategy.do-nothing-risk`

### 2. Engineering Facet

Review:

- component boundaries
- data flow and shadow paths
- state transitions
- security boundaries
- rollback shape
- testability seam
- parallelization risk

Required diagram for non-trivial plans:

```text
Entry -> validate -> transform -> persist -> output
  |        |            |            |          |
 nil     invalid      exception    conflict   stale
 empty   wrong type   timeout      duplicate  partial
```

Node examples:

- `plan.engineering.boundaries`
- `plan.engineering.data-flow`
- `plan.engineering.state-transitions`
- `plan.engineering.testability`

### 3. Design Facet

Run only for user-facing UI or interaction flows.

Check:

- first, second, third thing the user sees
- loading / empty / error / success / partial states
- responsive and accessibility intent
- generic UI or AI slop risk
- whether live design review will be needed after implementation

Node examples:

- `plan.design.primary-flow`
- `plan.design.states`
- `plan.design.responsive-accessibility`

### 4. DX Facet

Run only for API, CLI, SDK, package, docs, agent skill, MCP, or developer/operator surfaces.

Check:

- target developer/operator persona
- time to first value
- install/run/debug/upgrade path
- actionable errors: problem + cause + fix
- copy-paste examples and escape hatches

Node examples:

- `plan.dx.first-value`
- `plan.dx.errors`
- `plan.dx.examples`

## TOC Root-Cause Pass

For complex bugs, use:

1. Current reality tree: symptoms, causes, enabling conditions.
2. Conflict diagram: why the obvious fix conflicts with a real need.
3. Future reality tree: what the proposed fix changes and what it may break.

If the root cause is not proven, reroute to `cc-investigate`, not `cc-do`.

Record each TOC pass as a separate node so the review can resume:

- current reality tree
- conflict diagram
- future reality tree

## Code Smell Pass In Planning

Plans can contain smells before code exists:

- repeated implementation steps with slight variations
- parallel data sources
- task split by technical layer instead of behavior
- fake abstraction or one-adapter seam
- missing owner for shared state
- hand-wavy "handle edge cases" or "add validation"

Each planning smell must become a plan finding and route to `cc-plan`.

## Output Requirements

Add to `cc-review-report.md`:

- plan review nodes checked, skipped, or blocked
- plan reviewer agents used or fallback reason
- plan artifacts read
- strategy/engineering/design/DX facets used
- diagrams produced
- in-scope bad smells
- decisions needed
- reroute recommendation

If any plan facet changes the task list or implementation contract, route to `cc-plan`.
