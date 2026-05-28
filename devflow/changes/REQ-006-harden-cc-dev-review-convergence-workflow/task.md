# task.md

## Plan Meta

- CC-Plan skill version: 3.16.0
- Work branch: REQ/006-harden-cc-dev-review-convergence-workflow
- Output language: zh-CN
- Source roadmap item: not applicable; direct user request

## Contract Summary

Change: harden `cc-dev` so one invocation can run the user's normal objective workflow.
Mode: plan
Profile: tiny-design
Approval: user said "继续" after the workflow migration proposal.

Goal:
- Make `cc-dev` explicitly orchestrate PDCA/IDCA with mandatory review convergence when the user requests strict autonomous development: plan or investigate, repeat `cc-review` repair cycles until no P1/P2-equivalent findings remain, implement, repeat implementation review repair cycles until clean of P1/P2-equivalent findings, then `cc-check`, then `cc-act`.
- Make local-main delivery explicit: when the user asks for local `main` merge, `cc-dev` must route `cc-act` to a real local-main merge delivery mode that rebases the work branch and fast-forward merges into the owning local `main`, without pushing unless requested.

Do Not Do:
- Do not create a new wrapper skill.
- Do not change the `cc-review` finding model or subagent implementation.
- Do not make remote PR creation the default terminal state when local merge is requested.

Source Handoff:
- Roadmap / issue / user source: current chat request.
- Repo evidence read: `.claude/skills/cc-dev/SKILL.md`, `.claude/skills/cc-dev/PLAYBOOK.md`, `.claude/skills/cc-act/SKILL.md`, `.claude/skills/cc-act/references/closure-contract.md`, `CHANGELOG.md`, `package.json`.
- Existing leverage: `cc-dev` already owns PDCA/IDCA orchestration and optional review gates; `cc-review` already supports read-only subagents and severity-style review output; `cc-act` already owns delivery modes but currently only describes local handoff, not local-main merge execution.
- Canonical language: zh-CN for user-facing contracts; skill metadata remains English where existing files use English.

Product / Creative Discovery:
- Worth doing because: the user repeats this multi-skill workflow often; encoding it in `cc-dev` reduces omission of review gates and local-main merge discipline.
- Desired product shape: a single `cc-dev` invocation behaves like the standard workflow conductor.
- Narrowest wedge: strengthen `cc-dev` contracts, checklist, and playbook; keep lower-level skills unchanged.
- 10x / better version: a future CLI/state machine could enforce the loop mechanically, but the current skill-contract layer is the fastest reliable improvement.
- Do-nothing consequence: agents may keep treating review as optional and stop at PR/local handoff instead of the requested local-main merge.
- Product confirmation rounds: current request plus "继续".

Socratic Dialogue:
- Requirement release: approved
- Technical release: approved
- Repo-answered questions:
  - Existing `cc-dev` already has PDCA/IDCA and optional review gates.
  - Existing `cc-act` already has delivery modes but not a `cc-dev` strict local-main default.
- User-answered rounds:
  - D1: user asked whether the workflow can be migrated into `cc-dev`; answer accepted by "继续".
- Dialogue Checkpoints:
  - CP-001:
    - Round range: D1
    - Next question: none
    - Decisions made: migrate into `cc-dev`, not a separate skill.
    - Rejected options and reasons: new wrapper skill rejected because it duplicates orchestration truth.
    - Remaining open questions: none blocking.
    - Evidence read: files listed above.
    - Hidden assumptions / review findings so far: strict loop needs a bounded escape condition for blocker/clarification.
    - Release status: released for implementation.
- 3 hidden assumptions challenged:
  1. "多轮 review" means repeat until no P1/P2-equivalent blocking findings, not infinite perfection.
  2. "subAgent" availability is host-dependent; `cc-dev` must prefer subagents when available and fall back to main-thread review transparently.
  3. "cc-act rebase 合并到本地 main" is a delivery-mode choice, not the universal default for PR workflows.
