# TASKS

## Plan Meta

- Requirement version: `REQ-003.v1`
- Design version: `design.v1`
- CC-Plan skill version: `3.5.0`
- Source roadmap item: `RM-020`
- Source roadmap version: `roadmap.v3`

## Execution Handoff

- Canonical design: `design.md`
- Execution mode: `single-path`
- Frozen decisions:
  - export only the visible audit summary rows
  - CSV is the only format in this requirement
- Read first:
  - `design.md`
  - `src/admin/AuditSummaryPanel.tsx`
  - `src/admin/AuditSummaryPanel.test.tsx`
- Commands to trust:
  - `npm test -- src/admin/AuditSummaryPanel.test.tsx`
  - `npm run lint -- src/admin/AuditSummaryPanel.tsx`
- Do not re-decide:
  - summary row source
  - export format
  - panel placement
- Parallel boundaries: none

## Phase 1: Foundation

- [x] T001 [TEST] Add a failing test for the missing download action (dependsOn:none) `src/admin/AuditSummaryPanel.test.tsx`
  Goal: 证明现在还没有可下载的 summary export。
  Files: `src/admin/AuditSummaryPanel.test.tsx`
  Read first: `design.md`, `src/admin/AuditSummaryPanel.tsx`
  Verification: `npm test -- src/admin/AuditSummaryPanel.test.tsx`
  Evidence: failing output
  Ready when: 当前 audit summary test 已可运行

- [x] T002 [IMPL] Add the download summary action (dependsOn:T001) `src/admin/AuditSummaryPanel.tsx`
  Goal: 用最小实现让 summary export 真的可用。
  Files: `src/admin/AuditSummaryPanel.tsx`
  Read first: `design.md`, `src/admin/AuditSummaryPanel.test.tsx`
  Verification: `npm test -- src/admin/AuditSummaryPanel.test.tsx`
  Evidence: passing output + checkpoint
  Ready when: T001 已见红

## Phase 2: Verify

- [x] T003 Run targeted checks and collect handoff evidence (dependsOn:T002) `audit summary quality gates`
  Goal: 为 `cc-check` 和 `cc-act` 留下这次导出改动的真实证据。
  Files: `src/admin/AuditSummaryPanel.tsx`, `src/admin/AuditSummaryPanel.test.tsx`
  Read first: `tasks.md`, `task-manifest.json`
  Verification:
  - `npm test -- src/admin/AuditSummaryPanel.test.tsx`
  - `npm run lint -- src/admin/AuditSummaryPanel.tsx`
  Evidence: passing output + clean lint output
  Ready when: T002 已完成
