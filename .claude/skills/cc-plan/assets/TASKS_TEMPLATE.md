# TASKS

## Plan Meta

- Requirement version:
- Design version:
- CC-Plan skill version:
- Source roadmap item:
- Source roadmap version:
- Change meta: `change-meta.json`

## Execution Handoff

- Canonical design: `planning/design.md`
- Canonical change meta: `change-meta.json`
- Execution mode: `single-path` | `parallel-ready`
- Frozen decisions:
- Capability specs:
- Read first:
- Commands to trust:
- TDD plan: `Red -> Green -> Refactor`
- TDD exceptions: none | list exception reason, risk, replacement evidence, follow-up
- Do not re-decide:
- Parallel boundaries:

> 顶部 handoff 只保留执行者必须知道的现实，不重复讲背景故事。

## Phase 1: Foundation

- [ ] T001 [TEST] Write the first failing test (dependsOn:none) `path/to/test`
  Goal: 证明当前行为还没实现，必须先看到失败。
  TDD phase: red
  Files: `path/to/test`
  Read first: `design.md`, `tasks.md`
  Verification: `npm test -- path/to/test`
  Evidence: failing output
  Ready when: 没有上游依赖，且测试路径已经确定

- [ ] T002 [IMPL] Make the first test pass (dependsOn:T001) `path/to/file`
  Goal: 用最小实现让 T001 转绿。
  TDD phase: green
  Files: `path/to/file`
  Read first: `design.md`, `path/to/test`
  Verification: `npm test -- path/to/test`
  Evidence: passing output + checkpoint
  Ready when: T001 已经见红，且当前 touched files 不和其他并行任务冲突

## Phase 2: Build

- [ ] T003 [P] [TEST] Add another independent failing test (dependsOn:T002) `path/to/other.test`
  Goal: 为独立行为补红灯。
  TDD phase: red
  Files: `path/to/other.test`
  Read first: `design.md`, `tasks.md`
  Verification: `npm test -- path/to/other.test`
  Evidence: failing output
  Ready when: T002 完成，且该测试覆盖的是独立行为

- [ ] T004 [P] [IMPL] Make the independent test pass (dependsOn:T003) `path/to/other-file`
  Goal: 用最小实现让 T003 转绿，并保留重构空间。
  TDD phase: green
  Files: `path/to/other-file`
  Read first: `design.md`, `path/to/other.test`
  Verification: `npm test -- path/to/other.test`
  Evidence: passing output + review notes
  Ready when: T003 已经见红，且文件触点与其他 `[P]` 任务不冲突

## Phase 3: Verify

- [ ] T005 [REFACTOR] Simplify after green evidence (dependsOn:T002,T004) `path/to/file`
  Goal: 在所有相关测试已绿后清理重复、命名、结构和坏味道。
  TDD phase: refactor
  Files: `path/to/file`
  Read first: `design.md`, green test outputs
  Verification: `npm test -- path/to/test path/to/other.test`
  Evidence: refactor diff + repeated green output
  Ready when: 对应 Red/Green 任务都已完成，且清理不会扩大 scope

- [ ] T006 Run checks and collect evidence (dependsOn:T005) `command or file`
  Goal: 为 `cc-check` 准备新鲜证据。
  TDD phase: evidence
  Files: `command or file`
  Read first: `tasks.md`, `task-manifest.json`
  Verification: `npm test && npm run lint`
  Evidence: gate output
  Ready when: 当前 requirement 的实现任务都已收口

> `[P]` 只表示“依赖满足后有资格并行”，不表示可以无脑同时开发。

## Task Quality Bar

一个好的 task block 至少让执行者立刻知道：

- 现在为什么轮到它做
- 做完后现实会发生什么变化
- 用哪条命令证明它完成
- 要留下什么证据给 `cc-check`
- 它处于 Red、Green、Refactor，还是明确的 TDD exception
