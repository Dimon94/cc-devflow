# Structural Quality / Code-Judo Review

Use this reference when `cc-review` selects the structural quality facet. This
facet is strict, but still evidence-bound: it is a review lens, not a separate
workflow and not a nit quota.

## Baseline

- Audit implementation quality and maintainability, not only whether behavior
  runs.
- Treat substantial app work as production-shaped unless the user explicitly
  says it is disposable.
- Preserve product behavior while restructuring. Do not mix broad cleanup with
  behavior change unless the bug fix is explicit and tested.
- Protect persisted state, stored schemas, localStorage, database rows, and
  deployed API contracts. Prefer normalizers and migrations over resets.
- Look for code-judo moves: delete whole classes of helpers, modes, state, or
  branches instead of relocating complexity.
- Keep recommendations behavior-preserving and name the tests or measurements
  needed to prove that preservation.

## Approval Bar

Do not approve only because behavior works. When the structural-quality facet is
selected, approval also requires:

- no clear structural regression
- no obvious behavior-preserving code-judo simplification left on the table
- no unjustified push past 1000 LOC or continued growth of an already oversized
  hot file
- no scattered special branches, feature checks, or temporary modes in shared
  flows
- no hacky or magical abstraction that hides a simple data shape
- no thin wrapper, duplicate helper, cast-heavy contract, or unnecessary
  optionality that blurs the real invariant
- no logic placed in the wrong layer or bypassing an existing canonical helper

## Maintainability Guardrails

- Entrypoints stay thin: `main`, `App`, route files, layouts, and top-level
  stylesheets orchestrate rather than own product behavior.
- Source files stay small enough for agents and humans to edit. Aim for roughly
  250-400 LOC when practical; files over 500 LOC need a reason, and hot files
  over 1000 LOC are structural risk unless clearly partitioned.
- Split by feature, provider, or domain behavior instead of vague `utils`,
  `helpers`, or `misc` buckets.
- Separate pure domain logic from rendering and side effects. Schemas,
  reducers, normalizers, prompt builders, retry helpers, provider parsing, and
  transformations belong in testable modules.
- Centralize frontend/backend contracts and request/response types at the
  boundary between client, server, providers, jobs, and storage.
- Avoid pass-through prop blobs. Props should be explicit and behavior-oriented
  unless passing a stable domain object.
- Keep CSS feature-owned or token-based. Global CSS is limited to reset,
  tokens, browser fixes, and small shared primitives.
- Treat UI layout regressions as product bugs. For meaningful UI changes,
  require real viewport screenshots or a stated gap across mobile, desktop,
  tablet, and wide layouts.

## Antislop Recovery

Use this mode for messy, prototype, overgrown, or slop-prone codebases. Review
for the smallest migration path that makes the repo easier to change without
turning review into an implementation plan or audit microsite.

- Establish repo facts first: largest files, entrypoints, package scripts,
  tests, deployment shape, API boundaries, persisted data, active dirty work,
  recent commits, and user-critical workflows.
- Require a safety net before broad refactors: existing checks, focused
  characterization tests, screenshots for core UX, or explicit blockers.
- Prefer green slices ordered by blast radius: pin contracts, split hot files,
  extract pure models/helpers, tighten types at external boundaries, consolidate
  duplicated API/provider helpers, then clean styling surface by surface.
- Preserve compatibility through barrels/facades or adapters while callers move.
- Keep concurrency single-owner for hot files; independent analysis or edit
  slices are useful only when their merge surface is clear.
- Do not expand a maintainability cleanup into security, observability,
  compliance, SRE, or full production-readiness unless the user asks. Route
  those to hardening specialists or planning.

## Core Questions

- Is there a code-judo move that keeps behavior but removes a branch, helper,
  mode, state, or layer?
- Would a different state model, dispatcher, policy object, or ownership
  boundary make special cases become normal cases?
- Does the diff make local architecture more direct, or push working code into
  a more tangled path?
- Is a new condition branch a symptom of a missing model, policy, dispatcher,
  or canonical helper?
- Does an abstraction reduce cognitive load, or is it a thin wrapper,
  identity wrapper, or pass-through helper?
- Are type boundaries clearer, or are `any`, `unknown`, casts, optional fields,
  and silent fallbacks hiding invariants?
- Is logic located in the canonical owner, or did feature-specific detail leak
  into a shared path?
- Did UI, API, provider, or storage behavior escape into an entrypoint,
  rendering component, global stylesheet, or untyped helper bucket?
- Are persisted-state or contract changes compatibility-preserving?
- Did this diff push a large file past a readability threshold or continue to
  grow an already hard-to-scan file?
- Do repeated conditions, copied helpers, temporary flags, or nullable modes
  show that a concept has not been modeled?
- Is independent async work serialized without a reason, or can callers observe
  half-complete related state?

## Aggressive Flags

- Complexity was moved into another function, hook, class, or wrapper without
  becoming easier to reason about.
- A refactor only relocated code and did not reduce the concepts a reader must
  hold at once.
- A busy flow gained a one-off boolean, nullable mode, feature check, temporary
  branch, or edge-case clause.
- A PR pushes a file over 1000 lines without strong structure proof that the
  file remains clear.
- A source file crosses 500 LOC in a hot path without a split plan or clear
  ownership reason.
- A route, app shell, layout, or top-level stylesheet starts owning domain
  behavior.
- Product behavior lands in vague `utils`, `helpers`, `common`, or `misc`
  folders without a domain owner.
- The change copies an existing helper, bypasses canonical utility, or places a
  concept in the wrong package, service, or module.
- Generic or magical machinery hides a simple data shape and makes the caller
  contract harder to see.
- Casts, optionality, or fallback logic are used to smooth over an unclear
  model or input contract.
- A narrow edge case is inserted into an already crowded function, making the
  main path harder to scan.
- The refactor passes tests but does not reduce modularity, readability, or
  ownership risk.
- A styling migration changes UI without realistic viewport proof.
- Cleanup resets, drops, or rewrites persisted state instead of normalizing or
  migrating it.

## Preferred Remedies

- Delete unhelpful middle layers instead of renaming them.
- Change the state model so special branches disappear instead of collecting
  more `if` statements elsewhere.
- Move feature logic back to the canonical module that owns the concept; keep
  shared paths limited to stable contracts.
- Replace repeated condition chains with a typed model, explicit dispatcher,
  policy object, or state machine when that reduces branches.
- Extract a pure helper, focused module, or subcomponent only when it removes
  duplication or shrinks the scanning surface.
- Reuse the canonical helper and delete near-duplicate implementations.
- Extract pure domain logic before reshaping UI shells.
- Pin shared contracts with types, schemas, or characterization tests before
  consolidating API/provider helpers.
- Keep old import surfaces through compatibility barrels while a migration
  moves callers in slices.
- Separate orchestration from business logic; keep dependency relationships
  explicit when independent work can run in parallel.
- Make related updates atomic enough that callers cannot observe half-finished
  state.

## Finding Fields

Structural quality findings include:

- current structure
- missed code-judo simplification
- branching / abstraction / type-boundary smell
- canonical ownership boundary
- recommended restructuring
- behavior-equivalence argument
- safety net: focused test, characterization test, viewport proof, migration,
  or blocker
- approval verdict: approve, block, or defer with explicit risk

## Priority

1. Structural regression, wrong layer, or canonical ownership break.
2. Clear missed code-judo simplification.
3. Spaghetti or branching complexity growth.
4. Boundary, abstraction, or type contract that makes the system harder to
   reason about.
5. File-size and split problems.

Do not drown real structure issues in naming, comment, formatting, or style
nits.
