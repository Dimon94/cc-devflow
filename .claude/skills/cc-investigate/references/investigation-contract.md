# Investigation Contract

## Iron Law

- No root cause, no repair.
- No frozen `task.md#Root Cause Contract`, no repair task.

## Minimum Evidence

- symptom
- reproduction path
- expected vs actual
- code path
- recent change signal
- prior postmortem signal
- first bad state
- violated contract
- original trigger
- counterfactual proof
- escape reason
- repair boundary
- verification command

## Output Shape

- `task.md#Root Cause Contract` is the human truth.
- `task.md` task blocks are the repair handoff.
- Git commit records Investigate completion.
- No process file beyond `task.md`.

## Reroute

If the issue is missing product scope, go to `cc-plan`. If it is roadmap priority, go to `cc-roadmap`. If evidence is unavailable, return an Evidence Request.
