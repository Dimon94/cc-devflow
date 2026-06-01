# CC-Plan Playbook

## State Machine

`cc-plan -> cc-do`

- Enter with one requirement or bug-shaped planning request.
- Stay until `task.md` has approved scope, task blocks, and verification commands.
- Exit after the Plan commit exists.

## Setup

1. Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require next-change-key config`.
2. Create a canonical key with `next-change-key --prefix REQ|FIX --description "..."`.
3. Run `../cc-dev/scripts/detect-worktree-state.sh` before any write.
4. Run `../cc-dev/scripts/prepare-change-worktree.sh --change-key <REQ/FIX-...>`.
5. Enter returned `WORKTREE_PATH`.
6. Run `../cc-dev/scripts/ensure-work-branch.sh --change-key <REQ/FIX-...>`.

Submodule entry, wrong linked worktree, branch case collision, target mismatch, or missing CLI capability is a setup blocker. Keep the main checkout on `main`.

## Mandatory Plan Chain

Every plan starts from the domain model, not from a blank task list:

1. Context-first read: read root `CONTEXT-MAP.md` when present; otherwise read
   the relevant root or local `CONTEXT.md`; then read ADRs that touch the
   affected domain, module, interface, data contract, provider, workflow, or
   release boundary.
2. Evidence pass: read specs, relevant code/tests/docs, recent
   commits, and existing task truth. If a question can be answered by the repo,
   answer it from evidence instead of asking the user.
3. Requirement grilling: refine the requirement one question at a time through
   `references/domain-grilling-contract.md`; challenge glossary conflicts,
   sharpen fuzzy terms, test concrete scenarios, and recommend an answer for
   each unresolved question.
4. Context crystallization: update confirmed glossary, context-map, or ADR
   decisions inline when they become durable; keep `CONTEXT.md` glossary-only
   and defer unconfirmed deltas into `task.md#Contract Summary`.
5. Solution shaping: when multiple solution shapes are viable, mechanism truth
   is unknown, or the requirement is still too broad, separate requirements
   from candidate shapes, run an ASCII PASS/FAIL fit check, and resolve unknown
   mechanisms before a shape is allowed to pass.
6. Plan synthesis: convert the approved answers into scope, non-goals,
   user/edge stories, interface/data contract, state ownership, test strategy,
   Design Pressure, Second-Move Review, and verification seams.
7. Execution environments: for non-trivial or parallel-ready work, define the
   independently committable environments before task blocks. Each environment
   names route, tasks, dependencies, touched paths, verification, merge gate,
   unlocks, and initial status. Do not create automatic review-only environments
   for the normal PDCA path; `cc-check` owns final review convergence.
8. Task generation: write `task.md` task blocks from `assets/TASKS_TEMPLATE.md`
   only after requirement release and technical release.
9. Closeout: validate the plan artifact, commit the Plan stage, and route onward.

## Rules

1. Only `task.md` is written during Plan.
2. Git commits record Plan completion; do not create process files beyond `task.md`.
3. Current branch must bind to the full change key before writing durable output.
4. The task list must let `cc-do` continue without chat memory.
5. Ask only decisions that change product value, product shape, scope, design, task split, interface, or verification; otherwise choose from repo evidence.
6. Product/creative questions come before engineering questions when worth or shape is unclear.
7. Preserve planning thought inside `task.md#Contract Summary`: product/creative discovery, requirement reality, domain grilling, system shape, interface/data contract, abstraction boundary, execution architecture, task contract, Second-Move Review, and final approval.
8. Non-trivial plans complete Second-Move Review: first good move, simpler move, better architecture, selected move, and rejected tradeoff. Tiny plans still record why the short path is enough.
9. Non-trivial plans use at least two confirmation rounds unless source evidence already answers one: product/creative confirmation, then engineering/task confirmation.
10. Domain grilling is part of planning: challenge terms against `CONTEXT.md`, sharpen fuzzy language, test concrete scenarios, check code-answerable claims from repo evidence, and update confirmed glossary/ADR decisions inline through `references/domain-grilling-contract.md`.
11. Solution shaping is conditional, not ceremonial. Use it for competing
    shapes, broad requirements, or unknown mechanisms; record `Trigger:
    skipped` for tiny single-path fixes.
12. User-facing decisions use `D<N>` questions with recommendation, options, impact, and STOP.
13. Parallel work is a plan contract, not an execution guess. If a task can run
    in parallel, record the execution environment graph and its gates in
    `task.md`; otherwise say why the change stays serial.
14. `cc-plan` does not split review subthreads by default. Record the expected
    final `cc-check` review convergence gate instead of adding `R###`
    environments, unless the user explicitly asks for standalone review work.

## Progressive Flow

1. Context-first read: `CONTEXT-MAP.md`, relevant `CONTEXT.md`, and ADRs.
2. Gather repo evidence: specs, relevant code/tests/docs, recent commits, and existing task truth.
3. Product/Creative Discovery: worth doing, desired product shape, narrowest wedge, 10x/better version, do-nothing consequence.
4. Requirement Reality and Grilling: real user/operator, workaround, painful failure, smallest success signal, non-goals, glossary conflicts, fuzzy terms, concrete scenarios, and code contradictions.
5. Context Crystallization: inline confirmed context updates and ADR-worthy decisions; defer unconfirmed deltas into `task.md`.
6. Solution Shaping when triggered: R requirements, candidate shapes,
   PASS/FAIL fit check, selected shape, rejected shapes, and resolved
   mechanism unknowns.
