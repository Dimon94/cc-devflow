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

Repair Boundary:
-

Verification:
-

Prevention:
-

Risk / Escalate If:
-

## Execution Protocol

Codex / ClaudeCode must treat this `task.md` as the only repair contract.

- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`; if it cannot prove `query workflow-context` and `next-change-key`, stop blocked.
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
