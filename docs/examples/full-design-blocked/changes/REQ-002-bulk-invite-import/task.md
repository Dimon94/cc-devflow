# TASKS

## Plan Meta

- Requirement version: `REQ-002.v2`
- Design version: `design.v2`
- CC-Plan skill version: `3.23.0`
- Work branch: `REQ/002-bulk-invite-import`
- Output language: en

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
- Product / Creative Discovery:
  - Worth doing: admins cannot trust bulk invite outcomes when duplicates, invalid rows, and seat limits mix together.
  - Desired product shape: every uploaded row gets a predictable visible result before downstream audit behavior matters.
  - Narrowest wedge: deterministic row classification for the known CSV invite path.
  - 10x / better version: full provisioning workflow with retry, rollback, and background processing, deferred outside this requirement.
  - Do-nothing consequence: admins keep reconciling failed imports manually and audit logs remain hard to trust.
- Second-Move Review:
  - First good move: implement mixed CSV result rendering directly in the admin panel.
  - Simpler move: freeze the row-outcome matrix first and reuse the existing invite engine.
  - Better architecture: later move bulk provisioning into a job-backed import workflow.
  - Selected move: row classification first, then admin surface and audit mapping.
  - Rejected tradeoff: no SCIM, background jobs, or rollback wizard in this requirement.
- ASCII Branch Chain Analysis:
  Language rule: connector tokens stay ASCII; node text follows `Output language: en`.

```text
Requirement Impact Chain
REQ: deterministic bulk invite row outcomes
|-- Current code path: src/invite/bulk-import.ts
|   |-- caller: src/admin/BulkInvitePanel.tsx
|   |-- data or state: CSV rows, duplicate state, seat-limit state, audit rows
|   `-- deepest affected layer: row-outcome matrix shared by invite and audit behavior
|-- Required change: classify each row before executing visible bulk results
`-- Verification seam: bulk-import and admin panel tests

Business Impact Chain
OUTCOME: admins can trust mixed CSV import results
|-- Direct behavior impact: duplicate, invalid, and over-limit rows get stable results
|-- Downstream impact: audit mapping and visible admin result rendering
|-- Risk branch: row semantics drift between UI and audit log
`-- Non-goal branch: SCIM, background jobs, and rollback wizard stay out
```
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
- Test Strategy Shape:
  - Suite layer: contract/rule tests first, admin component flow after semantics freeze
  - Expected command / runtime: `npm test -- src/invite/bulk-import.test.ts`; focused rule suite before UI suite
  - Proof value: catches duplicate, invalid-row, and seat-limit drift before audit/UI mapping
  - Fixture / mock boundary: real CSV row fixtures; mock only file upload, billing, and seat-limit boundaries
  - Low-value tests to avoid: broad snapshots, duplicate happy paths, UI-only tests that miss row semantics
  - Focused suite shape: rule matrix Red/Green before admin and audit integration tasks

## Failure Ledger

| ID | Source | Trigger | Escape class | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |
|----|--------|---------|--------------|---------|----------|---------------|--------|------------------|--------|---------------------|
| FL-001 | none | none | process-escape / test-escape / design-escape / model-pattern-escape | none recorded | N/A | N/A | N/A | N/A | noise | no |

## Execution Protocol

ClaudeCode / Codex 执行本计划时，必须把本文件当成任务模板合同，而不是普通 TODO 列表。

- Template source: `assets/TASKS_TEMPLATE.md`
- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`; if it cannot prove `next-change-key`, stop blocked.
- Context first: read this `task.md`, current Git status/history, and PR or handoff truth when present before opening deep sections.
- Task selection: use `scripts/select-ready-tasks.sh --tasks devflow/changes/<change-key>/task.md`.
- Task block rule: read the full task block before coding; title-only execution is invalid.
- Completion rule: after verification and review gates pass, run `scripts/mark-task-complete.sh --tasks devflow/changes/<change-key>/task.md --task <task-id>`.
- Runtime file ban: do not generate process files beyond this `task.md`.