- Overengineering challenge: avoid adding a new process state file or wrapper skill; encode the policy in existing `cc-dev` stage discipline.
- Adversarial review findings: current `cc-dev` says review gates can be skipped for low risk, which violates this user's strict default workflow when they request it.
- Plan review findings:
  - P1: `cc-act` lacks a real local-main merge mode, so `cc-dev` cannot truthfully claim it can finish the requested local rebase/ff-only merge unless `cc-act` is in scope.
  - P2: implementation review repair loops must respect `cc-review` user-choice protocol; only mechanical or pre-authorized fixes can continue automatically.
- Explicit release phrase: "继续".

Requirement Reality:
- User / operator: user invoking `cc-dev` to run objective work end-to-end.
- Status quo workaround: manually list `cc-plan`, repeated `cc-review`, `cc-do`, repeated `cc-review`, `cc-check`, `cc-act`.
- Most painful failure: review gate gets skipped or local work is handed off without the requested local-main merge.
- Smallest success signal: `cc-dev` contract names the strict review convergence loop and local-main merge route.
- Non-goals: no runtime CLI automation, no new subagent scheduler, no remote PR default change.

Decision Questions:
| ID | Decision | Evidence | Choice | Impact |
|----|----------|----------|--------|--------|
| D1 | Move the standard workflow into `cc-dev`? | User request and existing `cc-dev` orchestration | Yes | Update `cc-dev` contract instead of adding a new skill |

Planning Flow:
| Round | Status | Evidence / decision | Opens task? |
|-------|--------|---------------------|-------------|
| Product / Creative Discovery | confirmed | Repeated user workflow should become a single `cc-dev` invocation | yes |
| Requirement Reality | confirmed | Current optional review gates are weaker than requested strict mode | yes |
| System Shape | confirmed | `.claude` is source; `.codex` is generated mirror | yes |
| Interface / Data Contract | confirmed | Skill contract text, checklist, playbook, changelog/version | yes |
| Abstraction Boundary | confirmed | `cc-dev` orchestrates; `cc-review` reviews; `cc-act` delivers | yes |
| Execution Architecture | confirmed | Edit `.claude`, sync `.codex`, verify | yes |
| Task Contract | confirmed | Three tasks: contract test, implementation, verification | yes |
| Second-Move Review | confirmed | Selected skill-contract change over new wrapper/runtime | yes |
| Final Approval | confirmed | User continued | yes |

Second-Move Review:
- First good move: add a paragraph to `cc-dev` describing the user's workflow.
- Simpler move: answer yes without changing files.
- Better architecture: add a CLI runtime state machine that enforces review loops.
- Selected move: strengthen the `cc-dev` skill contract, checklist, and playbook now; it is the smallest durable change in the current architecture.
- Rejected tradeoff: CLI enforcement is stronger but too broad for this requirement.
- Review repair decision: expand scope to `cc-act` only for the missing local-main merge delivery mode; do not weaken `cc-review` implementation repair choice requirements.

Approved Direction:
- Add a strict-review workflow mode to `cc-dev` that is selected when the user asks for repeated review/subAgent convergence or local-main merge closeout.
- Record that P1/P2-equivalent findings are `critical`/`important` cc-review findings, explicit must-fix findings, or blocking missing evidence.
- Require each review pass to end cleanly before moving to the next stage; if findings remain, route to `cc-plan`/`cc-do` as appropriate and review again after repair.
- For implementation findings that require a product/architecture/user tradeoff, `cc-dev` must stop as `needs-clarification` through the shared user-choice protocol instead of auto-repairing.
- Add `local-main-merge` to `cc-act` as a real delivery mode: rebase the work branch on current local `main`, fast-forward merge from the owning main checkout, verify local `main` contains the work branch, and never push unless explicitly requested.

