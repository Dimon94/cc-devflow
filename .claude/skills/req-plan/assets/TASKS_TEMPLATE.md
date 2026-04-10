# TASKS

## Task Sheet Meta

- Requirement version:
- Design version:
- Req-Plan skill version:
- Source roadmap item:
- Source roadmap version:

## Phase 1: Foundation

- [ ] T001 [TEST] Write the first failing test (dependsOn:none) `path/to/test`
  Goal: 证明当前行为还没实现，必须先看到失败。
  Files: `path/to/test`
  Read first: `DESIGN.md`, `context-package.md`
  Verification: `npm test -- path/to/test`
  Evidence: failing output

- [ ] T002 [IMPL] Make the first test pass (dependsOn:T001) `path/to/file`
  Goal: 用最小实现让 T001 转绿。
  Files: `path/to/file`
  Read first: `DESIGN.md`, `path/to/test`
  Verification: `npm test -- path/to/test`
  Evidence: passing output + checkpoint

## Phase 2: Build

- [ ] T003 [P] [TEST] Add another independent failing test (dependsOn:T002) `path/to/other.test`
  Goal: 为独立行为补红灯。
  Files: `path/to/other.test`
  Read first: `DESIGN.md`, `context-package.md`
  Verification: `npm test -- path/to/other.test`
  Evidence: failing output

- [ ] T004 [P] [IMPL] Make the independent test pass (dependsOn:T003) `path/to/other-file`
  Goal: 用最小实现让 T003 转绿，并保留重构空间。
  Files: `path/to/other-file`
  Read first: `path/to/other.test`
  Verification: `npm test -- path/to/other.test`
  Evidence: passing output + review notes

## Phase 3: Verify

- [ ] T005 Run checks and collect evidence (dependsOn:T002,T004) `command or file`
  Goal: 为 `req-check` 准备新鲜证据。
  Files: `command or file`
  Read first: `TASKS.md`, `task-manifest.json`
  Verification: `npm test && npm run lint`
  Evidence: gate output

> `[P]` 只表示“依赖满足后有资格并行”，不表示可以无脑同时开发。