```bash
DEVFLOW=".claude/skills/cc-dev/scripts/resolve-cc-devflow.sh"
if [[ ! -f "$DEVFLOW" && -f ".codex/skills/cc-dev/scripts/resolve-cc-devflow.sh" ]]; then
  DEVFLOW=".codex/skills/cc-dev/scripts/resolve-cc-devflow.sh"
fi
bash "$DEVFLOW" require next-change-key
SCRIPT_ROOT=".claude/skills/cc-do/scripts"
if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then
  SCRIPT_ROOT=".codex/skills/cc-do/scripts"
fi
bash "$SCRIPT_ROOT/select-ready-tasks.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/
bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/ --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/task.md --task <task-id>
```

## Phase 1: Rule Matrix

- [x] T001 [TEST] Add failing tests for duplicate and over-limit row outcomes (dependsOn:none) `src/invite/bulk-import.test.ts`
  Goal: 先把最危险的 bulk invite 行为变成红灯。
  TDD phase: red
  Suite layer / runtime: contract/rule suite; focused command before UI tests.
  Confidence value: catches duplicate and over-limit row classification drift.
  Fixture/mock boundary: real CSV rows; mock only billing / seat limit boundary.
  Low-value tests to avoid: UI-only snapshots that do not prove row semantics.
  Files: `src/invite/bulk-import.test.ts`
  Read first: `design.md`, `src/invite/bulk-import.ts`
  Verification: `npm test -- src/invite/bulk-import.test.ts`
  Evidence: failing output
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/ --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/task.md --task T001`; do not hand-edit status.
  Test seam: bulk invite rules and admin upload UI behavior
  Public verification path: Run the bulk invite rule and admin panel tests through their public flows
  Allowed mocks: file upload boundary / billing / seat limit boundary
  Ready when: 当前规则文件已经可定位

- [x] T002 [IMPL] Implement the initial bulk invite row classification (dependsOn:T001) `src/invite/bulk-import.ts`
  Goal: 给 duplicate / over-limit 行为一个最小实现。
  TDD phase: green
  Suite layer / runtime: same focused rule suite.
  Confidence value: preserves T001 without expanding into admin/audit behavior.
  Fixture/mock boundary: same as T001.
  Low-value tests to avoid: adding hidden happy paths without a new Red.
  Files: `src/invite/bulk-import.ts`
  Read first: `design.md`, `src/invite/bulk-import.test.ts`
  Verification: `npm test -- src/invite/bulk-import.test.ts`
  Evidence: passing output + Git diff
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/ --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/task.md --task T002`; do not hand-edit status.
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
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/ --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/task.md --task T003`; do not hand-edit status.
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
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/ --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/task.md --task T004`; do not hand-edit status.
  Test seam: bulk invite rules and admin upload UI behavior
  Public verification path: Run the bulk invite rule and admin panel tests through their public flows
  Allowed mocks: file upload boundary / billing / seat limit boundary
  Ready when: T003 已见红

## Phase 3: Verification

- [x] T005 Run mixed-surface checks and gather review evidence (dependsOn:T004) `bulk invite quality gates`
  Goal: 为 `cc-check` 准备 bulk invite 的新鲜证据。
  TDD phase: evidence
  Files: `src/admin/BulkInvitePanel.tsx`, `src/invite/bulk-import.ts`
  Read first: `task.md`
  Verification:
  - `npm test -- src/invite/bulk-import.test.ts`
  - `npm test -- src/admin/BulkInvitePanel.test.tsx`
  Evidence: passing output + review notes
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/ --tasks docs/examples/full-design-blocked/changes/REQ-002-bulk-invite-import/task.md --task T005`; do not hand-edit status.
  Test seam: bulk invite rules and admin upload UI behavior
  Public verification path: Run the bulk invite rule and admin panel tests through their public flows
  Allowed mocks: file upload boundary / billing / seat limit boundary
  Ready when: T004 已完成
