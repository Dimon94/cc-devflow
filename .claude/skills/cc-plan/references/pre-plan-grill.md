# Pre-Plan Grill Mode

Use this mode only when a requirement is too broad, ambiguous, or domain-heavy
to freeze directly into `task.md`, or when the user explicitly asks for a
grilling / stress-test session before planning.

## Boundary

Pre-plan grill is discovery, not final planning truth.

- It may run in a child thread before `cc-plan` freezes the requirement.
- It may read `CONTEXT.md`, `CONTEXT-MAP.md`, ADRs, specs, code, tests, and
  recent commits to answer repo-answerable questions.
- It may update confirmed glossary or ADR decisions only through the normal
  domain context rules.
- It must not write task blocks, execution environments, or delivery decisions.
- Its durable result is folded into `task.md#Contract Summary` by `cc-plan`.

## Trigger

Run a pre-plan grill when any of these are true:

- the user asks to be grilled, questioned, or stress-tested before planning
- terms are fuzzy or conflict with domain context
- the change crosses multiple modules, contexts, or public contracts
- parallel execution seems likely but the dependency graph is not yet known
- the plan needs user decisions before `cc-plan` can produce executable work

Do not run it for a tiny change that `cc-plan` can freeze with one or two
evidence-backed decisions.

## Output Packet

Return a compact packet to the planning thread:

```md
## Pre-Plan Grill Packet

Requirement:
-

Resolved Terms:
-

Open Decisions:
| ID | Question | Recommended answer | User answer | Impact |
|----|----------|--------------------|-------------|--------|

Repo Evidence:
-

Context Updates:
- Applied:
- Proposed:
- Deferred:

ADR Candidates:
-

Plan Handoff:
- Recommended scope:
- Non-goals:
- Execution environment hints:
- Risk gates:
```

## Question Discipline

Ask one decision question at a time. If the repo can answer it, inspect the repo
instead. Every question must include a recommended answer and why it changes
scope, design, task split, verification, or domain language.
