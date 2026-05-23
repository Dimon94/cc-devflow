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
- regression proof contract: failure ownership, suite layer, command/runtime budget, proof value, fixture/mock boundary, focused suite shape, and low-value tests to avoid
- verification command
- investigation Socratic dialogue: current-state inspection before solution questions, repo-answered facts, user-answered phenomenon gaps, ten-round Dialogue Checkpoints, 3 hidden repair assumptions, overengineering/symptom-fix challenge, adversarial review findings, and explicit release before repair tasks when confirmation was needed
- ASCII branch-chain connector tokens stay ASCII, but labels, evidence, and explanatory text follow `Output language`.
- User-facing repair choices use `../cc-dev/references/user-choice-output-protocol.md`: host-native structured choice first, fixed A/B/C text fallback only when no structured-input tool exists.

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

## Evidence Flow

Write investigation truth into `task.md#Root Cause Contract`, not a new process file:

1. Symptom Capture: observed behavior, expected behavior, trigger, impact, reproduction entry.
2. Feedback Loop Contract: loop type, command or manual driver, expected failing signal, actual failing signal, symptom match, runtime, determinism, failure rate, sharpening plan.
3. Evidence Chain: time/data-flow ordered evidence; code reading alone is not reproduction.
4. Boundary Probe Matrix: for multi-component failures, record each boundary's input, output, config/env, state, and verdict.
5. Backward Trace Chain: for deep failures, record immediate failure site, direct caller, caller chain, bad value origin, original trigger, and rejected symptom-site fix.
6. Reference Comparison: similar working example, broken path, accepted hypotheses, ruled-out differences.
7. Hypothesis Table: 3-5 candidates reduced to 1-3 active hypotheses; every row has support, counter-evidence, falsification method, expected observation, and actual observation.
8. Diagnostic Instrumentation: temporary probes include tag, location, question answered, command, expected signal, actual signal, and cleanup requirement.
9. Correct Test Seam: say whether the regression test covers the real trigger chain; if only private implementation can be tested, record the design gap or reroute.
10. Regression Proof Contract: failure ownership, shortest trustworthy seam, suite layer, command/runtime budget, proof value, fixture/mock boundary, focused suite shape, and low-value tests to avoid.
11. Repair Boundary: affected module, allowed files, forbidden files, blast radius, split-or-reroute decision.
12. Investigation Socratic Dialogue: repo-answered facts, user-answered phenomenon gaps, 3 hidden repair assumptions, symptom-fix challenge, adversarial review finding, and the user's explicit release to freeze repair tasks when needed.

## Regression Proof Contract

The investigation must tell `cc-do` what kind of Red evidence is valid. A regression test is not valid because it fails; it is valid because it catches the proven first bad state through the shortest trustworthy user, API, CLI, artifact, or domain seam.

Record:

- Failure ownership: branch regression, baseline failure, environment drift, external dependency, product/spec ambiguity, or unknown.
- Shortest trustworthy seam: public caller, API, CLI, UI path, persisted artifact, trace replay, or domain function that exercises the real trigger chain.
- Suite layer: unit, integration, contract, E2E, smoke, golden artifact, migration check, trace replay, or manual/probe loop.
- Command/runtime budget: exact command or driver, expected duration, determinism, and retry/stress rules for flaky failures.
- Proof value: the bug or escaped contract this test would have caught before the reported symptom.
- Fixture/mock boundary: real data/state required, allowed fake boundary, forbidden overmocking, and whether provider/network/time/filesystem seams are simulated.
- Focused suite shape: minimum cases needed for Red, Green, and regression confidence.
- Low-value tests to avoid: broad snapshots, duplicate happy paths, no-op smoke tests, private-method call counts, overmocked internals, tests that only assert the new guard, and slow suites that do not isolate this failure.

If no correct seam exists, freeze an Evidence Request, design-gap task, or `cc-plan` reroute. Do not hand `cc-do` a decorative Red task.

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

When confirmation is needed, ask one question at a time with a recommended answer through the user-choice output protocol. Prefer answering from evidence over asking the user. Before repair tasks exist, challenge 3 hidden assumptions, reject symptom-site fixes unless proven as original trigger, run an adversarial review of the current code or proposed repair, and wait for explicit user release that the root-cause contract is detailed enough to enter repair.

