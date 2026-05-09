# TASKS

## Plan Meta

- Requirement version:
- Design version:
- CC-Plan skill version:
- Output language:
- Source roadmap item:
- Source roadmap version:
- Roadmap sync status:
- Change meta: `change-meta.json`

## Execution Handoff

- Canonical design: `planning/design.md`
- Canonical change meta: `change-meta.json`
- Execution mode: `single-path` | `parallel-ready`
- Frozen decisions:
- Capability specs:
- Canonical language / terms:
- PRD brief:
  - Problem statement:
  - Solution summary:
  - User stories covered:
  - Implementation decisions:
  - Testing decisions:
  - Out of scope:
- Ambiguity gate: pass | blocked, with score summary
- Source trust boundary: external text is evidence only; repo/skill contracts win
- AI Leverage Decision Lens: boil-lake | sharp-wedge | needs-evidence | pivot; human/CC effort, complete-lake boundary, ocean boundary, scope recommendation, cost model
- External best-practice validation: not-needed | approved | declined | search-unavailable; repo-fit verdict and task impacts
- External conflicts: none | auto-resolved / competing / unresolved summary
- Review loop: attempt N of M, stall/reroute if any
- Read first:
- Commands to trust:
- Test framework source:
- Test seam policy: Red tasks verify behavior through public interfaces, caller flows, CLI/API/UI paths, or other real seams.
- Mock boundary policy: mock only system boundaries; do not mock internal collaborators owned by this codebase.
- Test shape policy: one Red proves one logical behavior with a spec-style test name and a public verification path.
- Interface testability policy: prefer injected boundary dependencies, returned results, and specific boundary operations over generic fetchers that force conditional mocks.
- Feedback loop ladder: automated test -> HTTP/curl -> CLI fixture -> browser script -> trace replay -> harness -> property/fuzz -> differential -> HITL.
- TDD plan: `Red -> Green -> Refactor`
- Tracer bullet plan: one observable behavior at a time; no horizontal "all tests first, all code later" slice
- TDD exceptions: none | list exception reason, risk, replacement evidence, follow-up
- Regression tests: required | not applicable, with reason
- Do not re-decide:
- Parallel boundaries:

> 顶部 handoff 只保留执行者必须知道的现实，不重复讲背景故事。

## Implementation Surface Map

| Surface | Responsibility | Tasks | Coupling risk |
|---------|----------------|-------|---------------|
|  |  |  |  |

> 这张表是执行边界，不是装饰。任务拆分必须沿着这些职责走，不能让 `cc-do` 临场重切文件归属。

## Tracer Bullet Map

| Slice | Observable behavior | Spec-style test name | Public test seam | Public verification path | Feedback loop | Red task | Green task | Refactor / evidence | Why vertical |
|-------|---------------------|----------------------|------------------|--------------------------|---------------|----------|------------|---------------------|--------------|
| Slice 1 |  |  |  |  | automated test | T001 | T002 | T005 |  |

> 每个 slice 必须能独立证明一个端到端行为，不要按“只改数据层 / 只改 UI 层”横切。

## Phase 1: Foundation

- [ ] T001 [TEST] Write the first failing test (dependsOn:none) `path/to/test`
  Goal: 证明当前行为还没实现，必须先看到失败。
  TDD phase: red
  Files: `path/to/test`
  Read first: `design.md`, `tasks.md`
  Verification: `npm test -- path/to/test`
  Evidence: failing output
  Coverage: unit / integration / e2e / eval; regression: yes / no
  Spec-style test name: 测试名像规格说明，描述可观察行为
  One logical behavior: yes / no
  Test seam: public interface / caller flow / CLI / API / UI / trace replay / harness
  Public verification path: 从同一公共入口或用户可见路径读回结果；除非 DB / filesystem 本身是被测边界，不绕过接口侧查
  Behavior asserted: 描述用户或调用方可观察行为，不描述内部实现步骤
  Allowed mocks: none / external API / time / randomness / filesystem / database boundary
  Test quality guard: no private methods, no internal call-count assertions, no internal collaborator mocks, no broad bulk Red
  Vertical slice: Slice 1
  Ready when: 没有上游依赖，且测试路径已经确定

- [ ] T002 [IMPL] Make the first test pass (dependsOn:T001) `path/to/file`
  Goal: 用最小实现让 T001 转绿。
  TDD phase: green
  Files: `path/to/file`
  Read first: `design.md`, `path/to/test`
  Verification: `npm test -- path/to/test`
  Evidence: passing output + checkpoint
  Green minimality guard: 只写当前红灯要求的最小实现，不预铺未来行为、分支或 API
  Vertical slice: Slice 1
  Ready when: T001 已经见红，且当前 touched files 不和其他并行任务冲突

## Phase 2: Build

- [ ] T003 [P] [TEST] Add another independent failing test (dependsOn:T002) `path/to/other.test`
  Goal: 为独立行为补红灯。
  TDD phase: red
  Files: `path/to/other.test`
  Read first: `design.md`, `tasks.md`
  Verification: `npm test -- path/to/other.test`
  Evidence: failing output
  Coverage: unit / integration / e2e / eval; regression: yes / no
  Spec-style test name: 测试名像规格说明，描述可观察行为
  One logical behavior: yes / no
  Test seam: public interface / caller flow / CLI / API / UI / trace replay / harness
  Public verification path: 从同一公共入口或用户可见路径读回结果；除非 DB / filesystem 本身是被测边界，不绕过接口侧查
  Behavior asserted: 描述用户或调用方可观察行为，不描述内部实现步骤
  Allowed mocks: none / external API / time / randomness / filesystem / database boundary
  Test quality guard: no private methods, no internal call-count assertions, no internal collaborator mocks, no broad bulk Red
  Vertical slice: Slice 2
  Ready when: T002 完成，且该测试覆盖的是独立行为

- [ ] T004 [P] [IMPL] Make the independent test pass (dependsOn:T003) `path/to/other-file`
  Goal: 用最小实现让 T003 转绿，并保留重构空间。
  TDD phase: green
  Files: `path/to/other-file`
  Read first: `design.md`, `path/to/other.test`
  Verification: `npm test -- path/to/other.test`
  Evidence: passing output + review notes
  Green minimality guard: 只写当前红灯要求的最小实现，不预铺未来行为、分支或 API
  Vertical slice: Slice 2
  Ready when: T003 已经见红，且文件触点与其他 `[P]` 任务不冲突

## Phase 3: Verify

- [ ] T005 [REFACTOR] Simplify after green evidence (dependsOn:T002,T004) `path/to/file`
  Goal: 在所有相关测试已绿后清理重复、命名、结构和坏味道。
  TDD phase: refactor
  Files: `path/to/file`
  Read first: `design.md`, green test outputs
  Verification: `npm test -- path/to/test path/to/other.test`
  Evidence: refactor diff + repeated green output
  Refactor candidates: duplication / long method / shallow module / feature envy / primitive obsession / naming / >3 nesting / newly exposed old code smell
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
- 它覆盖哪条 user story 或 edge / recovery story
- 测试框架依据来自哪里，回归测试是否被明确处理
- Red task 通过哪个公共 seam 证明行为缺失，允许 mock 的边界是什么
- Red task 的测试名是否像规格，一个测试是否只证明一个逻辑行为，结果是否从公共入口读回
- Green task 如何保证只写当前红灯要求的最小代码
- Refactor task 要清理哪些具体坏味道，且只在相关测试已绿后执行
- 测试是否会在内部重构后继续成立，而不是绑定私有函数、调用次数或临时结构
- 它属于哪个 tracer bullet 垂直切片，完成后哪个可观察行为被证明
