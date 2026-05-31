# cc-check Checklist Contract

## Diagnosis

Verification is brittle when green commands are treated as equivalent to proven requirements.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: current response and the verification-stage Git commit when policy allows
- Failure route: `cc-act`, `cc-do`, `cc-diagnose`, `cc-plan`, or stop

## Pause Points

1. Before verdict: reset contract and rerun the smallest trustworthy gate.
2. Before pass: complete claim evidence and test-quality review.
3. Before exit: freeze `pass`, `fail`, or `blocked` and one next route.

## Required Checks

- [ ] `task.md`, current diff, relevant code/tests, PR text, and fresh command output were read
- [ ] commands were rerun now, not inherited from `cc-do` narration
- [ ] each passing claim maps to command, exit status, key observation, and requirement
- [ ] behavior or bugfix evidence includes confidence-per-minute proof value: suite layer, command/runtime, real bug/regression/user-visible failure caught, fixture/mock boundary, and low-value tests avoided
- [ ] diff is checked for missing scope, scope creep, and unintended file touch
- [ ] failures are owned as branch, baseline, environment, external, or unknown

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
