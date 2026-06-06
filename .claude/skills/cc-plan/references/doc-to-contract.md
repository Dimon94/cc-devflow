# Doc-To-Contract Gate

## Purpose

Use this gate after domain grilling and context crystallization, before task
generation. `CONTEXT.md`, ADRs, specs, and grill answers are prose source
material; `cc-plan` must compress their clear facts into an executable
technical contract so `cc-do` does not infer architecture from ambiguity.

This is a planning contract, not an implementation route. Do not write business
behavior during `cc-plan`. Record the intended typed structure in `task.md`
and turn it into tracer-bullet tasks.

## Source Material

Read in this order:

1. `AGENTS.md` and repo coding rules.
2. `CONTEXT-MAP.md`, if present.
3. Relevant `CONTEXT.md` files.
4. Relevant ADRs.
5. Approved grill answers, specs, issue text, or existing task truth.
6. Existing source, tests, scripts, and generated artifacts near the target
   area.

If there is no domain context, ADR, spec, approved grill answer, or repo
evidence to support the architecture contract, keep planning open or route to
`references/domain-grilling-contract.md`.

## Fact Buckets

Extract only facts that can be backed by source evidence or an approved user
decision:

| Bucket | Extract |
| --- | --- |
| Language | canonical terms, forbidden aliases, naming collisions |
| Shape | variants, states, invariants, cardinality, impossible combinations |
| Boundary | module ownership, caller/callee responsibility, hidden complexity |
| Dependency | allowed import/call direction and forbidden shortcuts |
| Runtime | service seams, composition, config, time, absence/nullability |
| Adapter | production/test adapters and external infrastructure boundaries |
| Call stack | production path and test path through the system |
| Error | typed failures, result families, translation boundaries |
| Edge | where raw input becomes validated domain data |
| Test surface | highest public seam future behavior tests should target |

## Ambiguity Gate

Before tasks are generated, each clear prose fact must map cleanly to at least
one contract artifact:

- domain type, schema, brand, invariant, or smart constructor,
- discriminated union or state model,
- service/interface seam,
- typed error/result family,
- production/test adapter slot,
- composition layer, provider, registry, or factory,
- dependency-direction rule,
- production/test call stack,
- public verification seam.

If the mapping requires awkward optional fields, permits impossible
combinations, hides a conflicting term, or leaves a caller guessing setup order,
the fact is still ambiguous. Ask one `D<N>` decision question, gather more repo
evidence, or add an explicit spike; do not let `cc-do` resolve it silently.

## Contract Shape

Record a `Doc-To-Contract` section in the selected `task.md` template:

- Source facts table: fact, source, contract artifact, confidence.
- Typed structure: domain types, schemas, brands, invariants, state models.
- Interface seams: public operations, callers, input/output, permissions.
- Adapter topology: production adapter, test adapter, external boundary hidden.
- Error contract: expected failures, typed names, translation boundary.
- Call stacks: production path and test path.
- Dependency rules: allowed and forbidden edges, mechanical check if practical.
- Validation edges: raw input boundaries and parser/constructor ownership.
- Business logic excluded: behavior intentionally left for TDD tasks.

Use project conventions. If the repo uses Effect services, DI containers,
factory functions, modules, providers, layers, parser libraries, Result types,
or branded values, express the contract in that style instead of inventing a
parallel pattern.

## Task Conversion

Convert the typed structure into vertical tracer bullets:

1. First freeze the contract artifact that removes ambiguity.
2. Then add the narrow Red test proving behavior through the highest public
   seam.
3. Then implement the smallest Green behavior behind the already named seam.
4. Then refactor without changing the public contract.

Do not create horizontal tasks such as "backend types", "adapters", "tests",
or "docs" unless each task still closes a user or edge story through a public
verification seam.

## Allowed Depth

Allowed in the plan contract:

- domain types, schemas/parsers, brands,
- discriminated unions/state models,
- smart constructors for validated values,
- service/interface seams,
- typed errors/results,
- composition topology,
- memory/no-op adapters needed for typecheck or architecture tests,
- production stubs that fail with typed `NotImplemented` errors,
- architecture tests, lint rules, or import-boundary checks.

Not allowed unless the user expands scope:

- feature or business behavior,
- real persistence queries or network calls,
- real HTTP handlers beyond contracts/boundaries,
- broad refactors unrelated to codifying approved context,
- speculative helper frameworks without concrete contract pressure.

## Completion Signal

Before `task.md` is frozen:

- no clear context fact remains prose-only when it affects implementation,
- impossible states and expected failures are named,
- public seams, adapters, error translation, and call stacks are explicit,
- raw input validation ownership is explicit,
- test seams are tied to user or edge stories,
- unresolved mappings are recorded as `D<N>` decisions, assumptions, or spikes.
