---
name: cc-plan
version: 3.28.0
description: 'Use when scope, design, and executable tasks must be frozen before coding.'
triggers:
  - 帮我规划这个需求
  - 先别写代码先定方案
  - 这个 bug 边界不清
  - 拆一下任务
  - plan this requirement
  - scope this bug
  - turn this into tasks
reads:
  - PLAYBOOK.md
  - assets/TASKS_TEMPLATE.md
  - assets/PARALLEL_TASKS_TEMPLATE.md
  - references/pre-plan-grill.md
  - references/planning-contract.md
  - references/git-commit-guidelines.md
  - references/domain-grilling-contract.md
  - references/doc-to-contract.md
  - references/CONTEXT-FORMAT.md
  - references/ADR-FORMAT.md
  - ../do-not-repeat-yourself/SKILL.md
  - ../workflow-chain-contract/SKILL.md
  - ../execution-environment-contract/SKILL.md
  - ../execution-environment-contract/scripts/validate-execution-environments.js
  - ../postmortem/SKILL.md
  - ../cc-research/SKILL.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - ../cc-dev/scripts/detect-worktree-state.sh
  - ../cc-dev/scripts/prepare-change-worktree.sh
  - ../cc-dev/scripts/ensure-work-branch.sh
  - ../cc-dev/references/domain-context-contract.md
  - ../cc-dev/references/user-choice-output-protocol.md
  - references/checklist-contract.md
  - ../task-contract/SKILL.md
writes:
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: true
entry_gate:
  - >-
    Resolve CLI, assign REQ/FIX key, prepare isolated exact-case worktree before
    writing `task.md`.
  - >-
    Read relevant domain context through
    `../cc-dev/references/domain-context-contract.md` before decision questions:
    root `CONTEXT-MAP.md` when present, otherwise root or local `CONTEXT.md`,
    plus relevant ADRs.
  - >-
    Read specs, relevant code/tests/docs, recent commits, and existing task
    truth before asking any unresolved question.
  - >-
    Use `../cc-research/SKILL.md` only for a real Evidence Gap that current
    project evidence, task truth, and prior research cannot answer before scope,
    design, or task freeze.
  - >-
    Run planning flow, Socratic dialogue, and domain grilling through
    `references/domain-grilling-contract.md` before task generation.
  - >-
    After grilling, run the Doc-To-Contract gate through
    `references/doc-to-contract.md`: extract clear context facts into typed
    structure, seams, adapters, errors, dependency rules, call stacks, and
    validation edges before implementation tasks are generated.
  - >-
    Use `../do-not-repeat-yourself/SKILL.md` when the plan introduces or
    depends on a new reusable mechanism; task contracts must name the existing
    wheel to reuse or why a new mechanism is justified.
  - >-
    Ask D<N> decision questions only when the answer changes scope, design,
    boundary, task split, or verification.
  - >-
    Use host-native structured choice via
    `../cc-dev/references/user-choice-output-protocol.md` when decisions need
    user input.
exit_criteria:
  - >-
    Serial `task.md` starts from `assets/TASKS_TEMPLATE.md`; parallel `task.md`
    starts from `assets/PARALLEL_TASKS_TEMPLATE.md`.
  - >-
    `task.md#Execution Environments` records execution units, dependency graph,
    parallel eligibility, child route, merge gate, and durable orchestration
    status when the change is non-trivial or user requested parallel work.
  - >-
    Parallel `task.md` contains `Contract Snapshot`, `Parallelization
    Rationale`, child dispatch boundaries, Env-level contract matrix, full
    status enum, full Failure Ledger, and complete task blocks per environment.
  - >-
    When `task.md#Execution Environments` is present, run
    `../execution-environment-contract/scripts/validate-execution-environments.js`;
    any `error` blocks freezing and routes to plan repair.
  - '`task.md` contains executable task blocks from the selected template.'
  - >-
    Non-trivial plans complete product/creative discovery, Second-Move Review,
    Design Pressure, and explicit user release before task generation.
  - D<N> decisions that changed the plan are recorded in `task.md`.
  - >-
    Domain terms were challenged against the glossary, fuzzy language was
    sharpened, concrete scenarios were tested, and repo-answerable claims were
    checked against code before asking.
  - >-
    Domain context growth was checked after clarification and plan approval;
    confirmed updates were written to `CONTEXT.md`, `CONTEXT-MAP.md`, or
    `docs/adr/*.md`, while deferred updates were recorded in `task.md`.
  - >-
    Clear prose facts from context docs, ADRs, specs, and grill answers were
    encoded in `task.md#Doc-To-Contract` as typed structure, interface seams,
    adapter topology, error contract, dependency rules, call stacks, validation
    edges, and explicit exclusions before task blocks.
  - >-
    Planned helpers, adapters, validators, parsers, scripts, skills, prompt
    rules, schemas, or cross-module doc rules have a DRY record from
    `../do-not-repeat-yourself/SKILL.md` or an explicit reuse point in
    `task.md`.
  - No process file beyond `task.md` or cc-research-owned `devflow/research/*`.
  - Plan-stage changes are committed to Git before handoff.
  - Plan-stage commits follow `references/git-commit-guidelines.md`.
