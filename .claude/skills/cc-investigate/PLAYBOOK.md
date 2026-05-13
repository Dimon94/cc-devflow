# CC-Investigate Playbook

## State Machine

`cc-investigate -> cc-do -> cc-check`

- Enter when root cause is unknown.
- Stay until `task.md#Root Cause Contract` is evidence-backed.
- Exit after the Investigate commit exists.

## Rules

1. Reproduce before guessing.
2. Prove first bad state before naming root cause.
3. Write only `task.md`; Git records the stage.
4. No process file beyond `task.md`.
5. Reroute instead of mixing feature planning into bug investigation.
6. Classify the investigation mode before tracing evidence.
7. Record hypotheses with falsification methods and actual observations.
8. Missing first bad state, original trigger, or counterfactual proof stops repair tasks.

## Investigation Modes

- `reproduce-first`
- `feedback-loop`
- `diff-trace`
- `boundary-probe`
- `backward-trace`
- `condition-wait`
- `reference-compare`
- `workflow-forensics`
- `performance`
- `diagnose-only`

## Root Cause Contract Fields

`task.md#Root Cause Contract` includes:

- Investigation mode
- Symptom, expected, actual, reproduction
- Feedback loop contract
- Evidence chain
- Root Cause Proof Ladder
- Hypothesis table
- Boundary probe matrix when applicable
- Backward trace chain when applicable
- Reference comparison when applicable
- Diagnostic instrumentation and cleanup when used
- Repair boundary
- Correct test seam
- Prevention / escape reason
- Diagnose-only or reroute next action when repair is not valid

## Exit

`task.md` must tell `cc-do` what to fix, what not to touch, and what command proves the repair. Commit the Investigate stage before handing off.
