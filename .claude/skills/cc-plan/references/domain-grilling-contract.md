# Domain Grilling Contract

## Purpose

Use this contract when a plan must be challenged against the existing domain
model, project language, documented decisions, and code truth before tasks are
frozen.

Every `cc-plan` starts here after the isolated worktree is prepared and before
the first unresolved user question is asked. The goal is to refine the demand
against the current domain model before `task.md` is generated.

Interview the user relentlessly about every aspect of the plan until there is a
shared understanding. Walk down each branch of the design tree, resolving
dependencies between decisions one by one. For each question, provide the
recommended answer.

Ask questions one at a time and wait for feedback before continuing. If a
question can be answered by exploring the codebase, explore the codebase
instead.

## Domain Awareness

During codebase exploration, also look for existing documentation.

Most repos have a single context:

```text
/
|-- CONTEXT.md
|-- docs/
|   `-- adr/
|       |-- 0001-event-sourced-orders.md
|       `-- 0002-postgres-for-write-model.md
`-- src/
```

If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The
map points to where each one lives:

```text
/
|-- CONTEXT-MAP.md
|-- docs/
|   `-- adr/                          # system-wide decisions
`-- src/
    |-- ordering/
    |   |-- CONTEXT.md
    |   `-- docs/adr/                 # context-specific decisions
    `-- billing/
        |-- CONTEXT.md
        `-- docs/adr/
```

Create files lazily: only when there is something stable to write. If no
`CONTEXT.md` exists, create one when the first term is resolved. If no
`docs/adr/` exists, create it when the first ADR is needed.

## During The Session

### Challenge Against The Glossary

When the user uses a term that conflicts with existing language in
`CONTEXT.md`, call it out immediately:

```text
Your glossary defines "cancellation" as X, but you seem to mean Y. Which is it?
```

### Sharpen Fuzzy Language

When the user uses vague or overloaded terms, propose a precise canonical term:

```text
You are saying "account". Do you mean the Customer or the User? Those are
different things.
```

### Discuss Concrete Scenarios

When domain relationships are being discussed, stress-test them with specific
scenarios. Invent scenarios that probe edge cases and force precision about the
boundaries between concepts.

### Cross-Reference With Code

When the user states how something works, check whether the code agrees. If you
find a contradiction, surface it:

```text
Your code cancels entire Orders, but you just said partial cancellation is
possible. Which is right?
```

### Update `CONTEXT.md` Inline

When a term is resolved and the user confirms the durable context delta, update
`CONTEXT.md` right there. Do not batch confirmed term updates until the end of
the session. Use `references/CONTEXT-FORMAT.md`.

`CONTEXT.md` must be totally devoid of implementation details. Do not treat
`CONTEXT.md` as a spec, a scratch pad, or a repository for implementation
decisions. It is a glossary and nothing else.

### Offer ADRs Sparingly

Only offer to create an ADR when all three are true:

1. Hard to reverse: the cost of changing your mind later is meaningful.
2. Surprising without context: a future reader will wonder why it was done this
   way.
3. The result of a real trade-off: there were genuine alternatives and one was
   picked for specific reasons.

If any of the three is missing, skip the ADR. Use
`references/ADR-FORMAT.md`.

## Relationship To `cc-plan`

Domain grilling is part of planning, not a separate process artifact. Durable
outcomes go to the normal `cc-plan` sinks:

- `task.md#Contract Summary` records the questions asked, evidence found,
  contradictions, confirmed decisions, deferred context deltas, and explicit
  release.
- `CONTEXT.md` records only confirmed glossary terms.
- `CONTEXT-MAP.md` records only real multi-context routing.
- `docs/adr/*.md` records only ADR-worthy decisions.

Do not write an extra grilling transcript file.

## Completion Signal

Before task blocks are generated, `task.md#Contract Summary` must show:

- glossary conflicts checked or explicit skip reason,
- fuzzy or overloaded terms sharpened,
- at least one concrete scenario considered for non-trivial domain plans,
- user claims that could be checked from code were checked from code,
- confirmed context updates written inline or deferred with reason,
- ADR-worthy decisions created or skipped with the three-part test.
