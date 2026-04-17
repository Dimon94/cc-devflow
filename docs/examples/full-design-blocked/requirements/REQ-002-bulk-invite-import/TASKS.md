# TASKS

## Plan Meta

- Requirement version: `REQ-002.v2`
- Design version: `design.v2`
- CC-Plan skill version: `3.3.0`
- Source roadmap item: `RM-010`
- Source roadmap version: `roadmap.v2`

## Execution Handoff

- Canonical design: `DESIGN.md`
- Execution mode: `single-path`
- Frozen decisions:
  - bulk invite results must classify each row
  - audit behavior must match visible results
- Read first:
  - `DESIGN.md`
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

## Phase 1: Rule Matrix

- [x] T001 [TEST] Add failing tests for duplicate and over-limit row outcomes (dependsOn:none) `src/invite/bulk-import.test.ts`
  Goal: 先把最危险的 bulk invite 行为变成红灯。
  Files: `src/invite/bulk-import.test.ts`
  Read first: `DESIGN.md`, `src/invite/bulk-import.ts`
  Verification: `npm test -- src/invite/bulk-import.test.ts`
  Evidence: failing output
  Ready when: 当前规则文件已经可定位

- [x] T002 [IMPL] Implement the initial bulk invite row classification (dependsOn:T001) `src/invite/bulk-import.ts`
  Goal: 给 duplicate / over-limit 行为一个最小实现。
  Files: `src/invite/bulk-import.ts`
  Read first: `DESIGN.md`, `src/invite/bulk-import.test.ts`
  Verification: `npm test -- src/invite/bulk-import.test.ts`
  Evidence: passing output + checkpoint
  Ready when: T001 已见红

## Phase 2: Surface Integration

- [x] T003 [TEST] Add failing admin panel tests for mixed CSV results (dependsOn:T002) `src/admin/BulkInvitePanel.test.tsx`
  Goal: 在 UI 层看到 mixed row outcomes 的真实表现。
  Files: `src/admin/BulkInvitePanel.test.tsx`
  Read first: `DESIGN.md`, `src/admin/BulkInvitePanel.tsx`
  Verification: `npm test -- src/admin/BulkInvitePanel.test.tsx`
  Evidence: failing output
  Ready when: T002 已完成

- [x] T004 [IMPL] Render bulk invite results in the admin panel (dependsOn:T003) `src/admin/BulkInvitePanel.tsx`
  Goal: 把 row outcomes 接进管理界面。
  Files: `src/admin/BulkInvitePanel.tsx`
  Read first: `DESIGN.md`, `src/admin/BulkInvitePanel.test.tsx`
  Verification: `npm test -- src/admin/BulkInvitePanel.test.tsx`
  Evidence: passing output + review notes
  Ready when: T003 已见红

## Phase 3: Verification

- [x] T005 Run mixed-surface checks and gather review evidence (dependsOn:T004) `bulk invite quality gates`
  Goal: 为 `cc-check` 准备 bulk invite 的新鲜证据。
  Files: `src/admin/BulkInvitePanel.tsx`, `src/invite/bulk-import.ts`
  Read first: `TASKS.md`, `task-manifest.json`
  Verification:
  - `npm test -- src/invite/bulk-import.test.ts`
  - `npm test -- src/admin/BulkInvitePanel.test.tsx`
  Evidence: passing output + review notes
  Ready when: T004 已完成
