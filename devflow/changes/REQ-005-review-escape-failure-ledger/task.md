# REQ-005 review escape failure ledger

## Plan Meta

- CC-Plan skill version: 3.17.1
- Work branch: `REQ/005-review-escape-failure-ledger`
- Output language: zh-CN
- Source roadmap item: not applicable

## Contract Summary

Change: REQ-005-review-escape-failure-ledger
Mode: plan
Profile: tiny-design
Approval: user approved direct implementation after brainstorming.

Goal:
- Teach `cc-review` to write only process, test, design, and model-pattern escape findings into `task.md#Failure Ledger`.
- Keep ordinary review findings in the normal review output or task contract update.
- Keep `cc-check` and `cc-act` as the classification and compression stages.

Do Not Do:
- Do not create a new incident log, review ledger, JSONL file, or process-file family.
- Do not route every review finding into `Failure Ledger`.
- Do not let `cc-review` pre-classify entries as postmortem conclusions.

Source Handoff:
- Roadmap / issue / user source: current user request after brainstorming.
- Repo evidence read: `cc-review`, `cc-do`, `cc-check`, `cc-act`, task templates, docs, and existing examples.
- Existing leverage: `task.md#Failure Ledger`, `cc-check` classification, `cc-act` postmortem compression.
- Canonical language: review escape, process escape, test escape, design escape, model-pattern escape, Failure Ledger.

Requirement Reality:
- User / operator: agent running `cc-review`, then `cc-check` / `cc-act`.
- Status quo workaround: escaped review findings stay in chat, so `cc-act` cannot reliably compress lessons.
- Most painful failure: recurring agent writing mistakes and escaped verification/design misses never become durable learning.
- Smallest success signal: `cc-review` contract and task templates define the narrow eligible escape classes and keep ordinary findings out.
- Non-goals: automatic log script, new process artifacts, broad postmortem memory system.

Decision Questions:
| ID | Decision | Evidence | Choice | Impact |
|----|----------|----------|--------|--------|
| D1 | Where should process capture live? | Existing artifact contract bans process files. | Use `task.md#Failure Ledger`. | Avoids new log sprawl. |
| D2 | Which review findings enter the ledger? | User selected the boundary. | Only process/test/design escapes plus model-pattern escapes. | Keeps ledger focused. |
| D3 | Should severity filter model-pattern escapes? | User noted small model-writing bugs can be preventable training issues. | Filter by repeatability and preventability, not size. | Captures useful small habits without making all findings durable. |

Approved Direction:
- Add an explicit review-escape contract to `cc-review`.
- Add `Source`, `Trigger`, and `Escape class` fields to Failure Ledger templates.
- Update `cc-check` and `cc-act` wording so classification/compression consume escaped review candidates without treating raw findings as postmortems.
- Update public docs and examples to match the new ledger shape.

User Stories:
| ID | Actor | Story | Acceptance | Edge / recovery |
|----|-------|-------|------------|-----------------|
| US-001 | Agent running cc-review | When review catches an escaped process/test/design/model-pattern issue, I record a structured Failure Ledger candidate in `task.md`. | `cc-review` names eligible classes, excluded finding types, and default unreviewed/no state. | Ordinary review findings stay in response or task edits. |
| US-002 | Agent running cc-check | When checking a change, I classify review-written ledger candidates before closeout. | `cc-check` references review escape candidates in its ledger review. | Unclear candidates stay `unresolved-risk` or are dropped as `noise`. |
| US-003 | Agent running cc-act | When closing work, I compress only confirmed ledger lessons, including eligible review escape candidates. | `cc-act` still ignores raw chat memory and ordinary review findings. | No postmortem is written when candidates are not confirmed and marked keep=yes. |

Engineering Review Gate:
- Existing leverage map: use `task.md#Failure Ledger` instead of a new log.
- Scope challenge: update contract text and examples, not runtime automation.
- Interface depth: a small table-schema change carries the concept across skills.
- Test seam: repository tests assert the skill/template text includes the new contract.
- Mock boundary: no mocks; content tests inspect real files.
- Feedback loop: `adapt:codex`, `adapt:check`, `verify:examples`, and targeted Jest.

ASCII Branch Chain Analysis:

