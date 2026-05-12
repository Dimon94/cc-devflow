# TASKS

## Investigation Meta

- Requirement version:
- Analysis version:
- Investigate skill version:
- Output language:
- Source bug / incident:
- Roadmap sync status:
- Change meta: `change-meta.json`

## Progressive Disclosure Index

- Default read: Investigation Meta, Execution Handoff, current task block.
- Runtime reset: run `cc-devflow query workflow-context --change <changeId> --change-key <changeKey> --cwd <repo-root> --data-only --no-trace --compact` before `cc-do`, `cc-check`, or `cc-act`; use `packetOnly` plus `mustNotForget` first, verify `sourceHashes`, open `defaultOpen` refs only when needed, and reserve `deepOpen` for matching `openWhen.conditions`.
- Open for root-cause doubt: `planning/analysis.md` Project Postmortem Recall, Feedback Loop, Evidence Chain, Boundary Probe Matrix.
- Open for scheduling: `planning/task-manifest.json`, dependencies, touched files.
- Open for audit/recovery: checkpoint files, report-card findings, Workflow Forensics.

## Execution Handoff

- Canonical analysis: `planning/analysis.md`
- Canonical change meta: `change-meta.json`
- Execution mode: `single-path` | `parallel-ready`
- Confirmed root cause:
- Root-cause hypothesis:
- Root Cause Proof Ladder:
- First bad state:
- Original trigger:
- Counterfactual proof:
- Feedback loop:
- Symptom match evidence:
- Frozen repair boundary:
- Boundary probes:
- Backward trace:
- Reference comparison:
- Project postmortem recall:
- Allowed files:
- Forbidden files:
- Blast radius:
- Capability specs:
- Read first:
- Commands to trust:
- Do not re-decide:
- Parallel boundaries:
- Correct test seam:
- Evidence request if blocked:
- Do not repair symptom site unless analysis proves it is the original trigger:

## Phase 1: Reproduce And Probe Guard

- [ ] T001 [TEST] Capture the failing behavior as a stable reproduction (dependsOn:none) `path/to/test`
  Goal: 让 bug 先变成一个快、准、可复跑且匹配用户症状的失败事实。
  Files: `path/to/test`
  Read first: `analysis.md`, `tasks.md`
  Project postmortem search: `rg -n "<symptom|test seam|module|model-risk>" devflow/postmortems` or record `no-project-postmortems-yet`
  Verification: `npm test -- path/to/test`
  Evidence: failing output or reproducible log + symptom match evidence
  Correct seam: test must exercise the real trigger chain through a public interface
  Root cause proof: must expose or preserve evidence for first bad state and original trigger
  Ready when: feedback loop 已稳定，analysis 已记录必要的 boundary / trace / comparison / root-cause-ladder evidence

## Phase 2: Repair

- [ ] T002 [IMPL] Apply the minimal root-cause fix (dependsOn:T001) `path/to/file`
  Goal: 只修已确认根因，不扩成重写。
  Files: `path/to/file`
  Read first: `analysis.md`, `path/to/test`
  Project postmortem search: `rg -n "<root cause|module|failure-class|model-risk>" devflow/postmortems` or record `no-project-postmortems-yet`
  Verification: `npm test -- path/to/test`
  Evidence: passing output + checkpoint
  Do not re-decide: root cause, first bad state, original trigger, allowed files, forbidden files
  Ready when: T001 已证明同一个用户症状存在，analysis 已证明根因源头和 counterfactual proof

## Phase 3: Verify

- [ ] T003 Run checks and collect fresh evidence (dependsOn:T002) `command or file`
  Goal: 为 `cc-check` 准备新鲜证据。
  Files: `command or file`
  Read first: `tasks.md`, `task-manifest.json`
  Project postmortem search: `rg -n "<verification|release|tooling|model-risk>" devflow/postmortems` or record `no-project-postmortems-yet`
  Verification: `npm test && npm run lint`
  Evidence: gate output
  Root cause proof: verification must prove the first bad state no longer forms, not only that the symptom disappeared
  Ready when: repair task 已收口
