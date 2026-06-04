# task.md

## Plan Meta

- CC-Plan skill version:
- Template source: `assets/PARALLEL_TASKS_TEMPLATE.md`
- Work branch:
- Output language:

## Contract Snapshot

Change:
Mode: parallel-plan
Approval:

Goal:
-

Do Not Do:
-

Approved Direction:
-

Open Decisions:
-

Verification:
-

Risk / Escalate If:
-

Parallelization Rationale:
- Why parallel:
- Independent resources:
- Dependency boundary:
- Cannot overlap:
- Why not serial:

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
| E001 | cc-do | planned | none | yes | pending | pending | pending |

### Environment Task Allocation

Every task ID listed here must have a full task block inside that environment
dispatch boundary below. Task IDs are globally unique across the whole file.
A branch label, workstream name, local task number, or prose-only TODO is
invalid.

| Env | Assigned tasks | TDD sequence | Independent proof | Cannot overlap with |
|-----|----------------|--------------|-------------------|---------------------|
| E001 | T001, T002, T003 | T001 red -> T002 green -> T003 refactor/check | `npm test -- path/to/test` | E002 touched paths or mutable resources |

## Env Contract Matrix

| Env | Tasks | User / edge story | Public seam | Do not re-decide | Verification evidence |
|-----|-------|-------------------|-------------|------------------|-----------------------|
| E001 | T001, T002, T003 | US-001 / US-EDGE-001 |  | scope, public seam, mock boundary | failing output, passing output, focused command |

## Environment Contracts

--- CHILD DISPATCH START E001 ---

### E001 first-closed-slice

Goal:
Route: cc-do
Status: planned
Task file: `devflow/changes/<change-key>/task.md`
Tasks: T001, T002, T003
Assigned task IDs:
- T001
- T002
- T003
DependsOn: none
Parallel: yes
TDD loop: Red -> Green -> Refactor
TDD exception: none
Touches:
- `path/to/test`
- `path/to/file`
Mutable resources:
- none
Verification:
- `npm test -- path/to/test`
Merge gate:
- child commit exists
- child worktree is clean
- focused verification passed
- touched paths stayed inside this environment
Task contract coverage:
- T001 full task block exists below
- T002 full task block exists below
- T003 full task block exists below
Unlocks:
- E002
Child:
- Thread: pending
- Worktree: pending
- Task file in child worktree: `devflow/changes/<change-key>/task.md`
- Branch: pending
- Commit: pending
Integration:
- Owner: parent `cc-dev` only; child must not cherry-pick, unlock siblings, or mark itself integrated.
- Cherry-picked: pending
- Focused verification: pending

- [ ] T001 [TEST] Write the first failing test (dependsOn:none) `path/to/test`
  Environment: E001
  Goal: 证明当前行为还没实现，必须先看到失败。
  Contract: user story `US-001`; method/interface `<public seam>`; input/output `<contract>`.
  Do not re-decide: target behavior, public seam, allowed mock boundary.
  TDD phase: red
  Suite layer / runtime: `<unit|contract|integration|e2e|visual|smoke>`; expected `<command time>`.
  Confidence value: catches `<specific bug/regression/user-visible failure>`.
  Fixture/mock boundary: `<real fixture fields>`; mock only `<external boundary>`.
  Low-value tests to avoid: broad snapshots, duplicate happy paths, internal call-count assertions, no-op smoke.
  Files: `path/to/test`
  Read first: `task.md`
  Verification: `npm test -- path/to/test`
  Evidence: failing output
  Completion: after failing evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/<change-key>/task.md --task T001`.
  Public verification path: 从公共入口或用户可见路径读回结果。
  Ready when: 没有上游依赖，且测试路径已经确定。

- [ ] T002 [IMPL] Make the first test pass (dependsOn:T001) `path/to/file`
  Environment: E001
  Goal: 用最小实现让 T001 转绿。
  Contract: user story `US-001`; method/interface `<method or operation>`; input/output `<contract>`.
  Do not re-decide: file ownership, method shape, error shape, Green minimality boundary.
  TDD phase: green
  Suite layer / runtime: same as T001 unless implementation exposes a new public contract.
  Confidence value: preserves T001 behavior without pre-building future untested branches.
  Fixture/mock boundary: same as T001.
  Low-value tests to avoid: widening assertions after Green without a new Red.
  Files: `path/to/file`
  Read first: `task.md`, `path/to/test`
  Verification: `npm test -- path/to/test`
  Evidence: passing output + Git diff
  Completion: after green evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/<change-key>/task.md --task T002`.
  Public verification path: same as T001.
  Ready when: T001 has failing evidence.

- [ ] T003 [REFACTOR] Remove incidental complexity and prove the slice still holds (dependsOn:T002) `path/to/file`
  Environment: E001
  Goal: 简化 T002 中为转绿临时产生的重复、分支或命名噪音，不扩大功能。
  Contract: user story `US-001`; method/interface unchanged from T002; input/output unchanged.
  Do not re-decide: feature scope, public seam, error shape, or sibling environment ownership.
  TDD phase: refactor
  Suite layer / runtime: same command as T002 plus any focused lint/typecheck if touched files require it.
  Confidence value: proves cleanup did not change the user-visible contract.
  Fixture/mock boundary: unchanged from T001/T002.
  Low-value tests to avoid: new assertions without a new Red, broad snapshots, unrelated coverage padding.
  Files: `path/to/file`
  Read first: `task.md`, `path/to/test`, `path/to/file`
  Verification: `npm test -- path/to/test`
  Evidence: passing output + simplified Git diff
  Completion: after refactor evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/<change-key>/task.md --task T003`.
  Public verification path: same as T001.
  Ready when: T002 is green and the cleanup stays inside E001 touched paths.

--- CHILD DISPATCH END E001 ---

Use `C###` for check-only environments, `A###` for isolated act/closeout
environments, and `EF###` for diagnosis environments created after a failed
child, cherry-pick, or phase gate. Do not add normal `R###` review-only
environments; final multi-round `cc-review` subAgents are launched by
`cc-check`. Add standalone review environments only when explicitly requested.

## Failure Ledger

Use this section only for real execution failures, reroutes, disproven assumptions, stale validation, wrong-file touches, repeated tool failures, user-corrected misses, or eligible `cc-review` escape findings. Eligible review escapes are limited to process, test, design, and model-pattern escapes. Do not prefill speculative risks.

| ID | Source | Trigger | Escape class | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |
|----|--------|---------|--------------|---------|----------|---------------|--------|------------------|--------|---------------------|
| FL-001 |  |  | process-escape / test-escape / design-escape / model-pattern-escape |  |  |  |  |  | unreviewed / confirmed-lesson / noise / unresolved-risk | no |

## Execution Protocol

ClaudeCode / Codex 执行本计划时，必须把 `task.md` 当成唯一任务合同。

- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`; if it cannot prove `next-change-key`, stop blocked.
- Task selection: use `scripts/select-ready-tasks.sh --tasks devflow/changes/<change-key>/task.md`.
- Completion: after Red/Green/Refactor evidence and review pass, run `scripts/mark-task-complete.sh --tasks devflow/changes/<change-key>/task.md --task <task-id>`.
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
bash "$SCRIPT_ROOT/select-ready-tasks.sh" --tasks devflow/changes/<change-key>/task.md
bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/<change-key>/task.md --task <task-id>
```
