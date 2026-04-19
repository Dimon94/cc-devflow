# Skill Runtime Migration

## Result

`lib/harness/` has been removed from the repository.

The workflow now follows one clear ownership model:

- public workflow semantics live in `SKILL.md`, `PLAYBOOK.md`, templates, and skill-local scripts
- reusable internal helpers live in `lib/skill-runtime/`
- the public entry surface remains `cc-devflow init`, `cc-devflow adapt`, and the five shipped skills

## What Moved

The old internal runtime modules were moved from `lib/harness/` to `lib/skill-runtime/`.

That includes:

- artifact and IO helpers
- schema and planner helpers
- lifecycle and query helpers
- runtime operations used by internal tests

## What Changed

- `cc-check` gate execution and `report-card.json` assembly now run through skill-local scripts
- task/context recovery guidance lives with `cc-do`
- `cc-act` owns PR and release-side closure scripts
- the old `autopilot-stages.js` compatibility layer was removed
- tests and contributor docs now point at `lib/skill-runtime/` and `lib/skill-runtime/__tests__/`

## Current Boundary

`lib/skill-runtime/` is not the product story.

It exists only as shared support code for skill-local scripts and internal verification. When adding new behavior:

1. put workflow rules in the relevant public skill first
2. prefer skill-local scripts over new shared runtime logic
3. only add shared code when duplication would be fragile or noisy

## Follow-ups

- keep trimming duplicated narration from `intent.js`, `query.js`, and `autopilot` helpers
- continue replacing compatibility-only tests with skill-script-oriented coverage where practical
- avoid introducing any new `harness:*` language, paths, or mental model in docs or code