```text
需求影响链
需求: review escape candidates feed Failure Ledger
|-- 上游来源: user decision in current session
|-- 当前代码路径: .claude/skills/cc-review/SKILL.md and task templates
|   |-- 调用方: agents running cc-review, cc-check, cc-act
|   |-- 数据或状态: task.md#Failure Ledger table fields
|   `-- 最深影响层: postmortem input contract
|-- 必要变更: define eligible escape classes and structured ledger fields
`-- 验证缝隙: content tests plus generated Codex mirror validation

业务影响链
结果: recurring agent and workflow mistakes become durable review evidence
|-- 直接行为影响: cc-review writes only eligible escape candidates
|-- 下游影响: cc-check classifies and cc-act compresses confirmed lessons
|-- 风险分支: ledger becomes a garbage bin if ordinary findings are admitted
`-- 非目标分支: no new process log or automatic model training system
```

Acceptance:
- `cc-review` documents four eligible escape classes: process, test, design, and model-pattern.
- `cc-review` says ordinary findings, style suggestions, one-off bugs, and speculative risks do not enter `Failure Ledger`.
- Failure Ledger templates include `Source`, `Trigger`, and `Escape class`.
- `cc-check` classifies review escape candidates.
- `cc-act` compresses only confirmed keep=yes ledger entries, not raw review findings.

Verification:
- `npm test -- test/review-escape-failure-ledger.test.js`
- `npm run adapt:codex`
- `npm run adapt:check`
- `npm run verify:examples`
- `npm run verify:publish`
- `git diff --check`

Risk / Escalate If:
- If table-shape changes break examples, update examples in the same change.
- If generated `.codex` output drifts, regenerate from `.claude` only.
- If review wording starts admitting all findings, simplify back to the four escape classes.

## Failure Ledger

Use this section only for real execution failures, reroutes, disproven assumptions, stale validation, wrong-file touches, repeated tool failures, user-corrected misses, or eligible `cc-review` escape findings. Eligible review escapes are limited to process, test, design, and model-pattern escapes.

| ID | Source | Trigger | Escape class | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |
|----|--------|---------|--------------|---------|----------|---------------|--------|------------------|--------|---------------------|
| FL-001 | cc-do | tool-failure | process-escape | T001 Red command could not execute because `jest` was missing. | `npm test -- test/review-escape-failure-ledger.test.js` exited 127 with `sh: jest: command not found`. | Ran `npm ci` in the isolated worktree. | Dependencies installed; rerun reached the expected contract-test failures. | Existing worktree bootstrap rule covered this; no new postmortem input. | noise | no |

## Execution Protocol

Codex 执行本计划时，必须把 `task.md` 当成唯一任务合同。

- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`; if it cannot prove `next-change-key`, stop blocked.
- Task selection: use `scripts/select-ready-tasks.sh --tasks devflow/changes/REQ-005-review-escape-failure-ledger/task.md`.
- Completion: after Red/Green/Refactor evidence and review pass, run `scripts/mark-task-complete.sh --tasks devflow/changes/REQ-005-review-escape-failure-ledger/task.md --task <task-id>`.
- Stage commit rule: when PDCA or IDCA finishes in the current environment, commit the completed stage to Git.
- Runtime file ban: do not generate process files beyond this `task.md`.

## Task Contract Matrix

| Task | User / edge story | Interface / method | File owner / responsibility | Do not re-decide | Verification evidence |
|------|-------------------|--------------------|-----------------------------|------------------|-----------------------|
| T001 | US-001 / ordinary findings excluded | content test | tests own behavior proof | four escape classes | failing then passing Jest |
| T002 | US-001-US-003 / contract visible in skills | skill/docs/templates | `.claude` source owns contract, `.codex` generated | no new log file | generated mirror and examples verify |
| T003 | US-003 / closeout proof | validation commands | repo validation | no unstaged drift | validation output |

## Phase 1: Review Escape Contract

- [x] T001 [TEST] Lock review escape Failure Ledger wording (dependsOn:none) `test/review-escape-failure-ledger.test.js`
  Goal: Prove current contract does not yet define the four eligible review escape classes and new ledger fields.
  Contract: user stories `US-001` through `US-003`; interface real skill/template files.
  Do not re-decide: eligible classes, no new log, ordinary findings excluded.
  TDD phase: red
  Files: `test/review-escape-failure-ledger.test.js`
  Read first: `task.md`, `cc-review`, `cc-check`, `cc-act`, task templates.
  Verification: `npm test -- test/review-escape-failure-ledger.test.js`
  Evidence: Red output after dependency bootstrap: 3 failures for missing `Review Escape Ledger`, new Failure Ledger fields, and `cc-check` / `cc-act` review escape wording.
  Completion: after failing evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-005-review-escape-failure-ledger/task.md --task T001`.
  Public verification path: Jest reads shipped skill/template text.
  Ready when: no dependencies.

- [x] T002 [IMPL] Add review escape Failure Ledger contract (dependsOn:T001) `.claude/skills`
  Goal: Update authoritative `.claude` skills, templates, docs, and examples so eligible `cc-review` escapes become structured Failure Ledger candidates.
  Contract: user stories `US-001` through `US-003`; `.claude` is source, `.codex` is generated.
  Do not re-decide: no separate log, no all-findings ledger, model-pattern filtered by repeatability/preventability.
  TDD phase: green
  Files: `.claude/skills/cc-review/SKILL.md`, `.claude/skills/cc-review/references/*`, `.claude/skills/cc-check/SKILL.md`, `.claude/skills/cc-act/SKILL.md`, `.claude/skills/cc-plan/assets/TASKS_TEMPLATE.md`, `.claude/skills/cc-investigate/assets/TASKS_TEMPLATE.md`, docs/examples as needed.
  Read first: `task.md`, failing test output.
  Verification: `npm test -- test/review-escape-failure-ledger.test.js`
  Evidence: `npm test -- test/review-escape-failure-ledger.test.js` passed with 3 tests after source contract updates.
  Completion: after green evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-005-review-escape-failure-ledger/task.md --task T002`.
  Public verification path: skills and example task artifacts expose the contract.
  Ready when: T001 has failing evidence.

- [x] T003 [CHECK] Regenerate Codex mirror and validate package surface (dependsOn:T002) `.codex/skills`
  Goal: Prove generated Codex mirror and public package examples match the authoritative source.
  Contract: `.claude` source edited first; `.codex` generated through `npm run adapt:codex`.
  Do not re-decide: no hand-maintained `.codex` edits.
  TDD phase: check
  Files: `.codex/skills/**`, validation outputs.
  Read first: `task.md`, changed files.
  Verification: `npm run adapt:codex`; `npm run adapt:check`; `npm run verify:examples`; `npm run verify:publish`; `git diff --check`
  Evidence: `npm run adapt:codex` completed; `npm run adapt:check` no drift; `npm run verify:examples` passed; `npm run verify:publish` passed; `git diff --check` passed; `npm test` passed 31 suites / 258 tests.
  Completion: after validation evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-005-review-escape-failure-ledger/task.md --task T003`.
  Public verification path: generated mirror and publish validation.
  Ready when: T002 is complete.
