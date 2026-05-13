# Changelog

## 1.0.2

- internalize operating discipline at the PDCA/IDCA loop level: state assumptions, route interpretation, success criteria, stop conditions, and token checkpoint risk before lower-level action
- make budget pressure, skipped gates, stale evidence, and ambiguous success blockers instead of terminal success

## 1.0.1

- Added `workflow-context` as the context index so cc-dev can drive PDCA/IDCA without reloading the whole loop history each step.
- Required every post-planning stage transition to follow the query's `nextAction`, `mustNotForget`, `sourceHashes`, `defaultOpen`, and `openWhen.conditions` fields.

## 1.0.0

- Added goal-style PDCA/IDCA development autopilot that drives current-worktree work to a remote PR without merging.
