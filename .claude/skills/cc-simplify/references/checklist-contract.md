# cc-simplify Checklist Contract

## Diagnosis

Simplification is valuable only when it refuses beautification and fixes confirmed smells inside the current diff.

## Checklist Mode

- Mode: read-do
- Evidence sink: working-tree code/test edits and the final Simplify Report
- Failure route: `cc-check` after edits, `cc-plan` for redesign, `cc-investigate` for disproven root cause, or stop

## Pause Points

1. Before reviewer dispatch: freeze diff scope and task/spec context.
2. Before fixing: verify each finding against code, usage, requirement, and verification facts.
3. Before exit: run fresh verification and route back to `cc-check` when edits changed code or evidence.

## Required Checks

- [ ] current diff scope, affected modules, stack signals, test signals, and related task/spec are identified
- [ ] read-only reviewer findings are parsed, deduped, confidence-gated, and verified by the main thread
- [ ] each fix passes code fact, usage fact, requirement fact, and verification fact checks
- [ ] only confirmed smells inside the current cleanup boundary are fixed
- [ ] fresh verification ran after any edit

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
