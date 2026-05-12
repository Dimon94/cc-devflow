# TASKS

## Plan Meta

- Requirement version: `REQ-002.v2`
- Design version: `design.v2`
- CC-Plan skill version: `3.9.0`
- Work branch: `REQ/002-bulk-invite-import`
- Source roadmap item: `RM-010`
- Source roadmap version: `roadmap.v2`

## Execution Handoff

- Canonical design: `design.md`
- Execution mode: `single-path`
- Frozen decisions:
  - bulk invite results must classify each row
  - audit behavior must match visible results
- PRD brief:
  - Problem statement: admins need predictable CSV invite outcomes for duplicates, invalid rows, and seat limits
  - Solution summary: freeze deterministic row outcomes before executing the bulk invite flow
  - User stories covered: `US-001`, `US-002`, `US-003`, `US-EDGE-001`, `US-EDGE-002`
  - Implementation decisions: reuse invite engine, billing checks, and audit contract after the row-outcome matrix is approved
  - Testing decisions: test bulk-import rules, admin upload flow, and audit mapping
  - Out of scope: SCIM provisioning, background jobs, rollback wizard
- AI Leverage Decision Lens: sharp-wedge; AI can implement this bounded import path fast, but cc-check may still block final proof if row semantics drift
- Read first:
  - `design.md`
  - `src/admin/BulkInvitePanel.tsx`
  - `src/invite/bulk-import.ts`
  - `src/audit/invite-log.ts`
- Commands to trust:
  - `npm test -- src/invite/bulk-import.test.ts`
  - `npm test -- src/admin/BulkInvitePanel.test.tsx`
- Do not re-decide:
  - duplicate handling semantics
  - seat-limit fallback behavior
  - audit row-result contract
- Parallel boundaries: no parallel execution until row-outcome semantics are frozen

## Execution Protocol

ClaudeCode / Codex 执行本计划时，必须把本文件当成任务模板合同，而不是普通 TODO 列表。

- Template source: `assets/TASKS_TEMPLATE.md`
- Context index first: run `cc-devflow query workflow-context --change <changeId> --change-key <changeKey> --cwd <repo-root> --data-only --no-trace --compact` before opening deep sections; use `packetOnly` plus `mustNotForget` first, verify `sourceHashes`, open `defaultOpen` refs only when needed, and reserve `deepOpen` for matching `openWhen.conditions`.
- Task selection: read `planning/task-manifest.json.currentTaskId`; if empty, run the ready-task selector before choosing work.
- Task block rule: read the full task block before coding; title-only execution is invalid.
- Completion rule: after verification and review gates pass, run the completion script; do not manually edit checkbox, status, or `currentTaskId`.
- Completion failure: if the script fails, fix the missing review / dependency evidence and rerun it. Do not bypass it by editing JSON or Markdown.

```bash
cc-devflow query workflow-context --change <changeId> --change-key <changeKey> --cwd <repo-root> --data-only --no-trace --compact
SCRIPT_ROOT=".claude/skills/cc-do/scripts"
if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then
  SCRIPT_ROOT=".codex/skills/cc-do/scripts"
fi
bash "$SCRIPT_ROOT/select-ready-tasks.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/task-manifest.json
bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/task-manifest.json --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/tasks.md --task <task-id>
```

## Phase 1: Rule Matrix

- [x] T001 [TEST] Add failing tests for duplicate and over-limit row outcomes (dependsOn:none) `src/invite/bulk-import.test.ts`
  Goal: 先把最危险的 bulk invite 行为变成红灯。
  TDD phase: red
  Files: `src/invite/bulk-import.test.ts`
  Read first: `design.md`, `src/invite/bulk-import.ts`
  Verification: `npm test -- src/invite/bulk-import.test.ts`
  Evidence: failing output
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/task-manifest.json --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/tasks.md --task T001`; do not hand-edit status.
  Test seam: bulk invite rules and admin upload UI behavior
  Public verification path: Run the bulk invite rule and admin panel tests through their public flows
  Allowed mocks: file upload boundary / billing / seat limit boundary
  Ready when: 当前规则文件已经可定位

- [x] T002 [IMPL] Implement the initial bulk invite row classification (dependsOn:T001) `src/invite/bulk-import.ts`
  Goal: 给 duplicate / over-limit 行为一个最小实现。
  TDD phase: green
  Files: `src/invite/bulk-import.ts`
  Read first: `design.md`, `src/invite/bulk-import.test.ts`
  Verification: `npm test -- src/invite/bulk-import.test.ts`
  Evidence: passing output + Git diff
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/task-manifest.json --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/tasks.md --task T002`; do not hand-edit status.
  Test seam: bulk invite rules and admin upload UI behavior
  Public verification path: Run the bulk invite rule and admin panel tests through their public flows
  Allowed mocks: file upload boundary / billing / seat limit boundary
  Ready when: T001 已见红

## Phase 2: Surface Integration

- [x] T003 [TEST] Add failing admin panel tests for mixed CSV results (dependsOn:T002) `src/admin/BulkInvitePanel.test.tsx`
  Goal: 在 UI 层看到 mixed row outcomes 的真实表现。
  TDD phase: red
  Files: `src/admin/BulkInvitePanel.test.tsx`
  Read first: `design.md`, `src/admin/BulkInvitePanel.tsx`
  Verification: `npm test -- src/admin/BulkInvitePanel.test.tsx`
  Evidence: failing output
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/task-manifest.json --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/tasks.md --task T003`; do not hand-edit status.
  Test seam: bulk invite rules and admin upload UI behavior
  Public verification path: Run the bulk invite rule and admin panel tests through their public flows
  Allowed mocks: file upload boundary / billing / seat limit boundary
  Ready when: T002 已完成

- [x] T004 [IMPL] Render bulk invite results in the admin panel (dependsOn:T003) `src/admin/BulkInvitePanel.tsx`
  Goal: 把 row outcomes 接进管理界面。
  TDD phase: green
  Files: `src/admin/BulkInvitePanel.tsx`
  Read first: `design.md`, `src/admin/BulkInvitePanel.test.tsx`
  Verification: `npm test -- src/admin/BulkInvitePanel.test.tsx`
  Evidence: passing output + review notes
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/task-manifest.json --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/tasks.md --task T004`; do not hand-edit status.
  Test seam: bulk invite rules and admin upload UI behavior
  Public verification path: Run the bulk invite rule and admin panel tests through their public flows
  Allowed mocks: file upload boundary / billing / seat limit boundary
  Ready when: T003 已见红

## Phase 3: Verification

- [x] T005 Run mixed-surface checks and gather review evidence (dependsOn:T004) `bulk invite quality gates`
  Goal: 为 `cc-check` 准备 bulk invite 的新鲜证据。
  TDD phase: evidence
  Files: `src/admin/BulkInvitePanel.tsx`, `src/invite/bulk-import.ts`
  Read first: `tasks.md`, `task-manifest.json`
  Verification:
  - `npm test -- src/invite/bulk-import.test.ts`
  - `npm test -- src/admin/BulkInvitePanel.test.tsx`
  Evidence: passing output + review notes
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/task-manifest.json --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/planning/tasks.md --task T005`; do not hand-edit status.
  Test seam: bulk invite rules and admin upload UI behavior
  Public verification path: Run the bulk invite rule and admin panel tests through their public flows
  Allowed mocks: file upload boundary / billing / seat limit boundary
  Ready when: T004 已完成
