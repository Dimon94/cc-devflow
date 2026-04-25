# TASKS

## Plan Meta

- Requirement version: `REQ-001.v1`
- Design version: `design.v1`
- CC-Plan skill version: `3.5.3`
- Source roadmap item: `RM-001`
- Source roadmap version: `roadmap.v1`

## Execution Handoff

- Canonical design: `design.md`
- Execution mode: `single-path`
- Frozen decisions:
  - copy from the existing invite URL source
  - keep the patch inside the current dialog
  - leave richer feedback for a future requirement if needed
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

## Phase 1: Foundation

- [x] T001 [TEST] Add a failing dialog test for the missing copy action (dependsOn:none) `src/features/share/ShareDialog.test.tsx`
  Goal: 证明当前 share dialog 还不能一键复制 invite link。
  Files: `src/features/share/ShareDialog.test.tsx`
  Read first: `design.md`, `src/features/share/ShareDialog.tsx`
  Verification: `npm test -- src/features/share/ShareDialog.test.tsx`
  Evidence: failing output that shows the missing button / action
  Ready when: 没有上游依赖，且现有 dialog test 已可运行

- [x] T002 [IMPL] Add the copy button and copied-state confirmation (dependsOn:T001) `src/features/share/ShareDialog.tsx`
  Goal: 用最小实现让 T001 转绿，并保持当前 share contract 不变。
  Files: `src/features/share/ShareDialog.tsx`
  Read first: `design.md`, `src/features/share/ShareDialog.test.tsx`
  Verification: `npm test -- src/features/share/ShareDialog.test.tsx`
  Evidence: passing output + checkpoint + review notes
  Ready when: T001 已经见红，且当前 touched files 没有外部依赖阻塞

## Phase 2: Verify

- [x] T003 Run targeted checks and collect fresh evidence (dependsOn:T002) `share dialog quality gates`
  Goal: 为 `cc-check` 准备本次实现的真实验证证据。
  Files: `src/features/share/ShareDialog.tsx`, `src/features/share/ShareDialog.test.tsx`
  Read first: `tasks.md`, `task-manifest.json`
  Verification:
  - `npm test -- src/features/share/ShareDialog.test.tsx`
  - `npm run lint -- src/features/share/ShareDialog.tsx`
  Evidence: passing test output + clean lint output
  Ready when: T002 已完成，且 review gate 已可补齐

> `[P]` 只表示“依赖满足后有资格并行”，不表示可以无脑同时开发。

## Task Quality Bar

一个好的 task block 至少让执行者立刻知道：

- 现在为什么轮到它做
- 做完后现实会发生什么变化
- 用哪条命令证明它完成
- 要留下什么证据给 `cc-check`