User Stories:
| ID | Actor | Story | Acceptance | Edge / recovery |
|----|-------|-------|------------|-----------------|
| US-001 | Operator | Invoke `cc-dev` once for the normal workflow | `cc-dev` states the strict PDCA/IDCA review loop | If subagents unavailable, fallback is explicit |
| US-002 | Operator | Ask for local-main closeout | `cc-act` has a real `local-main-merge` mode and `cc-dev` routes to it | If main is dirty/diverged, block instead of mutating |

Engineering Review Gate:
- Existing leverage map: `cc-dev` Stage Discipline and checklist own the affected policy.
- Scope challenge: two skill families (`cc-dev`, `cc-act`) plus changelog/version; no new runtime.
- Interface depth: keep lower-level skill interfaces unchanged.
- Test seam: verify skill mirror parity and publish validation.
- Mock boundary: none.
- Feedback loop: `npm run adapt:codex`, `npm run verify:publish`, `npm run benchmark:skills`.
- Confidence per minute: high; contract change is validated by packaged skill checks and direct file diff.

Test Strategy Shape:
- Suite layer: publish/config validation and skill benchmark.
- Expected command / runtime: local npm scripts, seconds.
- Proof value: catches broken frontmatter, unsynced Codex mirror, missing packaged files, and oversized skill regression.
- Fixture / mock boundary: real repo files.
- Low-value tests to avoid: no new snapshot for prose-only wording.
- Focused suite shape: adapt check plus publish validation.

ASCII Branch Chain Analysis:
Language rule: keep connector tokens ASCII; write node labels and evidence text in `Output language`.

