# task.md

## Plan Meta

- CC-Plan skill version: 3.28.0
- Template source: `assets/PARALLEL_TASKS_TEMPLATE.md`
- Work branch: `REQ/008-skill-content-architecture-contracts`
- Output language: zh-CN

## Contract Snapshot

Change:
Mode: parallel-plan
Approval: user confirmed the six-issue architecture plan in conversation; source tracker is #40.

Goal:
- Turn the skill content architecture report into six agent-ready contract slices.
- Add Chain Skills for authoring, task, workflow, quality, and execution-environment contracts.
- Add minimal workflow fixture tests that prove process behavior without a new framework.

Do Not Do:
- Do not create a new parser, DSL, CLI command, or full validator for `task.md`.
- Do not hand-edit generated `.codex` mirrors; generate them after source contract work is integrated.
- Do not create real child-thread orchestration inside tests.
- Do not merge all contract semantics into one large skill.

Approved Direction:
- Use one parent PRD issue (#40) and six implementation issues (#41-#46).
- Run #41 first, then #42/#43/#44 in parallel, then #45, then #46.
- Keep each Chain Skill narrow and reference-shaped.

Open Decisions:
- none

Verification:
- Focused Jest contract tests per environment.
- `npm run adapt:codex` after source skills are integrated.
- `npm run verify:publish` after distributed Chain Skills are integrated.
- Final `npm test` or focused equivalent plus `cc-check` review convergence before delivery.

Risk / Escalate If:
- A child wants to widen its contract into another contract's responsibility.
- A change requires hand-editing generated `.codex` mirrors.
- Publish validation treats new Chain Skills as retired process artifacts.
- Existing tests expose unrelated release drift.

Parallelization Rationale:
- Why parallel: the six issues map to contract surfaces with explicit dependencies and mostly disjoint touched files.
- Independent resources: #41 owns authoring contract; #42 owns task contract and distribution guard; #43 owns workflow state machine; #44 owns quality semantics; #45 owns parallel execution graph; #46 owns fixtures.
- Dependency boundary: #42/#43/#44 depend on #41; #45 depends on #42/#43; #46 depends on #42/#43/#44/#45.
- Cannot overlap: siblings must not edit another sibling's Chain Skill or fixture files except through explicit parent integration.
- Why not serial: after #41, three contract slices can advance independently and be integrated one at a time.

Doc-To-Contract:
- Source facts:
| Fact | Source | Contract artifact | Confidence |
|------|--------|-------------------|------------|
| #40 is the parent PRD for six skill content architecture contracts. | GitHub issue #40 | parent scope and user stories | high |
| #41-#46 are ready-for-agent child issues. | GitHub issues #41-#46 | environment list and dependencies | high |
| User confirmed `skill-authoring-gate` as a Chain Skill. | conversation | E001 scope | high |
| User confirmed `workflow-chain-contract` only owns stage state machine semantics. | conversation | E003 scope | high |
| User confirmed `quality-gate-contract` includes cc-simplify only at quality-gate level. | conversation | E004 scope | high |
| User confirmed `execution-environment-contract` excludes Codex thread tool wrappers. | conversation | E005 scope | high |
| User confirmed workflow fixture tests use existing Jest only. | conversation | E006 scope | high |
- Typed structure:
  - Domain types / schemas / brands: `User Entry Skill`, `Chain Skill`, `Task Contract`.
  - Invariants / impossible states: a Chain Skill can be distributed without being a human entry point; generated mirrors are not source truth.
  - State models / discriminated unions: environment status enum below; issue dependency graph below.
- Interface seams:
  - Public seam: source skill frontmatter/read relationships, package validation, and Jest contract fixtures.
  - Caller: cc-devflow maintainers and agent child threads.
  - Input / output: GitHub issues, source skill Markdown, config JSON, tests, generated skill mirror.
  - Permissions / boundary: children edit only assigned contract surface.
- Adapter topology:
  - Production adapter: existing skill compiler and distribution config.
  - Test adapter: Jest tests reading repository files and invoking existing scripts.
  - External infrastructure hidden: GitHub issue tracker is source input, not runtime dependency.
- Error contract:
  - Expected failures: missing Chain Skill, wrong public/user-entry classification, missing reader wiring, retired artifact false positive, weak fixture.
  - Typed error / result family: Jest failure or validate-publish failure.
  - Translation boundary: no new runtime error type.
- Call stacks:
```text
Production:
User Entry Skill
  -> reads Chain Skill
    -> follows contract while producing durable truth

Generated mirrors:
.claude/skills source
  -> npm run adapt:codex
    -> .codex/skills generated output

Tests:
Jest fixture
  -> source skill/config/task fixture
    -> assert process contract shape
```
- Dependency rules:
  - Allowed: Chain Skills may be read by workflow skills and other Chain Skills.
  - Forbidden: child environment edits outside its issue surface; manual `.codex` mirror edits; workflow routing inside Task Contract.
  - Mechanical check: focused tests, `npm run adapt:codex`, `npm run verify:publish`.
- Validation edges:
  - Raw input boundary: GitHub issue body and Markdown skill frontmatter.
  - Parser / constructor owner: existing `gray-matter` and test helpers where already used.
- Test surfaces:
  - Highest useful seam: source contracts and publish/test commands.
  - Lower-value seams to avoid: full-file snapshots, exact long prose checks, real child threads.
- Business logic excluded:
  - app runtime behavior, provider logic, GitHub PR landing redesign.

## Execution Environments

Durable orchestration state only. Do not write heartbeat polling logs, child
thread scratch notes, or large command output here.

Status enum:

| Status | Writer | Entry condition | Exit condition | Durable evidence required |
|--------|--------|-----------------|----------------|---------------------------|
| planned | cc-plan | environment is frozen in this task contract | parent chooses the environment for dispatch | environment block with route, tasks, dependencies, touches, and gate |
| pending-thread | cc-dev | `create_thread` returned a provisioning token such as `pendingWorktreeId` | `list_threads` finds and `read_thread` verifies the real thread id | provisioning token, requested title, project target, branch/worktree filters |
| dispatched | cc-dev | real child thread id is confirmed | child starts running or returns a terminal report | thread id, target, worktree or project-local target |
| running | heartbeat or cc-dev | `read_thread` proves the child has started and is not terminal | child final report is ready | thread id and concise status only |
| completed | child report, verified by cc-dev | no-commit route finished, or file-changing route reports a verified commit | no-commit route closes, or commit route enters integration | final report, verification evidence, dirty state, touched files, commit when required |
| integrated | cc-dev | child audit passed, commit was cherry-picked, and focused verification passed | phase gate unlocks the next environment or final `cc-check` starts | audit result, cherry-picked commit, focused verification command |
| skipped | cc-dev or user-approved | environment is no longer needed and the reason is durable | final `cc-check` confirms no required work is missing | skip reason and approval/evidence |
| blocked | child or cc-dev | child cannot continue, repeated blocker appears, or graph no longer matches repo truth | retry, reroute, or `cc-plan` repair | blocker evidence and route recommendation |

`pendingWorktreeId` is not a thread id. `dispatched` requires a real child
thread id. `completed` is not `integrated`. `integrated` requires audit
evidence, cherry-pick evidence, and focused verification evidence.

| Env | Route | Status | DependsOn | Parallel | Child | Commit | Gate |
|-----|-------|--------|-----------|----------|-------|--------|------|
| E001 | cc-do | planned | none | yes | pending | pending | `npm test -- skill-authoring` |
| E002 | cc-do | planned | E001 | yes | pending | pending | `npm test -- task-contract` + `npm run verify:publish` |
| E003 | cc-do | planned | E001 | yes | pending | pending | `npm test -- workflow-chain` |
| E004 | cc-do | planned | E001 | yes | pending | pending | `npm test -- quality-gate` |
| E005 | cc-do | planned | E002,E003 | yes | pending | pending | `npm test -- execution-environment` |
| E006 | cc-do | planned | E002,E003,E004,E005 | yes | pending | pending | `npm test -- workflow-fixture` |

### Environment Task Allocation

Every task ID listed here must have a full task block inside that environment
dispatch boundary below. Task IDs are globally unique across the whole file.
A branch label, workstream name, local task number, or prose-only TODO is
invalid.

| Env | Assigned tasks | TDD sequence | Independent proof | Cannot overlap with |
|-----|----------------|--------------|-------------------|---------------------|
| E001 | T001 | TDD exception: contract slice with focused contract proof | `npm test -- skill-authoring` | E002-E006 Chain Skill files |
| E002 | T002 | TDD exception: contract slice with publish proof | `npm test -- task-contract` and `npm run verify:publish` | E003-E006 Chain Skill and fixture files |
| E003 | T003 | TDD exception: contract slice with workflow proof | `npm test -- workflow-chain` | E002/E004/E005/E006 files |
| E004 | T004 | TDD exception: contract slice with quality proof | `npm test -- quality-gate` | E002/E003/E005/E006 files |
| E005 | T005 | TDD exception: contract slice with parallel proof | `npm test -- execution-environment` | E006 fixture file |
| E006 | T006 | TDD exception: fixture-only slice | `npm test -- workflow-fixture` | contract source files except minimal read wiring fixes |

## Env Contract Matrix

| Env | Tasks | User / edge story | Public seam | Do not re-decide | Verification evidence |
|-----|-------|-------------------|-------------|------------------|-----------------------|
| E001 | T001 | As a skill author, I want one authoring gate for future skill changes. | Chain Skill source and contract test | Chain Skill shape, six writing dimensions | failing/passing focused test |
| E002 | T002 | As a workflow agent, I want one task.md contract source. | Task Contract Chain Skill, reads wiring, publish guard | no CLI/parser/validator, distributed not public | focused test, publish validation |
| E003 | T003 | As an orchestrator, I want one stage state machine contract. | Workflow Chain Contract and workflow skill reads | no task/quality/execution detail | focused test |
| E004 | T004 | As a quality gate, I want shared review/check/simplify/act semantics. | Quality Gate Contract and quality skill reads | include cc-simplify only at gate level | focused test |
| E005 | T005 | As parallel orchestration, I want child graph/integration semantics centralized. | Execution Environment Contract and parallel orchestration reads | no Codex thread wrapper/tool abstraction | focused test |
| E006 | T006 | As maintainer, I want workflow process fixtures not prose-only tests. | Jest fixtures | no new framework, no real child threads/PRs | focused fixture tests |

## Environment Contracts

--- CHILD DISPATCH START E001 ---

### E001 skill-authoring-gate

Goal: Implement #41, the `skill-authoring-gate` Chain Skill.
Route: cc-do
Status: integrated
Task file: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
Tasks: T001
Assigned task IDs:
- T001
DependsOn: none
Parallel: yes
TDD loop: exception
TDD exception: Contract-authoring slice; prove with focused source contract test rather than Red/Green behavior test.
Touches:
- `.claude/skills/skill-authoring-gate/SKILL.md`
- `test/skill-authoring-gate*.test.js`
- optional source skill reads that consume the gate
Mutable resources:
- source skill contracts
Verification:
- `npm test -- skill-authoring`
Merge gate:
- child commit exists
- child worktree is clean
- focused verification passed
- touched paths stayed inside this environment
Task contract coverage:
- T001 full task block exists below
Unlocks:
- E002
- E003
- E004
Child:
- Thread: `019edbab-aea2-7093-8012-a6b63dce9e06`
- Worktree: `/Users/dimon/.codex/worktrees/21f7/cc-devflow`
- Task file in child worktree: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
- Branch: `codex/REQ-008-E001-skill-authoring-gate`
- Commit: `cbc81fc` (`feat(skill-authoring-gate): add authoring contract`)
- Heartbeat: `req-008-e001`
Integration:
- Owner: parent `cc-dev` only; child must not cherry-pick, unlock siblings, or mark itself integrated.
- Cherry-picked: `96c014b`
- Focused verification: passed (`npm test -- skill-authoring`)

- [x] T001 [CONTRACT] Add skill-authoring-gate Chain Skill (dependsOn:none)
  Environment: E001
  Goal: Build #41 as a narrow Chain Skill for invocation, information hierarchy, completion criteria, progressive disclosure, leading words, and pruning.
  Contract: User Entry Skill / Chain Skill / Agent-facing internal contract language must be distinguished.
  Do not re-decide: this is a Chain Skill, not a user workflow entrypoint or loose checklist.
  TDD phase: exception
  Suite layer / runtime: focused Jest source contract test; expected under 3s.
  Confidence value: catches missing Chain Skill, accidental trigger fields, or incomplete authoring dimensions.
  Fixture/mock boundary: real repository files; no mocks.
  Low-value tests to avoid: full-file snapshots or exact long prose checks.
  Files: `.claude/skills/skill-authoring-gate/SKILL.md`, `test/skill-authoring-gate*.test.js`
  Read first: `CONTEXT.md`, issue #41, `writing-great-skills` content if locally available, and this task file.
  Verification: `npm test -- skill-authoring`
  Evidence: focused test output and git diff.
  Completion: after verification passes, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md --task T001`.
  Public verification path: source Chain Skill and contract test.
  Ready when: no upstream dependency.

--- CHILD DISPATCH END E001 ---

--- CHILD DISPATCH START E002 ---

### E002 task-contract

Goal: Implement #42, the `task-contract` Chain Skill.
Route: cc-do
Status: active
Task file: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
Tasks: T002
Assigned task IDs:
- T002
DependsOn: E001
Parallel: yes
TDD loop: exception
TDD exception: Contract-authoring slice; prove with source contract and publish validation tests.
Touches:
- `.claude/skills/task-contract/SKILL.md`
- `.claude/skills/cc-dev/SKILL.md`
- `.claude/skills/cc-plan/SKILL.md`
- `.claude/skills/cc-do/SKILL.md`
- `.claude/skills/cc-check/SKILL.md`
- `.claude/skills/cc-review/SKILL.md`
- `.claude/skills/cc-act/SKILL.md`
- `config/distributable-skills.json`
- `package.json`
- `scripts/validate-publish.js`
- `test/task-contract*.test.js`
- `test/validate-publish.test.js`
Mutable resources:
- source skill contracts
- package distribution metadata
Verification:
- `npm test -- task-contract`
- `npm test -- validate-publish`
- `npm run verify:publish`
Merge gate:
- child commit exists
- child worktree is clean
- focused verification passed
- touched paths stayed inside this environment
Task contract coverage:
- T002 full task block exists below
Unlocks:
- E005
- E006
Child:
- Thread: `019edbb9-658c-7363-983e-a0132a50d557`
- Worktree: `/Users/dimon/.codex/worktrees/8935/cc-devflow`
- Task file in child worktree: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
- Branch: detached HEAD at `3bcd1e4`
- Commit: pending
- Heartbeat: `req-008-e001`
Integration:
- Owner: parent `cc-dev` only; child must not cherry-pick, unlock siblings, or mark itself integrated.
- Cherry-picked: pending
- Focused verification: pending

- [ ] T002 [CONTRACT] Add task-contract Chain Skill (dependsOn:T001)
  Environment: E002
  Goal: Build #42 as a pure reference Chain Skill defining task.md shape, status, task blocks, Failure Ledger, Execution Environments, and reader/writer responsibilities.
  Contract: distributed but not public; no parser, DSL, validator, CLI command, workflow router, or delivery policy.
  Do not re-decide: Task Contract name, core PDCA reader set, retired artifact ban.
  TDD phase: exception
  Suite layer / runtime: focused Jest and publish validation; expected under 10s.
  Confidence value: catches missing reads, wrong public/distributed category, or retired guard regression.
  Fixture/mock boundary: real repository files; no mocks.
  Low-value tests to avoid: full prose snapshots.
  Files: see E002 Touches.
  Read first: `CONTEXT.md`, issues #41/#42, `scripts/validate-publish.js`, `config/distributable-skills.json`, and this task file.
  Verification: `npm test -- task-contract`, `npm test -- validate-publish`, `npm run verify:publish`.
  Evidence: focused test output, publish validation output, and git diff.
  Completion: after verification passes, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md --task T002`.
  Public verification path: source Chain Skill, core reads metadata, and publish validation.
  Ready when: E001 is integrated.

--- CHILD DISPATCH END E002 ---

--- CHILD DISPATCH START E003 ---

### E003 workflow-chain-contract

Goal: Implement #43, the `workflow-chain-contract` Chain Skill.
Route: cc-do
Status: planned
Task file: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
Tasks: T003
Assigned task IDs:
- T003
DependsOn: E001
Parallel: yes
TDD loop: exception
TDD exception: Contract-authoring slice; prove with focused workflow contract tests.
Touches:
- `.claude/skills/workflow-chain-contract/SKILL.md`
- workflow skill reads that consume the contract
- `test/workflow-chain-contract*.test.js`
Mutable resources:
- source workflow skill contracts
Verification:
- `npm test -- workflow-chain`
Merge gate:
- child commit exists
- child worktree is clean
- focused verification passed
- touched paths stayed inside this environment
Task contract coverage:
- T003 full task block exists below
Unlocks:
- E005
- E006
Child:
- Thread: pending
- Worktree: pending
- Task file in child worktree: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
- Branch: pending
- Commit: pending
Integration:
- Owner: parent `cc-dev` only; child must not cherry-pick, unlock siblings, or mark itself integrated.
- Cherry-picked: pending
- Focused verification: pending

- [ ] T003 [CONTRACT] Add workflow-chain-contract Chain Skill (dependsOn:T001)
  Environment: E003
  Goal: Build #43 as the stage state machine contract for main route, bug route, PR route, reroutes, terminal states, and entry/exit evidence.
  Contract: no task.md structure, quality gate semantics, child dispatch, or skill-writing rules.
  Do not re-decide: scope is stage state machine only.
  TDD phase: exception
  Suite layer / runtime: focused Jest source contract test; expected under 3s.
  Confidence value: catches missing terminal states, missing reroute semantics, or accidental contract responsibility overlap.
  Fixture/mock boundary: real repository files; no mocks.
  Low-value tests to avoid: testing full route prose verbatim.
  Files: see E003 Touches.
  Read first: `CONTEXT.md`, issues #41/#43, cc-dev/cc-plan/cc-do/cc-check/cc-act skill contracts, and this task file.
  Verification: `npm test -- workflow-chain`
  Evidence: focused test output and git diff.
  Completion: after verification passes, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md --task T003`.
  Public verification path: workflow Chain Skill and reader wiring.
  Ready when: E001 is integrated.

--- CHILD DISPATCH END E003 ---

--- CHILD DISPATCH START E004 ---

### E004 quality-gate-contract

Goal: Implement #44, the `quality-gate-contract` Chain Skill.
Route: cc-do
Status: planned
Task file: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
Tasks: T004
Assigned task IDs:
- T004
DependsOn: E001
Parallel: yes
TDD loop: exception
TDD exception: Contract-authoring slice; prove with focused quality gate contract tests.
Touches:
- `.claude/skills/quality-gate-contract/SKILL.md`
- quality skill reads that consume the contract
- `test/quality-gate-contract*.test.js`
Mutable resources:
- source quality skill contracts
Verification:
- `npm test -- quality-gate`
Merge gate:
- child commit exists
- child worktree is clean
- focused verification passed
- touched paths stayed inside this environment
Task contract coverage:
- T004 full task block exists below
Unlocks:
- E006
Child:
- Thread: pending
- Worktree: pending
- Task file in child worktree: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
- Branch: pending
- Commit: pending
Integration:
- Owner: parent `cc-dev` only; child must not cherry-pick, unlock siblings, or mark itself integrated.
- Cherry-picked: pending
- Focused verification: pending

- [ ] T004 [CONTRACT] Add quality-gate-contract Chain Skill (dependsOn:T001)
  Environment: E004
  Goal: Build #44 as the quality semantics contract for review severity, verification verdicts, confirmed smell, review escape, Failure Ledger, and postmortem input.
  Contract: include cc-simplify only at quality-gate level; no full reviewer swarm, productization surface, or detailed test-layer taxonomy.
  Do not re-decide: quality gate scope and cc-simplify inclusion boundary.
  TDD phase: exception
  Suite layer / runtime: focused Jest source contract test; expected under 3s.
  Confidence value: catches missing pass/fail/blocked, review escape, confirmed smell, or closeout semantics.
  Fixture/mock boundary: real repository files; no mocks.
  Low-value tests to avoid: exact report template snapshots.
  Files: see E004 Touches.
  Read first: `CONTEXT.md`, issues #41/#44, cc-review/cc-check/cc-simplify/cc-act contracts, and this task file.
  Verification: `npm test -- quality-gate`
  Evidence: focused test output and git diff.
  Completion: after verification passes, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md --task T004`.
  Public verification path: quality Chain Skill and reader wiring.
  Ready when: E001 is integrated.

--- CHILD DISPATCH END E004 ---

--- CHILD DISPATCH START E005 ---

### E005 execution-environment-contract

Goal: Implement #45, the `execution-environment-contract` Chain Skill.
Route: cc-do
Status: planned
Task file: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
Tasks: T005
Assigned task IDs:
- T005
DependsOn: E002, E003
Parallel: yes
TDD loop: exception
TDD exception: Contract-authoring slice; prove with focused execution environment contract tests.
Touches:
- `.claude/skills/execution-environment-contract/SKILL.md`
- parallel orchestration references or reads that consume the contract
- `test/execution-environment-contract*.test.js`
Mutable resources:
- source parallel orchestration contracts
Verification:
- `npm test -- execution-environment`
Merge gate:
- child commit exists
- child worktree is clean
- focused verification passed
- touched paths stayed inside this environment
Task contract coverage:
- T005 full task block exists below
Unlocks:
- E006
Child:
- Thread: pending
- Worktree: pending
- Task file in child worktree: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
- Branch: pending
- Commit: pending
Integration:
- Owner: parent `cc-dev` only; child must not cherry-pick, unlock siblings, or mark itself integrated.
- Cherry-picked: pending
- Focused verification: pending

- [ ] T005 [CONTRACT] Add execution-environment-contract Chain Skill (dependsOn:T002,T003)
  Environment: E005
  Goal: Build #45 as the parallel graph and integration contract for environment types, dependency fields, child dispatch boundary, final report, integration gate, and safe worktree closeout.
  Contract: no Codex thread tool wrappers, heartbeat implementation, model selection, or platform UI behavior.
  Do not re-decide: execution environment scope excludes platform adapter mechanics.
  TDD phase: exception
  Suite layer / runtime: focused Jest source contract test; expected under 3s.
  Confidence value: catches missing environment types, integration gate fields, or unsafe closeout rules.
  Fixture/mock boundary: real repository files; no mocks.
  Low-value tests to avoid: real child thread creation.
  Files: see E005 Touches.
  Read first: `CONTEXT.md`, issues #42/#43/#45, current parallel orchestration references, and this task file.
  Verification: `npm test -- execution-environment`
  Evidence: focused test output and git diff.
  Completion: after verification passes, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md --task T005`.
  Public verification path: execution environment Chain Skill and parallel orchestration reader wiring.
  Ready when: E002 and E003 are integrated.

--- CHILD DISPATCH END E005 ---

--- CHILD DISPATCH START E006 ---

### E006 workflow-fixture-tests

Goal: Implement #46, minimal workflow fixture tests for the contract set.
Route: cc-do
Status: planned
Task file: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
Tasks: T006
Assigned task IDs:
- T006
DependsOn: E002, E003, E004, E005
Parallel: yes
TDD loop: exception
TDD exception: Fixture-only slice; no source contract behavior before prerequisites are integrated.
Touches:
- `test/workflow-fixture*.test.js`
- small fixture files under `test/fixtures/` if needed
Mutable resources:
- test fixtures only
Verification:
- `npm test -- workflow-fixture`
Merge gate:
- child commit exists
- child worktree is clean
- focused verification passed
- touched paths stayed inside this environment
Task contract coverage:
- T006 full task block exists below
Unlocks:
- final `npm run adapt:codex`
- final `npm run verify:publish`
- final `cc-check`
Child:
- Thread: pending
- Worktree: pending
- Task file in child worktree: `devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`
- Branch: pending
- Commit: pending
Integration:
- Owner: parent `cc-dev` only; child must not cherry-pick, unlock siblings, or mark itself integrated.
- Cherry-picked: pending
- Focused verification: pending

- [ ] T006 [TEST] Add workflow fixture tests for skill contracts (dependsOn:T002,T003,T004,T005)
  Environment: E006
  Goal: Build #46 by adding minimal Jest fixtures for serial workflow, parallel environment, quality gate, and authoring gate process behavior.
  Contract: no new test framework, real child threads, real PR automation, external services, or broad golden snapshots.
  Do not re-decide: fixtures prove process shape only.
  TDD phase: exception
  Suite layer / runtime: focused Jest fixture tests; expected under 5s.
  Confidence value: catches process-contract drift that prose-only tests miss.
  Fixture/mock boundary: real repository fixture files; no external services.
  Low-value tests to avoid: full snapshots, live GitHub PRs, actual child thread dispatch.
  Files: see E006 Touches.
  Read first: issues #42/#43/#44/#45/#46, integrated Chain Skill contracts, and this task file.
  Verification: `npm test -- workflow-fixture`
  Evidence: focused test output and git diff.
  Completion: after verification passes, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md --task T006`.
  Public verification path: Jest workflow fixtures.
  Ready when: E002, E003, E004, and E005 are integrated.

--- CHILD DISPATCH END E006 ---

## Failure Ledger

Use this section only for real execution failures, reroutes, disproven assumptions, stale validation, wrong-file touches, repeated tool failures, user-corrected misses, or eligible `cc-review` escape findings. Eligible review escapes are limited to process, test, design, and model-pattern escapes. Do not prefill speculative risks.

| ID | Source | Trigger | Escape class | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |
|----|--------|---------|--------------|---------|----------|---------------|--------|------------------|--------|---------------------|

## Execution Protocol

ClaudeCode / Codex 执行本计划时，必须把 `task.md` 当成唯一任务合同。

- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`; if it cannot prove `next-change-key`, stop blocked.
- Task selection: use `scripts/select-ready-tasks.sh --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md`.
- Completion: after environment verification passes, run `scripts/mark-task-complete.sh --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md --task <task-id>`.
- Parallel child execution: parent dispatch must extract the full `--- CHILD DISPATCH START <Env> ---` to `--- CHILD DISPATCH END <Env> ---` range, including Env metadata, child fields, Integration fields, and complete assigned task blocks.
- Child execution rule: child reads Integration fields for acceptance context only; parent `cc-dev` owns cherry-pick, sibling unlocks, and integrated status updates.
- Stage commit rule: when the current workflow stage finishes in this environment, commit the completed stage to Git.
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
bash "$SCRIPT_ROOT/select-ready-tasks.sh" --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md
bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-008-skill-content-architecture-contracts/task.md --task <task-id>
```