reroutes:
  - when: >-
      The discussion is still project direction or stage order instead of one
      requirement.
    target: stop
  - when: The plan is already approved and tasks are frozen.
    target: cc-do
---

# CC-Plan

`cc-plan` 是 PDCA 的 Plan：把需求压成一份可执行任务合同，再交给 `cc-do`。

唯一默认输出是 `devflow/changes/<change-key>/task.md`。Git commit 是阶段历史，不另建过程文件。

## Load Table

| Need | Load |
| --- | --- |
| Planning workflow and setup | `PLAYBOOK.md` |
| Checklist before pause or exit | `references/checklist-contract.md` |
| Plan-stage commit contract | `references/git-commit-guidelines.md` |
| Planning flow, Decision Questions, Design Pressure, Branch Chain | `references/planning-contract.md` |
| User asks for pre-plan grilling or the requirement is too broad to freeze | `references/pre-plan-grill.md` |
| Domain grilling, glossary challenge, inline context updates, ADR offer rules | `references/domain-grilling-contract.md` |
| Turn resolved docs/grill prose into typed execution contract | `references/doc-to-contract.md` |
| Planned new mechanism or reuse point | `../do-not-repeat-yourself/SKILL.md` |
| CONTEXT glossary format | `references/CONTEXT-FORMAT.md` |
| ADR format | `references/ADR-FORMAT.md` |
| Domain language, context map, or ADR discipline | `../cc-dev/references/domain-context-contract.md` |
| Real Evidence Gap before scope, design, or task freeze | `../cc-research/SKILL.md` |
| Execution Environments machine check | `../execution-environment-contract/scripts/validate-execution-environments.js` |
| User-facing decision choice | `../cc-dev/references/user-choice-output-protocol.md` |
| Approved serial plan needs parent `task.md` | complete `assets/TASKS_TEMPLATE.md` skeleton |
| Approved parallel plan needs parent `task.md` | `assets/PARALLEL_TASKS_TEMPLATE.md` |

## Mandatory Work Chain

Every `cc-plan` run follows this chain before `task.md` is frozen:

1. Context-first read: inspect `CONTEXT-MAP.md` when present; otherwise inspect
   the relevant `CONTEXT.md`; then read ADRs that touch the affected domain,
   module, interface, data contract, provider, workflow, or release boundary.
   If none exist, continue without creating them preemptively.
2. Evidence pass: read specs, relevant code/tests/docs, recent commits, and
   existing task truth so repo-answerable questions are answered from evidence
   instead of asked back to the user.
3. Reuse shaping: use `../do-not-repeat-yourself/SKILL.md` for any planned new
   helper, adapter, validator, parser, script, skill, prompt rule, schema, or
   cross-module doc rule. Prefer existing repo wheels; when no wheel fits,
   record the reason in `task.md#Contract Summary`.
4. Requirement grilling: use `references/domain-grilling-contract.md` to refine
   the requirement one question at a time. Challenge glossary conflicts,
   sharpen fuzzy terms, test concrete scenarios, and provide a recommended
   answer for each unresolved question.
5. Context crystallization: when the grilling resolves durable language or
   decisions, update confirmed `CONTEXT.md`, `CONTEXT-MAP.md`, or ADR files
   inline using the reference formats. Defer unconfirmed deltas into
   `task.md#Contract Summary`.
6. Doc-to-contract gate: extract clear facts from context docs, ADRs, specs,
   and grill answers into typed structure, interface seams, adapter topology,
   error contract, dependency rules, production/test call stacks, validation
   edges, and business logic exclusions. If a prose fact cannot be encoded
   cleanly, ask a `D<N>` question or plan a spike before task generation.
7. Plan synthesis: turn the approved answers into scope, non-goals, user/edge
   stories, interface/data contract, state ownership, test strategy, Design
   Pressure, Second-Move Review, and verification seams.
8. Execution architecture: when work can be split, define execution environments
   before task blocks. Each environment owns one independently committable,
   independently verifiable slice and names its child skill route. Do not create
   automatic review-only environments for the normal PDCA path; final review
   convergence belongs to `cc-check`.
9. Task generation: choose the parent template only after requirement release
   and technical release. Use `assets/PARALLEL_TASKS_TEMPLATE.md` when the user
   asks for parallel work or the plan contains multiple independently
   committable environments; otherwise use `assets/TASKS_TEMPLATE.md`. Fill or
   explicitly mark the selected template sections. Parallel task blocks stay
   complete and live under their assigned environment dispatch boundary.
10. Closeout: validate the plan artifact, commit the Plan stage, and route to
   `cc-do`, `cc-diagnose`, or `stop`.

## Flow

REQ/FIX worktree -> domain context -> repo evidence -> requirement grilling -> context crystallization -> doc-to-contract -> plan synthesis -> task blocks -> commit -> route.

```bash
DEVFLOW=".claude/skills/cc-dev/scripts/resolve-cc-devflow.sh"
bash "$DEVFLOW" config resolve --format policy
```

## Default Output

Answer with: Change, Scope, Tasks, Verification, Route (`cc-do`, `cc-diagnose`, or `stop`).