```text
需求影响链
需求: 用 cc-dev 一次性执行常规目标工作流
|-- 上游来源: 用户要求迁移手动 cc-plan/review/do/review/check/act 链路
|-- 当前代码路径: .claude/skills/cc-dev/SKILL.md
|   |-- 调用方: Codex/Claude 读取 cc-dev 技能合同
|   |-- 数据或状态: Stage Discipline, exit_criteria, checklist, cc-act delivery modes
|   `-- 最深影响层: agent workflow contract + delivery mode contract
|-- 必要变更: 将 optional review gate 强化为 strict convergence mode，并补齐 local-main-merge 交付模式
`-- 验证缝隙: adapt:codex + publish validation + skill benchmark

业务影响链
结果: operator 少写多段工作流且减少漏审
|-- 直接行为影响: cc-dev 知道何时必须多轮 review 到无 P1/P2
|-- 下游影响: .codex 镜像、npm package、下游安装 skill
|-- 风险分支: 过度默认 local merge 会破坏 PR 工作流；自动修复 review finding 会绕过选择协议
`-- 非目标分支: 不替换 cc-review/cc-act 的内部职责
```

Acceptance:
- `.claude/skills/cc-dev/SKILL.md` describes strict review convergence mode and routes local-main requests to `cc-act`.
- `.claude/skills/cc-dev/PLAYBOOK.md` and checklist align with the stricter workflow.
- `.claude/skills/cc-act/SKILL.md`, playbook/checklist, and closure contract describe `local-main-merge` as a real delivery mode with rebase + fast-forward merge evidence.
- `.codex/skills/cc-dev/*` and `.codex/skills/cc-act/*` mirror generated source after adaptation.
- Changelog/version updates follow skill maintenance protocol.

Verification:
- `npm run adapt:codex`
- `npm run verify:publish`
- `npm run benchmark:skills`

Risk / Escalate If:
- Validation shows version/changelog drift.
- Local-main closeout wording conflicts with `cc-act` delivery-mode choice.
- Benchmark shows skill entrypoint too large.

## Failure Ledger

| ID | Source | Trigger | Escape class | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |
|----|--------|---------|--------------|---------|----------|---------------|--------|------------------|--------|---------------------|

## Execution Protocol

ClaudeCode / Codex 执行本计划时，必须把 `task.md` 当成唯一任务合同。

- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`.
- Stage commit rule: when Plan, Do, Check, or Act finishes, commit the completed stage to Git.
- Runtime file ban: do not generate process files beyond this `task.md`.

## Task Contract Matrix

| Task | User / edge story | Interface / method | File owner / responsibility | Do not re-decide | Verification evidence |
|------|-------------------|--------------------|-----------------------------|------------------|-----------------------|
| T001 | US-001 / strict workflow | cc-dev contract | `.claude/skills/cc-dev/SKILL.md`, `PLAYBOOK.md`, checklist | no wrapper skill | diff + review |
| T002 | US-002 / local-main closeout | cc-dev -> cc-act route | `.claude/skills/cc-dev/*`, `.claude/skills/cc-act/*`, `.codex/skills/cc-dev/*`, `.codex/skills/cc-act/*`, changelogs | no push default | adapt/publish validation |
| T003 | release-surface proof | npm validation | package/changelog/version surfaces | no new process files | npm commands |

## Phase 1: Foundation

- [ ] T001 [TEST] Review current cc-dev contract gap
  Goal: prove the current wording only has optional review gates and no strict P1/P2 convergence loop.
  Contract: user stories `US-001` and `US-002`.
  Do not re-decide: migrate into `cc-dev`.
  TDD phase: red by contract inspection.
  Suite layer / runtime: static contract review.
  Confidence value: catches the exact workflow omission.
  Fixture/mock boundary: real skill files.
  Low-value tests to avoid: prose snapshot.
  Files: `.claude/skills/cc-dev/SKILL.md`, `.claude/skills/cc-dev/PLAYBOOK.md`
  Read first: `task.md`, current skill files.
  Verification: `rg -n "strict|P1|P2|fast-forward|local main" .claude/skills/cc-dev`
  Evidence: missing or incomplete output before implementation.
  Public verification path: distributed skill text.

- [ ] T002 [IMPL] Harden cc-dev strict workflow contract
  Goal: make the standard workflow executable from `cc-dev`.
  Contract: strict review convergence and local-main delivery route.
  Do not re-decide: lower-level skill ownership boundaries.
  TDD phase: green.
  Suite layer / runtime: static contract + generated mirror.
  Confidence value: agents reading `cc-dev` can run the workflow without manual skill list.
  Fixture/mock boundary: real skill files.
  Low-value tests to avoid: copying all `cc-review` internals into `cc-dev`.
  Files: `.claude/skills/cc-dev/SKILL.md`, `.claude/skills/cc-dev/PLAYBOOK.md`, `.claude/skills/cc-dev/references/checklist-contract.md`, `.claude/skills/cc-act/SKILL.md`, `.claude/skills/cc-act/PLAYBOOK.md`, `.claude/skills/cc-act/references/checklist-contract.md`, `.claude/skills/cc-act/references/closure-contract.md`, generated `.codex/skills/cc-dev/*`, generated `.codex/skills/cc-act/*`, `CHANGELOG.md`, `.claude/skills/cc-dev/CHANGELOG.md`, `.claude/skills/cc-act/CHANGELOG.md`
  Read first: `task.md`, current skill files.
  Verification: `npm run adapt:codex && npm run verify:publish`
  Evidence: command output and diff.
  Public verification path: `.codex/skills/cc-dev/SKILL.md` mirrors source.

- [ ] T003 [CHECK] Verify and close local-main workflow change
  Goal: prove packaged skill surfaces are coherent.
  Contract: validation commands pass and no unrelated files are touched.
  Do not re-decide: no remote PR unless requested.
  TDD phase: check.
  Suite layer / runtime: publish validation and skill benchmark.
  Confidence value: catches packaging drift and large skill regressions.
  Fixture/mock boundary: real repo.
  Low-value tests to avoid: broad `npm test` unless validation indicates runtime code touched.
  Files: current diff.
  Read first: `git diff --stat`, changed files.
  Verification: `npm run verify:publish && npm run benchmark:skills`
  Evidence: exit 0 and relevant output.
  Public verification path: npm packaged file list validation.