Every 10 user-facing question rounds, write a Dialogue Checkpoint into `task.md#Root Cause Contract` before asking the next question. Each checkpoint records round range, next question number, decisions made, rejected repair options and reasons, remaining open questions, evidence sources read, hidden assumptions or adversarial findings so far, and current release status. After context compression, resume from the latest checkpoint before asking another question.

## ASCII Branch Chain Analysis

`task.md#Root Cause Contract` contains ASCII branch-chain trees for problem, solution, and impact. Investigation first traces upstream bad-state origin, then downstream blast radius, then the repair path.

Language rule:

- Tree structure tokens stay ASCII: `|--`, `` `-- ``, `|`, spaces, and plain punctuation.
- Node labels, placeholder text, explanations, and evidence summaries follow `Output language` in `task.md`.
- If `Output language` is unset, use the current conversation language and record the assumption.
- Do not hard-code English labels such as `Problem Chain` when the configured output language is not English.
- Use this label table as the shared source for chain titles, node labels, and placeholder text.

| Semantic slot | en | zh-CN |
| --- | --- | --- |
| problemChain | Problem Chain | 问题链 |
| symptomMarker | SYMPTOM | 症状 |
| failureSite | Failure site | 失败位置 |
| directCaller | direct caller | 直接调用方 |
| badValueState | bad value/state | 错误值或状态 |
| upstreamOrigin | Upstream origin | 上游源头 |
| codeSource | code source | 代码来源 |
| promptSource | prompt source | 提示词来源 |
| trigger | trigger | 触发条件 |
| rejectedSymptomFix | Rejected symptom fix | 已拒绝的症状修补 |
| solutionChain | Solution Chain | 解决链 |
| fixMarker | FIX | 修复 |
| firstBadStateRepair | First bad state repair | 首个错误状态修复 |
| contractRestored | Contract restored | 恢复的合同 |
| regressionSeam | Regression seam | 回归缝隙 |
| escapePrevention | Escape prevention | 逃逸预防 |
| impactChain | Impact Chain | 影响链 |
| blastRadiusMarker | BLAST RADIUS | 影响范围 |
| upstreamPreserved | Upstream preserved | 保持不变的上游 |
| downstreamAffected | Downstream affected | 受影响下游 |
| riskBranch | Risk branch | 风险分支 |
| verificationBranch | Verification branch | 验证分支 |

```text
<problemChain>
<symptomMarker>: <observed failure>
|-- <failureSite>: <file / command / UI / artifact>
|   |-- <directCaller>: <caller>
|   `-- <badValueState>: <first observed bad state>
|-- <upstreamOrigin>: <earliest proven creator>
|   |-- <codeSource>: <file / function / config>
|   |-- <promptSource>: <prompt / instruction / provider contract, or N/A>
|   `-- <trigger>: <input / event / race / migration>
`-- <rejectedSymptomFix>: <why guard-at-failure is insufficient>

<solutionChain>
<fixMarker>: <minimal repair>
|-- <firstBadStateRepair>: <change>
|-- <contractRestored>: <invariant>
|-- <regressionSeam>: <test / harness / replay>
`-- <escapePrevention>: <guard / assertion / operator check>

<impactChain>
<blastRadiusMarker>: <affected behavior>
|-- <upstreamPreserved>: <contracts that must stay unchanged>
|-- <downstreamAffected>: <callers / artifacts / docs / release>
|-- <riskBranch>: <possible regression>
`-- <verificationBranch>: <commands / evidence>
```

`Upstream origin` must reach the earliest evidence-backed creator. If the source may be a prompt, instruction, or provider contract, record the exact location. `Impact Chain` must cover downstream callers, artifacts, operators, or user-visible behavior; a file list is not enough. Missing L2, L4, or L5 becomes `unknown -> Evidence Request` and routes to diagnose-only or reroute.

## Output Shape

- `task.md#Root Cause Contract` is the human truth.
- `task.md` task blocks are the repair handoff.
- Git commit records Investigate completion.
- No process file beyond `task.md`.

## Reroute

If the issue is missing product scope, go to `cc-plan`. If it is roadmap priority, go to `cc-roadmap`. If evidence is unavailable, return an Evidence Request.
