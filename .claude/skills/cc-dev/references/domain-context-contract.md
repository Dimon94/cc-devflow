# Domain Context Contract

## Purpose

`CONTEXT.md`, `CONTEXT-MAP.md`, and `docs/adr/*.md` are the durable language
and decision layer for a project. They prevent agents from re-inventing terms,
re-litigating settled decisions, or treating one task's implementation notes as
project truth.

They do not replace cc-devflow workflow truth:

- `devflow/roadmap.json` owns roadmap state.
- `devflow/specs/` owns capability specs when present.
- `devflow/changes/<change-key>/task.md` owns the current change contract.
- Git, PRs, and handoff files own delivery truth.

## Read Gate

Before planning, investigating, executing, or reviewing non-trivial work, scan
the relevant context docs:

1. If root `CONTEXT-MAP.md` exists, read it first and follow only the contexts
   relevant to the current work.
2. Otherwise, read root `CONTEXT.md` when present.
3. Read ADRs that touch the affected domain, module, interface, provider,
   workflow, data contract, or release boundary.
4. If none of these files exist, silently continue with the normal workflow.
   Do not mention the missing context system to the user, do not record absence
   as evidence, and do not create files preemptively.

Repo evidence still wins. If context docs contradict code, tests, specs, or
current workflow artifacts, surface the conflict and route it to the current
skill's decision or review path before freezing work.

## File Roles

### `CONTEXT.md`

Glossary only. Use it for canonical domain terms, aliases to avoid, ambiguity
notes, ownership language, and cross-links to related terms.

Do not put implementation steps, task plans, specs, temporary notes, status,
acceptance criteria, code snippets, or meeting summaries in `CONTEXT.md`.

Create it lazily only after a term or boundary has resolved enough to preserve.

### `CONTEXT-MAP.md`

Use only when a single repo has multiple distinct bounded contexts with
different vocabularies or decision spaces. It maps context name -> context
directory -> local glossary/ADR location -> when to use it.

Do not create `CONTEXT-MAP.md` just because multiple repos, modules, packages,
or folders are mentioned. A single-context repo should use one root
`CONTEXT.md`.

### `docs/adr/*.md`

ADRs record decisions that are all three:

1. hard or expensive to reverse,
2. surprising without the original context,
3. the result of a real trade-off.

Use sequential numbering. Keep ADRs short: context, decision, consequences,
alternatives considered, and links to related glossary terms or specs.

Do not write ADRs for ordinary task choices, obvious implementation details,
temporary constraints, or decisions already fully captured by `task.md`.

## Growth Gate

At every meaningful pause point after multi-turn clarification, plan approval,
root-cause freeze, implementation evidence, or review finding, check whether the
conversation produced durable context updates.

Propose updates only when there is new stable knowledge:

- a new canonical term,
- a term meaning changed or became disambiguated,
- an alias should be avoided,
- a bounded context split became real,
- an ADR-worthy decision was made,
- an existing ADR should be reopened because current evidence contradicts it.

The agent must summarize the proposed context delta and ask for user
confirmation before writing `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/*.md`.
If the user does not confirm, record the rejected or deferred context delta in
the skill's normal evidence sink when it affects current work.

## Update Shape

Use the smallest durable edit:

- `CONTEXT.md`: one term entry or a narrow edit to an existing term.
- `CONTEXT-MAP.md`: one context mapping or one routing clarification.
- `docs/adr/NNNN-title.md`: one decision with clear trade-off and consequence.

After confirmed updates, link back from the current `task.md` or review output
only when the context edit affects execution or review constraints. Do not
duplicate the glossary or ADR body inside `task.md`.

## Skill-Specific Application

- `cc-plan`: read context before decision questions; propose growth after
  requirement release and before final task generation.
- `cc-investigate`: read context before naming the violated contract; propose
  growth after root-cause freeze when a term, contract, or escape reason became
  durable.
- `cc-do`: read context before editing; do not invent context updates from
  implementation detail alone, but propose growth when execution proves the
  frozen language or ADR is wrong or incomplete.
- `cc-review`: read context before findings; treat ADR conflicts as explicit
  findings or residual risk, and propose ADR reopen/update only when evidence
  justifies it.