7. System Shape: existing code path, module owner, state/data flow, reuse point, boundary systems.
8. Interface/Data Contract: public seam, caller, fields, errors, permissions, and external boundaries.
9. Abstraction Boundary and Design Pressure: deep module shape, hidden complexity, caller knowledge, public seam, vertical task slices, and special-case elimination.
10. Execution Architecture: file responsibility, failure recovery, task order, verification commands, and escalation triggers.
11. Second-Move Review: first good move, simpler move, better architecture, selected move, rejected tradeoff.
12. Final Approval: task generation waits until the user releases both requirement and technical plan, unless repo evidence gives an explicit skip reason.

Tiny plans may compress rounds to evidence-backed lines. Full designs preserve enough detail that `cc-do` does not invent architecture, fields, interfaces, or tests.

## 规划判断

好计划的标准不是“看起来完整”，而是让 `cc-do` 不再需要替你做决策。`cc-do` 应该执行，不应该推断产品形态、数据字段、错误语义或测试接缝。

只有满足这些条件，才冻结计划：

1. 用户 / operator 和最小成功信号是具体的。
2. non-goals 能挡住明显的范围膨胀。
3. 公开接缝、数据 contract、错误、权限、状态归属都被命名。
4. task slice 是纵向的，并且可以独立验证。
5. 选定设计已经和“更简单的一步”以及“更好架构的一步”比较过。
6. 验证命令证明行为，不是证明实现琐事。

坏计划信号：

- 任务只是“backend / frontend / tests”这种分层桶。
- task 写“实现逻辑”，但没有公开行为和证明命令。
- 关键术语和 spec / repo truth 不一致，却没有记录假设。
- 方案部件只是复述需求，没有说明可构建机制。
- Fit Check 把未知机制当成 PASS，让 `cc-do` 去猜实现。
- 计划直接选第一个能跑的方案，没有做 Second-Move Review。
- 行为工作把 Red 测试推迟到实现之后。

出现这些信号时，继续规划，或从 `cc-do` / `cc-check` 打回。

## Dialogue And Decisions

Ask only decisions that change product value, product shape, scope, design, task split, interface, or verification. Use `../cc-dev/references/user-choice-output-protocol.md`: host-native structured choice first, fixed A/B/C fallback only when needed.

Before task blocks, challenge 3 hidden assumptions, overengineering risk, and the current code or proposal with an adversarial review. Every 10 user-facing Socratic rounds, persist a Dialogue Checkpoint in `task.md#Contract Summary` before asking the next question.

## Required Task Fields

Each task block includes:

- ID and title
- TDD phase
- dependencies
- touched files
- read-first context
- verification command
- completion evidence
- commit point if the task closes an execution environment

## Required Execution Environment Fields

Each non-trivial plan records `## Execution Environments` before the task
blocks. Omit it only for tiny serial changes and say why in `Contract Summary`.

Each environment includes:

- ID: `E001` for planned work, `C001` for check-only, `A001` for act-only
  closeout, and `EF001` for diagnosis environments created after a failure.
  `R001` review-only environments are allowed only for explicit standalone
  review requests, not for the normal PDCA review gate.
- Route: `cc-do`, `cc-review`, `cc-check`, `cc-diagnose`, or `cc-act`.
- Status: initial `planned`; later `dispatched`, `completed`, `integrated`,
  `blocked`, or `skipped`.
- Tasks: task IDs included in the environment.
- DependsOn / Unlocks: environment IDs, not only task IDs.
- Parallel: `yes` only when the environment has no causal dependency or touched
  path conflict with its sibling batch.
- Touches: files, directories, public interfaces, mutable resources, and
  submodules expected to change or be exercised.
- Verification: focused commands or review/check evidence required.
- Merge gate: commit/evidence/clean worktree/cherry-pick requirements.
- Child: thread/session/worktree/branch/commit fields start as `pending`.

Tasks must be tracer bullets: `[TEST] -> [IMPL] -> [REFACTOR]`. Each task names the public verification path, command, completion evidence, suite layer/runtime, proof value, fixture/mock boundary, and low-value tests to avoid. Regression tests cannot be deferred; if no honest seam exists, plan a spike or design correction.

## Contract Summary Fields

`task.md#Contract Summary` includes:

- Source handoff and repo evidence
- Product/creative discovery: worth doing, desired product shape, narrowest wedge, 10x/better version, do-nothing consequence
- Requirement reality
- Domain grilling: glossary conflicts, fuzzy terms, concrete scenarios, code contradictions, context updates, ADR decisions
- Solution shaping when triggered: R requirements, S candidate shapes,
  PASS/FAIL fit check, selected shape, rejected shapes, and unknown mechanism
  resolution
- Decision questions and answers
- Planning flow table
- Second-Move Review when non-trivial
- Approved direction and non-goals
- User stories and edge stories
- Check-stage review convergence gate
- Verification and escalation triggers

Also record ASCII Branch Chain Analysis, Design Pressure, test strategy shape, user-facing D<N> decisions, and explicit skip reasons for any compressed planning round.

## Handoff

Exit with:

- change key, worktree, and branch
- `task.md` path
- task count and first ready task
- planned verification commands
- Plan commit hash
- next route: `cc-do`, `cc-diagnose`, or `stop`

## Exit

Run the smallest relevant validation for the plan artifacts, stage only owned changes, and commit the Plan stage. Then hand off to `cc-do`.
