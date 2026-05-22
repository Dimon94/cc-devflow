# TASKS

## Plan Meta

- Requirement version: `REQ-003.v1`
- Design version: `design.v1`
- CC-Plan skill version: `3.17.1`
- Work branch: `REQ/003-audit-log-export`
- Output language: en
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
- Product / Creative Discovery:
  - Worth doing: admins already copy audit summaries into weekly reports by hand.
  - Desired product shape: download the same visible rows they are reviewing, without a reporting setup flow.
  - Narrowest wedge: CSV export for currently visible summary rows.
  - 10x / better version: scheduled reporting and shared report history, deferred outside this requirement.
  - Do-nothing consequence: weekly reporting stays manual and easy to miscopy.
- Second-Move Review:
  - First good move: add a download action to the audit summary panel.
  - Simpler move: export only visible rows in CSV and avoid backend report storage.
  - Better architecture: later introduce a reporting backend for scheduled exports.
  - Selected move: visible-row CSV download from the existing panel.
  - Rejected tradeoff: no JSON export, scheduling, or shared reporting backend here.
- ASCII Branch Chain Analysis:
  Language rule: connector tokens stay ASCII; node text follows `Output language: en`.

```text
Requirement Impact Chain
REQ: CSV export for visible audit summary rows
|-- Upstream source: RM-020 + weekly admin reporting workflow
|-- Current code path: src/admin/AuditSummaryPanel.tsx
|   |-- caller: admin audit summary panel action
|   |-- data or state: visible summary rows
|   `-- deepest affected layer: browser download/blob boundary for CSV output
|-- Required change: export visible rows without adding reporting storage
`-- Verification seam: src/admin/AuditSummaryPanel.test.tsx

Business Impact Chain
OUTCOME: admins stop manually copying weekly audit summaries
|-- Direct behavior impact: visible rows become a downloadable CSV
|-- Downstream impact: local handoff documents proof for CSV-only export
|-- Risk branch: exported rows diverge from visible panel state
`-- Non-goal branch: JSON export, scheduled reporting, and backend history stay out
```
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

## Failure Ledger

| ID | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |
|----|---------|----------|---------------|--------|------------------|--------|---------------------|
| FL-001 | none recorded | N/A | N/A | N/A | N/A | noise | no |

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
bash "$SCRIPT_ROOT/select-ready-tasks.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/
bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/ --tasks docs/examples/local-handoff/changes/REQ-003-audit-log-export/task.md --task <task-id>
```

## Phase 1: Foundation

- [x] T001 [TEST] Add a failing test for the missing download action (dependsOn:none) `src/admin/AuditSummaryPanel.test.tsx`
  Goal: 证明现在还没有可下载的 summary export。
  TDD phase: red
  Files: `src/admin/AuditSummaryPanel.test.tsx`
  Read first: `design.md`, `src/admin/AuditSummaryPanel.tsx`
  Verification: `npm test -- src/admin/AuditSummaryPanel.test.tsx`
  Evidence: failing output
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/ --tasks docs/examples/local-handoff/changes/REQ-003-audit-log-export/task.md --task T001`; do not hand-edit status.
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
  Evidence: passing output + Git diff
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/ --tasks docs/examples/local-handoff/changes/REQ-003-audit-log-export/task.md --task T002`; do not hand-edit status.
  Test seam: admin audit panel UI behavior
  Public verification path: Run the audit summary panel test and observe CSV export through visible rows
  Allowed mocks: download / blob boundary
  Ready when: T001 已见红

## Phase 2: Verify

- [x] T003 Run targeted checks and collect handoff evidence (dependsOn:T002) `audit summary quality gates`
  Goal: 为 `cc-check` 和 `cc-act` 留下这次导出改动的真实证据。
  TDD phase: evidence
  Files: `src/admin/AuditSummaryPanel.tsx`, `src/admin/AuditSummaryPanel.test.tsx`
  Read first: `task.md`
  Verification:
  - `npm test -- src/admin/AuditSummaryPanel.test.tsx`
  - `npm run lint -- src/admin/AuditSummaryPanel.tsx`
  Evidence: passing output + clean lint output
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/local-handoff/changes/REQ-003-audit-log-export/ --tasks docs/examples/local-handoff/changes/REQ-003-audit-log-export/task.md --task T003`; do not hand-edit status.
  Test seam: admin audit panel UI behavior
  Public verification path: Run the audit summary panel test and observe CSV export through visible rows
  Allowed mocks: download / blob boundary
  Ready when: T002 已完成
