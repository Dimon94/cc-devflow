# Confirmed Smell Gate

Use this reference before any `cc-simplify` edit.

Speculative cleanup candidates are reported, not edited. A confirmed smell needs
code fact, usage fact, requirement fact, and verification fact before any file
changes.

## Four Facts

1. Code fact: open the named file and adjacent implementation; prove the smell
   exists in the current tree.
2. Usage fact: search callers with `rg`; prove the reviewer did not miss a
   real caller contract.
3. Requirement fact: compare `task.md`, capability spec, public API, and product
   invariant; prove the simplification preserves required behavior.
4. Verification fact: name the exact command, test, parser, smoke, or manual
   check that will prove the edited tree.

## Deletion Test

Architecture findings must pass a deletion test before cleanup deletes, keeps,
or reshapes a module, wrapper, seam, or helper.

- If deletion only scatters the same complexity to callers, the code may be a
  valid deep module.
- If deletion removes the concept or leaves direct calls simpler, it is likely a
  pass-through / fake seam.
- If deletion violates a capability invariant or public contract, it is not a
  cleanup edit.

## Fixable Confirmed Smells

- confirmed duplicated branch
- repeated helper with a local canonical replacement
- false test seam
- shallow wrapper
- stale code or comment contradicted by current behavior
- local inefficient lookup where behavior stays identical
- small validation gap with an existing local pattern

## False-Positive Suppressions

Do not report these as findings:

- light repetition kept for readability
- behavior already covered by clear assertions
- impossible edge case under the product input domain
- one test covering several guards when the behavior is clear
- problem already fixed by the current diff
- intentional error swallow in shutdown, emergency, or fire-and-forget paths
- pass-through wrapper that is a stable public API over a real implementation

## Fresh Verification

After editing, run fresh checks. Old command output, reviewer output, and prior
chat claims cannot prove the current tree.
