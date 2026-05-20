# Investigation Contract

## Iron Law

- No root cause, no repair.
- No frozen `task.md#Root Cause Contract`, no repair task.

## Minimum Evidence

- investigation mode
- symptom
- reproduction path
- expected vs actual
- feedback loop contract
- code path
- recent change signal
- prior postmortem signal
- evidence chain
- tested hypotheses and falsification results
- first bad state
- violated contract
- original trigger
- counterfactual proof
- escape reason
- boundary probe, backward trace, or reference comparison when applicable
- repair boundary
- correct test seam
- verification command
- investigation Socratic dialogue: current-state inspection before solution questions, repo-answered facts, user-answered phenomenon gaps, 3 hidden repair assumptions, overengineering/symptom-fix challenge, adversarial review findings, and explicit release before repair tasks when confirmation was needed
- ASCII branch-chain connector tokens stay ASCII, but labels, evidence, and explanatory text follow `Output language`.

## Investigation Modes

- `reproduce-first`: stabilize the reported failure before naming root cause.
- `feedback-loop`: sharpen a slow, broad, or flaky signal before proof.
- `diff-trace`: inspect recent changes and behavioral breakpoints.
- `boundary-probe`: inspect every component boundary before localizing repair.
- `backward-trace`: trace from symptom site to bad value origin and original trigger.
- `reference-compare`: compare working and broken paths before guessing.
- `condition-wait`: replace sleeps/timeouts with real completion conditions.
- `workflow-forensics`: classify artifact, Git, state, tool, permission, or process failure.
- `performance`: collect baseline/profile/query/bisect evidence.
- `diagnose-only`: produce evidence handoff, monitoring, human action, or reroute; do not invent repair tasks.

## Root Cause Proof

The contract must climb the ladder:

1. Symptom Site
2. First Bad State
3. Violated Contract
4. Original Trigger
5. Counterfactual Proof
6. Escape Reason

Missing first bad state, original trigger, or counterfactual proof means no confirmed repair task. Return an Evidence Request, diagnose-only handoff, or reroute.

## Investigation Socratic Dialogue

Ask only the minimum phenomenon facts needed to reproduce before current-state inspection. Technical-detail and solution-shape questions come after code, logs, history, artifacts, and feedback loop evidence have been inspected.

When confirmation is needed, ask one question at a time with a recommended answer. Prefer answering from evidence over asking the user. Before repair tasks exist, challenge 3 hidden assumptions, reject symptom-site fixes unless proven as original trigger, run an adversarial review of the current code or proposed repair, and wait for explicit user release that the root-cause contract is detailed enough to enter repair.

## Output Shape

- `task.md#Root Cause Contract` is the human truth.
- `task.md` task blocks are the repair handoff.
- Git commit records Investigate completion.
- No process file beyond `task.md`.

## Reroute

If the issue is missing product scope, go to `cc-plan`. If it is roadmap priority, go to `cc-roadmap`. If evidence is unavailable, return an Evidence Request.
