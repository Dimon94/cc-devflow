# TASKS

## Plan Meta

- Requirement version: `REQ-001.v1`
- Design version: `design.v1`
- CC-Plan skill version: `3.10.1`
- Work branch: `REQ/001-copy-invite-link`
- Source roadmap item: `RM-001`
- Source roadmap version: `roadmap.v1`

## Execution Handoff

- Canonical design: `design.md`
- Execution mode: `single-path`
- Frozen decisions:
  - copy from the existing invite URL source
  - keep the patch inside the current dialog
  - leave richer feedback for a future requirement if needed
- PRD brief:
  - Problem statement: copying the visible invite URL still requires manual selection
  - Solution summary: one-click copy action with lightweight confirmation
  - User stories covered: `US-001`
  - Implementation decisions: reuse existing invite URL source and dialog props
  - Testing decisions: test through share dialog behavior
  - Out of scope: invite generation, role controls, analytics, clipboard fallback redesign
- AI Leverage Decision Lens: boil-lake; complete the bounded same-dialog copy lake instead of stopping at a happy-path button
- Read first:
  - `design.md`
  - `src/features/share/ShareDialog.tsx`
  - `src/features/share/ShareDialog.test.tsx`
- Commands to trust:
  - `npm test -- src/features/share/ShareDialog.test.tsx`
  - `npm run lint -- src/features/share/ShareDialog.tsx`
- Do not re-decide:
  - dialog structure
  - invite URL source
  - share-service contracts
- Parallel boundaries: none; this patch is intentionally serial

> 顶部 handoff 只保留执行者必须知道的现实，不重复讲背景故事。

## Execution Protocol

ClaudeCode / Codex 执行本计划时，必须把本文件当成任务模板合同，而不是普通 TODO 列表。

- Template source: `assets/TASKS_TEMPLATE.md`
- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`; if it cannot prove `query workflow-context` and `next-change-key`, stop blocked.
- Context first: run resolved CLI `query workflow-context --change <changeId> --change-key <changeKey> --cwd <repo-root> --data-only --no-trace --compact` before opening deep sections.
- Task selection: use `scripts/select-ready-tasks.sh --tasks devflow/changes/<change-key>/task.md`.
- Task block rule: read the full task block before coding; title-only execution is invalid.
- Completion rule: after verification and review gates pass, run `scripts/mark-task-complete.sh --tasks devflow/changes/<change-key>/task.md --task <task-id>`.
- Runtime file ban: do not generate process files beyond this `task.md`.

```bash
DEVFLOW=".claude/skills/cc-dev/scripts/resolve-cc-devflow.sh"
if [[ ! -f "$DEVFLOW" && -f ".codex/skills/cc-dev/scripts/resolve-cc-devflow.sh" ]]; then
  DEVFLOW=".codex/skills/cc-dev/scripts/resolve-cc-devflow.sh"
fi
bash "$DEVFLOW" require query workflow-context next-change-key
bash "$DEVFLOW" query workflow-context --change <changeId> --change-key <changeKey> --cwd <repo-root> --data-only --no-trace --compactSCRIPT_ROOT=".claude/skills/cc-do/scripts"
if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then
  SCRIPT_ROOT=".codex/skills/cc-do/scripts"
fi
bash "$SCRIPT_ROOT/select-ready-tasks.sh" --manifest docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/
bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/ --tasks docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/task.md --task <task-id>
```

## Phase 1: Foundation

- [x] T001 [TEST] Add a failing dialog test for the missing copy action (dependsOn:none) `src/features/share/ShareDialog.test.tsx`
  Goal: 证明当前 share dialog 还不能一键复制 invite link。
  TDD phase: red
  Files: `src/features/share/ShareDialog.test.tsx`
  Read first: `design.md`, `src/features/share/ShareDialog.tsx`
  Verification: `npm test -- src/features/share/ShareDialog.test.tsx`
  Evidence: failing output that shows the missing button / action
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/ --tasks docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/task.md --task T001`; do not hand-edit status.
  Test seam: share dialog UI behavior
  Public verification path: Run the share dialog test and observe the copy action through the rendered dialog
  Allowed mocks: clipboard boundary
  Ready when: 没有上游依赖，且现有 dialog test 已可运行

- [x] T002 [IMPL] Add the copy button and copied-state confirmation (dependsOn:T001) `src/features/share/ShareDialog.tsx`
  Goal: 用最小实现让 T001 转绿，并保持当前 share contract 不变。
  TDD phase: green
  Files: `src/features/share/ShareDialog.tsx`
  Read first: `design.md`, `src/features/share/ShareDialog.test.tsx`
  Verification: `npm test -- src/features/share/ShareDialog.test.tsx`
  Evidence: passing output + review notes
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/ --tasks docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/task.md --task T002`; do not hand-edit status.
  Test seam: share dialog UI behavior
  Public verification path: Run the share dialog test and observe the copy action through the rendered dialog
  Allowed mocks: clipboard boundary
  Ready when: T001 已经见红，且当前 touched files 没有外部依赖阻塞

## Phase 2: Verify

- [x] T003 Run targeted checks and collect fresh evidence (dependsOn:T002) `share dialog quality gates`
  Goal: 为 `cc-check` 准备本次实现的真实验证证据。
  TDD phase: evidence
  Files: `src/features/share/ShareDialog.tsx`, `src/features/share/ShareDialog.test.tsx`
  Read first: `task.md`
  Verification:
  - `npm test -- src/features/share/ShareDialog.test.tsx`
  - `npm run lint -- src/features/share/ShareDialog.tsx`
  Evidence: passing test output + clean lint output
  Completion: after verification evidence and required review records exist, run `SCRIPT_ROOT=".claude/skills/cc-do/scripts"; if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then SCRIPT_ROOT=".codex/skills/cc-do/scripts"; fi; bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/ --tasks docs/examples/pdca-loop/changes/REQ-001-copy-invite-link/task.md --task T003`; do not hand-edit status.
  Test seam: share dialog UI behavior
  Public verification path: Run the share dialog test and observe the copy action through the rendered dialog
  Allowed mocks: clipboard boundary
  Ready when: T002 已完成，且 review gate 已可补齐

> `[P]` 只表示“依赖满足后有资格并行”，不表示可以无脑同时开发。

## Task Quality Bar

一个好的 task block 至少让执行者立刻知道：

- 现在为什么轮到它做
- 做完后现实会发生什么变化
- 用哪条命令证明它完成
- 要留下什么证据给 `cc-check`
