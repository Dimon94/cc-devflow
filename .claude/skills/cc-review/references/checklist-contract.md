# cc-review Checklist Contract

## Diagnosis

Review quality collapses when suspicion, stale context, or style preference is promoted to finding.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: current response, GitHub review, or `task.md` for plan/investigation review writeback
- Failure route: `cc-plan`, `cc-investigate`, `cc-do`, `cc-check`, `cc-act`, or stop

## Pause Points

1. Before reviewing nodes: freeze scope and delta.
2. Before emitting a finding: prove evidence, impact, route, and branch chain when needed.
3. Before exit: write plan/investigation findings into `task.md` or ask for implementation repair choice through `../cc-dev/references/user-choice-output-protocol.md`.

## Required Checks

- [ ] review target is classified as plan, investigation, implementation, PR, or mixed
- [ ] scope and explicit non-scope are frozen before finding smells
- [ ] delta is grounded in Git diff, PR diff, `task.md`, commands, logs, UI, or missing evidence
- [ ] each finding has evidence, impact, recommendation, and route
- [ ] complexity report requests include scope, detected stack/test/build commands, ranked findings, patch status, and files-modified yes/no
- [ ] complexity repair recommendations preserve ordering, duplicate-key semantics, object identity, cache invalidation, permissions, pagination, and error behavior or mark the evidence as blocked
- [ ] implementation repair choices use host-native choice UI or a fallback block with 2-3 mutually exclusive options; a single recommended action is not a valid choice
- [ ] weak or out-of-scope claims are downgraded to residual risk or blocked evidence

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
