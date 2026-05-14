# Plan Review Branch

Use this reference when the review target is a plan, investigation handoff, or mixed branch whose plan contract may be wrong.

## Intake

Read, in order:

1. `task.md`
2. relevant roadmap, issue, PR text, or user request
3. affected code/tests/docs referenced by the plan
4. existing command output only when it proves or disproves a planning assumption

If no `task.md` exists, review the user-provided plan text and make missing durable task contract a finding.

## Review Facets

Select only applicable facets, but do not skip a selected facet to keep the answer short.

### Strategy

Check:

- Is this the right problem?
- Is the stated user/business outcome direct or only a proxy?
- What happens if we do nothing?
- What does the 12-month ideal look like?
- What existing code or workflow already solves part of this?

Useful shape:

```text
CURRENT -> THIS PLAN -> 12-MONTH IDEAL
```

### Engineering

Check:

- component boundaries
- data flow and shadow paths
- state transitions
- security boundaries
- rollback shape
- testability seam
- parallelization risk

For non-trivial plans, reason through:

```text
Entry -> validate -> transform -> persist -> output
  |        |            |            |          |
 nil     invalid      exception    conflict   stale
 empty   wrong type   timeout      duplicate  partial
```

### Design

Run only for user-facing UI or interaction flows.

Check:

- first, second, third thing the user sees
- loading / empty / error / success / partial states
- responsive and accessibility intent
- generic UI or AI slop risk
- whether live design review will be needed after implementation

### DX / Operator

Run only for API, CLI, SDK, package, docs, agent skill, MCP, or developer/operator surfaces.

Check:

- target developer/operator persona
- time to first value
- install/run/debug/upgrade path
- actionable errors: problem + cause + fix
- copy-paste examples and escape hatches

### TOC Root Cause

For complex bugs:

1. Current reality tree: symptoms, causes, enabling conditions.
2. Conflict diagram: why the obvious fix conflicts with a real need.
3. Future reality tree: what the proposed fix changes and what it may break.

If the root cause is not proven, reroute to `cc-investigate`, not `cc-do`.

## Planning Smells

Plans can contain smells before code exists:

- repeated implementation steps with slight variations
- parallel data sources
- task split by technical layer instead of behavior
- fake abstraction or one-adapter seam
- missing owner for shared state
- hand-wavy "handle edge cases" or "add validation"

Each planning smell becomes a finding in `task.md` and routes to `cc-plan`.

## Output

Write plan review findings directly into `task.md`:

- scope or architecture finding
- evidence and impact
- required task or contract change
- decision options when user judgment is needed
- reroute recommendation

Final response only summarizes changed `task.md` sections and next route. Do not write separate files.
