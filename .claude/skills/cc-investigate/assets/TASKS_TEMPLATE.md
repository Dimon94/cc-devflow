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

Repair Boundary:
-

Correct Test Seam:
- Public seam:
- Real trigger chain covered:
- Mock boundary:
- Private implementation assertions avoided:

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
  Ready when: T001 has the expected failing evidence.
