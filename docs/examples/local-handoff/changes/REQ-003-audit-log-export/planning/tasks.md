# TASKS

## Plan Meta

- Requirement version: `REQ-003.v1`
- Design version: `design.v1`
- CC-Plan skill version: `3.8.2`
- Source roadmap item: `RM-020`
- Source roadmap version: `roadmap.v3`

## Execution Handoff

- Canonical design: `design.md`
- Execution mode: `single-path`
- Frozen decisions:
  - export only the visible audit summary rows
  - CSV is the only format in this requirement
- PRD brief:
  - Problem statement: admins manually copy audit summaries into weekly reports
  - Solution summary: CSV download action for currently visible audit summary rows
  - User stories covered: `US-001`
  - Implementation decisions: export visible rows only, CSV only
  - Testing decisions: test through admin panel action and visible row data
  - Out of scope: JSON export, scheduled reporting, shared reporting backend
- AI Leverage Decision Lens: boil-lake; complete visible-row CSV export while keeping reporting-platform work outside the lake
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

## Execution Protocol

ClaudeCode / Codex 执行本计划时，必须把本文件当成任务模板合同，而不是普通 TODO 列表。

- Template source: `assets/TASKS_TEMPLATE.md`
- Task selection: read `planning/task-manifest.json.currentTaskId`; if empty, run the ready-task selector before choosing work.
- Task block rule: read the full task block before coding; title-only execution is invalid.
- Completion rule: after verification and review gates pass, run the completion script; do not manually edit checkbox, status, or `currentTaskId`.
- Completion failure: if the script fails, fix the missing checkpoint / review / dependency evidence and rerun it. Do not bypass it by editing JSON or Markdown.

```bash
SCRIPT_ROOT=".claude/skills/cc-do/scripts"
if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then
  SCRIPT_ROOT=".codex/skills/cc-do/scripts"
fi
bash "$SCRIPT_ROOT/select-ready-tasks.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/planning/task-manifest.json
bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/planning/task-manifest.json --tasks docs/examples/local-handoff/changes/REQ-003-audit-log-export/planning/tasks.md --task <task-id>
```

## Phase 1: Foundation

- [x] T001 [TEST] Add a failing test for the missing download action (dependsOn:none) `src/admin/AuditSummaryPanel.test.tsx`
  Goal: 证明现在还没有可下载的 summary export。
  TDD phase: red
  Files: `src/admin/AuditSummaryPanel.test.tsx`
  Read first: `design.md`, `src/admin/AuditSummaryPanel.tsx`
  Verification: `npm test -- src/admin/AuditSummaryPanel.test.tsx`
  Evidence: failing output
  Completion: after verification evidence and required checkpoint/review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/planning/task-manifest.json --tasks docs/examples/local-handoff/changes/REQ-003-audit-log-export/planning/tasks.md --task T001`; do not hand-edit status.
  Test seam: admin audit panel UI behavior
  Public verification path: Run the audit summary panel test and observe CSV export through visible rows
  Allowed mocks: download / blob boundary
  Ready when: 当前 audit summary test 已可运行

- [x] T002 [IMPL] Add the download summary action (dependsOn:T001) `src/admin/AuditSummaryPanel.tsx`
  Goal: 用最小实现让 summary export 真的可用。
  TDD phase: green
  Files: `src/admin/AuditSummaryPanel.tsx`
  Read first: `design.md`, `src/admin/AuditSummaryPanel.test.tsx`
  Verification: `npm test -- src/admin/AuditSummaryPanel.test.tsx`
  Evidence: passing output + checkpoint
  Completion: after verification evidence and required checkpoint/review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/planning/task-manifest.json --tasks docs/examples/local-handoff/changes/REQ-003-audit-log-export/planning/tasks.md --task T002`; do not hand-edit status.
  Test seam: admin audit panel UI behavior
  Public verification path: Run the audit summary panel test and observe CSV export through visible rows
  Allowed mocks: download / blob boundary
  Ready when: T001 已见红

## Phase 2: Verify

- [x] T003 Run targeted checks and collect handoff evidence (dependsOn:T002) `audit summary quality gates`
  Goal: 为 `cc-check` 和 `cc-act` 留下这次导出改动的真实证据。
  TDD phase: evidence
  Files: `src/admin/AuditSummaryPanel.tsx`, `src/admin/AuditSummaryPanel.test.tsx`
  Read first: `tasks.md`, `task-manifest.json`
  Verification:
  - `npm test -- src/admin/AuditSummaryPanel.test.tsx`
  - `npm run lint -- src/admin/AuditSummaryPanel.tsx`
  Evidence: passing output + clean lint output
  Completion: after verification evidence and required checkpoint/review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/planning/task-manifest.json --tasks docs/examples/local-handoff/changes/REQ-003-audit-log-export/planning/tasks.md --task T003`; do not hand-edit status.
  Test seam: admin audit panel UI behavior
  Public verification path: Run the audit summary panel test and observe CSV export through visible rows
  Allowed mocks: download / blob boundary
  Ready when: T002 已完成
