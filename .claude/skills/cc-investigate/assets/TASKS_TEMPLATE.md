# TASKS

## Investigation Meta

- Requirement version:
- Analysis version:
- Investigate skill version:
- Source bug / incident:

## Execution Handoff

- Canonical analysis: `ANALYSIS.md`
- Execution mode: `single-path` | `parallel-ready`
- Confirmed root cause:
- Frozen repair boundary:
- Read first:
- Commands to trust:
- Do not re-decide:
- Parallel boundaries:

## Phase 1: Reproduce Guard

- [ ] T001 [TEST] Capture the failing behavior as a stable reproduction (dependsOn:none) `path/to/test`
  Goal: 让 bug 先变成一个可复跑的失败事实。
  Files: `path/to/test`
  Read first: `ANALYSIS.md`, `TASKS.md`
  Verification: `npm test -- path/to/test`
  Evidence: failing output or reproducible log
  Ready when: reproduction path 已稳定

## Phase 2: Repair

- [ ] T002 [IMPL] Apply the minimal root-cause fix (dependsOn:T001) `path/to/file`
  Goal: 只修已确认根因，不扩成重写。
  Files: `path/to/file`
  Read first: `ANALYSIS.md`, `path/to/test`
  Verification: `npm test -- path/to/test`
  Evidence: passing output + checkpoint
  Ready when: T001 已证明问题存在

## Phase 3: Verify

- [ ] T003 Run checks and collect fresh evidence (dependsOn:T002) `command or file`
  Goal: 为 `cc-check` 准备新鲜证据。
  Files: `command or file`
  Read first: `TASKS.md`, `task-manifest.json`
  Verification: `npm test && npm run lint`
  Evidence: gate output
  Ready when: repair task 已收口
