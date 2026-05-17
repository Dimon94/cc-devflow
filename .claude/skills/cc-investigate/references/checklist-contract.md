# cc-investigate Checklist Contract

## Diagnosis

Bug work becomes patch stacking when the first plausible cause is treated as proof.

## Checklist Mode

- Mode: read-do
- Evidence sink: `task.md#Root Cause Contract` and the Investigate-stage commit
- Failure route: `cc-do` for proven repair, `cc-plan` for design drift, diagnose-only, Evidence Request, or stop

## Pause Points

1. Before naming root cause: reproduce or create the closest honest feedback loop.
2. Before repair tasks: falsify competing hypotheses and trace the deepest proven source.
3. Before exit: commit investigation and route only proven repair work.

## Required Checks

- [ ] FIX key, isolated worktree, and branch contract are established
- [ ] symptom and closest honest feedback loop are captured
- [ ] hypotheses list includes falsification methods and rejected false causes
- [ ] first bad state, violated contract, original trigger, counterfactual proof, and escape reason are proven
- [ ] repair tasks state what to fix, what not to touch, and what command proves the repair

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
