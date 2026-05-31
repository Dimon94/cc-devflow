# CC-Investigate Playbook

## State Machine

`cc-investigate -> cc-do -> cc-check`

- Enter when root cause is unknown.
- Stay until `task.md#Root Cause Contract` is evidence-backed.
- Exit after the Investigate commit exists.

## Setup

1. Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require next-change-key config`.
2. Assign a FIX key with `next-change-key --prefix FIX --description "<short bug name>"`.
3. Run `../cc-dev/scripts/detect-worktree-state.sh` before any write.
4. Run `../cc-dev/scripts/prepare-change-worktree.sh --change-key <FIX-...>`.
5. Work only inside returned `WORKTREE_PATH`.
6. Confirm the branch is exact-case `FIX/...`.

Submodule entry, wrong linked worktree, detached state, branch case collision, or target mismatch is a setup blocker. Keep the main checkout on `main`.

## Rules

1. Reproduce before guessing.
2. Prove first bad state before naming root cause.
3. Write only `task.md`; Git records the stage.
4. No process file beyond `task.md`.
5. Reroute instead of mixing feature planning into bug investigation.
6. Classify the investigation mode before tracing evidence.
7. Record hypotheses with falsification methods and actual observations.
8. Missing first bad state, original trigger, or counterfactual proof stops repair tasks.

## Investigation Loop

1. Classify: choose the investigation mode in `references/investigation-contract.md`.
2. Reproduce: use a test, script, log path, browser path, artifact replay, or smallest honest harness.
3. Trace: find the first bad state, not just the symptom site.
4. Hypothesize: list candidate causes, support, counter-evidence, falsification method, expected observation, and actual observation.
5. Probe: use boundary, backward-trace, reference-compare, condition-wait, workflow-forensics, or performance evidence when the mode requires it.
6. Grill: after current-state inspection, ask one question at a time only for remaining phenomenon gaps or repair-boundary confirmation.
7. Prove: complete the Root Cause Proof Ladder and ASCII Branch Chain Analysis.
8. Freeze: write root cause, repair boundary, regression proof, allowed/forbidden files, and test seam into `task.md`.
9. Commit: commit the Investigate stage before handoff.

## 调查判断

根因是第一个被证明会制造坏状态的位置，不是症状第一次冒出来的代码行。好的调查会让后续修复变得无聊：`cc-do` 明确知道要阻止哪个状态，也知道哪个证明能抓住它。

只有满足这些条件，才冻结调查结果：

1. 复现路径，或最接近的诚实反馈环，匹配用户报告的症状。
2. 第一个坏状态位于症状点的上游。
3. 被违反的 contract 说明了这个状态为什么坏。
4. 原始触发条件说明了坏状态如何被制造。
5. 反事实证据说明：在选定 repair boundary 修，就能阻止症状。
6. 回归证明使用最短、可信、公开的接缝。

坏调查信号：

- 根因只是堆栈行或失败断言。
- 假设有支持证据，但没有反证 / 排除结果。
- repair boundary 只是“这里加 guard”，没有说明为什么拒绝症状点修补。
- 测试接缝只打私有实现细节。
- escape reason 只是“以后小心”。

出现这些信号时，写 `Evidence Request`、只做 diagnose，或重新路由；不要创建修复任务。

## Dialogue

Ask phenomenon questions early only when reproduction facts are missing. Technical-detail and solution-shape questions happen after code, logs, history, artifacts, and feedback-loop evidence have been inspected.

When repair-boundary confirmation is needed, use `../cc-dev/references/user-choice-output-protocol.md`: host-native structured choice first, fixed A/B/C text block only when no structured choice UI exists.

Before freezing repair tasks, record repo-answered facts, user-answered gaps, 3 hidden repair assumptions, rejected symptom-site fixes, adversarial review findings, and explicit user release when confirmation was needed. Before question rounds 11, 21, 31, and each next tenth round, persist a Dialogue Checkpoint in `task.md#Root Cause Contract`.

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

## Root Cause Proof Ladder

- L1 Symptom Site
- L2 First Bad State
- L3 Violated Contract
- L4 Original Trigger
- L5 Counterfactual Proof
- L6 Escape Reason

Missing L2, L4, or L5 means Evidence Request, diagnose-only, reroute, or stop. Escape reason cannot be a human reminder; convert it into regression test, artifact guard, capability invariant, operator check, or explicit follow-up.

## Handoff

Exit with:

- change key and branch
- `task.md` path
- reproduction and evidence commands
- Investigate commit hash
- next route: `cc-do`, `cc-plan`, `roadmap`, or `stop`

## Exit

`task.md` must tell `cc-do` what to fix, what not to touch, and what command proves the repair. Commit the Investigate stage before handing off.
