# task.md

## Plan Meta

- CC-Investigate skill version:
- Work branch:
- Output language:

## Root Cause Contract

Change:
Mode: investigation
Profile: tiny | standard | deep
Diagnosis:

Investigation Mode:
-

Symptom:
-

Reproduction:
-

Expected:
-

Actual:
-

Root Cause:
-

Evidence Chain:
-

Feedback Loop Contract:
- Type:
- Command / driver:
- Expected failing signal:
- Actual failing signal:
- Symptom match:
- Runtime / determinism / failure rate:
- Sharpening plan:

Root Cause Proof Ladder:
| Level | Evidence | Verdict |
|-------|----------|---------|
| L1 Symptom Site |  |  |
| L2 First Bad State |  |  |
| L3 Violated Contract |  |  |
| L4 Original Trigger |  |  |
| L5 Counterfactual Proof |  |  |
| L6 Escape Reason |  |  |

Hypothesis Table:
| Hypothesis | Support | Counter-evidence | Falsification method | Observation | Status |
|------------|---------|------------------|----------------------|-------------|--------|
| H1 |  |  |  |  | active |

Boundary Probe Matrix:
| Boundary | Input | Output | Config / env | State | Verdict |
|----------|-------|--------|--------------|-------|---------|
| N/A |  |  |  |  | not-applicable |

Backward Trace Chain:
- Immediate failure site:
- Direct caller:
- Caller chain:
- Bad value origin:
- Original trigger:
- Why symptom-site fix is rejected:

Reference Comparison:
- Similar working example:
- Broken path:
- Differences found:
- Accepted hypothesis:
- Ruled-out differences:

Diagnostic Instrumentation:
- Probe tag:
- Location:
- Question answered:
- Command:
- Expected signal:
- Actual signal:
- Cleanup requirement:

Investigation Socratic Dialogue:
- Current-state inspection complete: yes | no
- Solution questions asked before current-state evidence: no | blocked
- Repo-answered facts:
- User-answered phenomenon gaps:
- Dialogue Checkpoints:
  - CP-001:
    - Round range:
    - Next question:
    - Decisions made:
    - Rejected repair options and reasons:
    - Remaining open questions:
    - Evidence sources read:
    - Hidden assumptions / adversarial findings so far:
    - Release status:
- 3 hidden repair assumptions challenged:
  1.
  2.
  3.
- Overengineering / symptom-fix challenge:
- Adversarial review findings:
- Explicit release phrase:

Repair Boundary:
-

Correct Test Seam:
- Public seam:
- Real trigger chain covered:
- Mock boundary:
- Private implementation assertions avoided:

Regression Proof Contract:
- Failure ownership: branch regression | baseline failure | environment drift | external dependency | product/spec ambiguity | unknown
- Shortest trustworthy seam:
- Suite layer: unit | integration | contract | E2E | smoke | golden artifact | migration check | trace replay | manual/probe loop
- Command / runtime budget:
- Proof value:
- Fixture / mock boundary:
- Focused suite shape:
- Low-value tests to avoid:

ASCII Branch Chain Analysis:
Language rule: keep connector tokens ASCII; write node labels and evidence text in `Output language`.

Label table:
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

Verification:
-

Prevention:
-

Diagnose-Only / Reroute:
- Applies: yes | no
- Next action:
- Why no repair task:

Risk / Escalate If:
-

## Failure Ledger

Use this section only for real repair failures, reroutes, disproven hypotheses, stale validation, wrong-file touches, repeated tool failures, user-corrected misses, or eligible `cc-review` escape findings. Eligible review escapes are limited to process, test, design, and model-pattern escapes. Do not prefill speculative risks.

| ID | Source | Trigger | Escape class | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |
|----|--------|---------|--------------|---------|----------|---------------|--------|------------------|--------|---------------------|
| FL-001 |  |  | process-escape / test-escape / design-escape / model-pattern-escape |  |  |  |  |  | unreviewed / confirmed-lesson / noise / unresolved-risk | no |

## Execution Protocol

Codex / ClaudeCode must treat this `task.md` as the only repair contract.

- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`; if it cannot prove `next-change-key`, stop blocked.
- Do not generate process files beyond this `task.md`.
- Complete tasks with `scripts/mark-task-complete.sh --tasks devflow/changes/<change-key>/task.md --task <task-id>`.
- Stage commit rule: when PDCA or IDCA finishes in the current environment, commit the completed stage to Git.

## Phase 1: Repair

- [ ] T001 [TEST] Capture the confirmed failure (dependsOn:none) `path/to/test`
  Goal: 证明 Root Cause Contract 的失败链在当前代码中可复现。
  Root cause proof: reference the Root Cause Contract fields above.
  Do not re-decide: first bad state, original trigger, repair boundary.
  TDD phase: red
  Files: `path/to/test`
  Read first: `task.md`
  Verification: `npm test -- path/to/test`
  Evidence: failing output
  Completion: after failing evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/<change-key>/task.md --task T001`.
  Public verification path: public interface / caller flow / CLI / API / UI / trace replay / harness.
  Regression proof: use the Regression Proof Contract fields above; do not use decorative Red tests, private call counts, or broad snapshots as proof.
  Fixture / mock boundary: inherit the allowed and forbidden boundaries from Root Cause Contract.
  Ready when: reproduction path is available.

- [ ] T002 [IMPL] Repair the first bad state (dependsOn:T001) `path/to/file`
  Goal: 用最小代码修复已证明的根因。
  Root cause proof: do not repair symptom site unless Root Cause Contract proves it is the original trigger.
  Do not re-decide: repair boundary, test seam, forbidden files.
  TDD phase: green
  Files: `path/to/file`
  Read first: `task.md`, `path/to/test`
  Verification: `npm test -- path/to/test`
  Evidence: passing output + Git diff
  Completion: after green evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/<change-key>/task.md --task T002`.
  Public verification path: same as T001.
  Regression proof: keep the same proof value and focused suite shape; Green is invalid if it only satisfies a guard that bypasses the first bad state.
  Ready when: T001 has the expected failing evidence.
