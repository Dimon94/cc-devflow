# Changelog

## 1.0.1

- Added `workflow-context` as the compact stage-transition packet so cc-dev can drive PDCA/IDCA without reloading the whole loop history each step.
- Required every post-planning stage transition to follow the query's `nextAction`, `defaultRead`, and `openWhen` fields.

## 1.0.0

- Added goal-style PDCA/IDCA development autopilot that drives current-worktree work to a remote PR without merging.
