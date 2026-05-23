# Structural Quality / Code-Judo Review

Use this reference when `cc-review` selects the structural quality facet. This
facet is strict, but still evidence-bound: it is a review lens, not a separate
workflow and not a nit quota.

## Baseline

- Audit implementation quality and maintainability, not only whether behavior
  runs.
- Re-think structure, abstraction, ownership boundaries, branch growth, and
  readability while preserving behavior.
- Look for code-judo moves: delete whole classes of helpers, modes, state, or
  branches instead of relocating complexity.
- Keep recommendations behavior-preserving and name the tests or measurements
  needed to prove that preservation.

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
- approval verdict: approve, block, or defer with explicit risk

## Priority

1. Structural regression, wrong layer, or canonical ownership break.
2. Clear missed code-judo simplification.
3. Spaghetti or branching complexity growth.
4. Boundary, abstraction, or type contract that makes the system harder to
   reason about.
5. File-size and split problems.
6. Modularity, abstraction payoff, readability, or maintainability issues.

Do not drown real structure issues in naming, comment, formatting, or style
nits.
