# TASKS

## Plan Meta

- CC-Plan skill version: `3.10.4`
- Work branch: `REQ/003-isolate-main-checkout-with-worktrees`
- Worktree path: `/Users/dimon/.codex/worktrees/REQ-003-isolate-main-checkout-with-worktrees/cc-devflow`
- Main checkout path: `/Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow`
- Output language: zh-CN
- Source roadmap item: none; user-directed workflow optimization

## Contract Summary

Change: keep the main checkout bound to `main` and force `cc-plan` / `cc-investigate` work into isolated change worktrees before branch anchoring.
Mode: plan
Profile: full-design
Approval: user approved the direction in chat on 2026-05-17; no additional decision question needed before task generation.

Goal:
- Make `main` a stable trunk checkout for sync, parity, and observation.
- When a new `REQ` or `FIX` starts, create or reuse a separate Git worktree, bind that worktree to `REQ/<id>` or `FIX/<id>`, then continue planning or investigation only inside that path.
- Encode the behavior in source `.claude` skills and scripts, then regenerate `.codex` so future agents follow the same contract.

Do Not Do:
- Do not switch the primary project folder away from `main`.
- Do not rely on chat-only advice for worktree isolation.
- Do not hand-edit `.codex` before changing `.claude`; `.codex` is generated output.
- Do not add broad workflow state files beyond this `task.md`.
- Do not solve this by adding more manual warnings while the executable entrypoint remains ambiguous.

Source Handoff:
- Roadmap / issue / user source: user requested a trunk-and-stump worktree model where the main folder stays on `main` and each demand or bug gets its own worktree plus branch.
- Repo evidence read: `.claude/skills/cc-dev/scripts/ensure-work-branch.sh`, `.claude/skills/cc-plan/SKILL.md`, `.claude/skills/cc-investigate/SKILL.md`, `.claude/skills/cc-dev/SKILL.md`, `.claude/skills/cc-dev/PLAYBOOK.md`, `test/cc-dev-work-branch.test.js`, `package.json`.
- Existing leverage: `ensure-work-branch.sh` already validates canonical `REQ/FIX` branch names and case collisions; `test/cc-dev-work-branch.test.js` already has the correct test seam for Git fixture behavior; `npm run adapt:codex` and `npm run adapt:check` already enforce generated mirror parity.
- Canonical language: main checkout, change worktree, work branch, trunk checkout, `REQ/<id>`, `FIX/<id>`, Worktree Isolation Contract.

Product / Creative Discovery:
- Worth doing because: the current workflow can leave agents blocked on `main` or tempt them to switch the main checkout, which breaks the user's desired multi-change parallel model.
- Desired product shape: starting `cc-plan` or `cc-investigate` from the main checkout should lead to an isolated worktree path and canonical branch before durable artifacts are written.
- Narrowest wedge: one reusable script plus skill-contract updates for `cc-plan` and `cc-investigate`; existing branch validator remains the low-level anchor.
- 10x / better version: a future Codex App integration can automatically reopen the conversation in the new worktree, but the repository-level deliverable is a deterministic local command contract.
- Do-nothing consequence: the main checkout continues to be a mutable work surface, and parallel `REQ/FIX` development stays dependent on memory instead of tooling.
- Product confirmation rounds: user already supplied the target model and requested immediate self-iteration.

Requirement Reality:
- User / operator: coding agent or human operator starting a new `REQ` / `FIX` from the primary project folder.
- Status quo workaround: manually create a worktree or start from a detached setup point before running `ensure-work-branch.sh`.
- Most painful failure: the main project folder switches away from `main`, making sync, PR landing, and parallel work unreliable.
- Smallest success signal: a test proves a main checkout stays on `main` while a sibling worktree is created on `REQ/003-isolate-main-checkout-with-worktrees` style branch.
- Non-goals: no GitHub branch protection, no PR landing automation change, no Codex App UI workspace switching, no cleanup of existing prunable `/private/tmp` worktrees.

Decision Questions:
| ID | Decision | Evidence | Choice | Impact |
|----|----------|----------|--------|--------|
| D1 | Main checkout isolation policy | User explicitly described the trunk-and-stump model and rejected main-folder branch switching | Create/reuse separate worktree before branch anchoring | `cc-plan` / `cc-investigate` contract changes from "anchor current worktree" to "prepare isolated worktree, then anchor" |

Planning Flow:
| Round | Status | Evidence / decision | Opens task? |
|-------|--------|---------------------|-------------|
| Product / Creative Discovery | confirmed | User wants multi-demand and multi-bug parallelism with main permanently on `main` | yes |
| Requirement Reality | confirmed | Current `ensure-work-branch.sh` refuses `main` but does not create a separate path | yes |
| System Shape | confirmed | Low-level branch validation belongs in `ensure-work-branch.sh`; new orchestration belongs in a separate script used by `cc-plan` / `cc-investigate` | yes |
| Interface / Data Contract | confirmed | New script should accept `--change-key`, optional `--worktrees-root`, optional `--base`, and print `WORKTREE_PATH` / `WORK_BRANCH` | yes |
| Abstraction Boundary | confirmed | Keep Git worktree creation in one script; keep skill prose as thin entry protocol; do not spread shell snippets across skills | yes |
| Execution Architecture | confirmed | Red test in existing Git fixture suite, Green script and skill updates, generated mirror parity, publish validation | yes |
| Task Contract | confirmed | Tasks are vertical: test isolated worktree behavior, implement script, update contracts, regenerate/verify | yes |
| Second-Move Review | confirmed | Selected reusable script over prose-only or overloading branch anchor | yes |
| Final Approval | confirmed | User asked to start using `cc-plan` with the new scheme for this optimization | yes |

Second-Move Review:
- First good move: update `cc-plan` and `cc-investigate` prose to say "create worktree first." This is weak because prose cannot prove the main checkout stayed on `main`.
- Simpler move: change `ensure-work-branch.sh` so it errors with a clearer message on `main`. This preserves the blocker but does not deliver the desired automatic stump worktree path.
- Better architecture: add a `prepare-change-worktree.sh` wrapper that creates or reuses a sibling worktree, then delegates branch validation to `ensure-work-branch.sh`; skills call the wrapper at entry.
- Selected move: implement the wrapper plus contract updates because it removes the special human step and keeps branch validation small.
- Rejected tradeoff: do not make `ensure-work-branch.sh` both create worktrees and switch branches; that would make one script handle two responsibilities and obscure failure modes.

Approved Direction:
- Add a new worktree-preparation script under `.claude/skills/cc-dev/scripts/`.
- Keep `ensure-work-branch.sh` as the exact-case branch anchor for the current worktree.
- Update `cc-plan` and `cc-investigate` to use the preparation script immediately after `next-change-key`.
- Update `cc-dev` only where its stage discipline currently says the current worktree should be anchored directly.
- Regenerate `.codex` from `.claude` and validate parity.

ASCII Framework:

```text
cc-devflow main checkout
  /Users/dimon/.../cc-devflow
  branch: main
  role: sync, parity, observation
          |
          | next-change-key -> REQ-003 / FIX-014
          v
  prepare-change-worktree.sh
          |
          +-- creates/reuses sibling path
          |     /Users/dimon/.codex/worktrees/REQ-003-xxx/cc-devflow
          |
          +-- binds exact branch
                REQ/003-xxx or FIX/014-yyy
                |
                +-- cc-plan writes task.md
                +-- cc-investigate writes task.md
                +-- cc-do changes code
                +-- cc-check verifies
                +-- cc-act pushes PR
```

User Stories:
| ID | Actor | Story | Acceptance | Edge / recovery |
|----|-------|-------|------------|-----------------|
| US-001 | Agent starting `cc-plan` from main | I get moved into an isolated worktree before task artifacts are written | Main checkout remains on `main`; new worktree owns `REQ/<id>` | Existing matching worktree is reused |
| US-002 | Agent starting `cc-investigate` from main | I get a `FIX/<id>` worktree without touching the trunk checkout | Main checkout remains on `main`; investigation branch is exact-case | Case-collision still fails closed |
| US-003 | Maintainer publishing skills | Generated `.codex` matches `.claude` after the contract update | `adapt:check`, examples, publish validation pass | Drift blocks shipping |

Engineering Review Gate:
- Existing leverage map: reuse `test/cc-dev-work-branch.test.js`, `ensure-work-branch.sh`, `.claude` source skills, adapter parity scripts, and publish validator.
- Scope challenge: expected write surface is under 8 files: one test, one new script, three source skill/playbook files, generated `.codex` mirrors, and examples only if validation requires them.
- Interface depth: public interface is one concrete script, not a generic workflow manager.
- Test seam: temp Git repositories in Jest prove real worktree and branch behavior through public Git commands.
- Mock boundary: no internal mocks; only temp filesystem and real Git commands.
- Feedback loop: `npx jest test/cc-dev-work-branch.test.js --runInBand` first, then adapter and publish gates.

Acceptance:
- From a fixture repo on `main`, the preparation script creates a sibling worktree on `REQ/<id>` and leaves the original checkout on `main`.
- Re-running for the same change key reuses the same worktree without creating conflicting branches.
- Existing exact-case and case-collision protections remain covered.
- `cc-plan` and `cc-investigate` document the isolated worktree contract as the required entry path before `task.md`.
- `.codex` mirrors `.claude` after regeneration.

Verification:
- `npx jest test/cc-dev-work-branch.test.js --runInBand`
- `npm run adapt:codex`
- `npm run adapt:check`
- `npm run verify:examples`
- `npm run verify:publish`
- `git diff --check`

Risk / Escalate If:
- Escalate if Git worktree path choice requires product approval beyond deterministic `.codex/worktrees/<change-key>/cc-devflow` or a caller-supplied `--worktrees-root`.
- Escalate if branch creation from local `main` would include unpushed main commits and the user wants origin-only branch bases.
- Escalate if Codex App cannot continue the same chat in the new path; repo contract can still print the required path as the operator handoff.

## Execution Protocol

ClaudeCode / Codex 执行本计划时，必须把 `task.md` 当成唯一任务合同。

- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`; if it cannot prove `next-change-key`, stop blocked.
- Task selection: use `scripts/select-ready-tasks.sh --tasks devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md`.
- Completion: after Red/Green/Refactor evidence and review pass, run `scripts/mark-task-complete.sh --tasks devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md --task <task-id>`.
- Stage commit rule: when PDCA or IDCA finishes in the current environment, commit the completed stage to Git.
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
bash "$SCRIPT_ROOT/select-ready-tasks.sh" --tasks devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md
bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md --task <task-id>
```

## Task Contract Matrix

| Task | User / edge story | Interface / method | File owner / responsibility | Do not re-decide | Verification evidence |
|------|-------------------|--------------------|-----------------------------|------------------|-----------------------|
| T001 | US-001 / main checkout remains trunk | `prepare-change-worktree.sh` called from temp repo main | `test/cc-dev-work-branch.test.js` owns behavior proof | main isolation, branch name shape | failing Jest output |
| T002 | US-001 / create or reuse isolated worktree | shell script creates worktree and delegates branch validation | `.claude/skills/cc-dev/scripts/prepare-change-worktree.sh` owns orchestration | wrapper name and stdout fields | passing Jest output |
| T003 | US-002 / skills use worktree isolation contract | skill entry gates and operating loops | `.claude/skills/cc-plan`, `.claude/skills/cc-investigate`, `.claude/skills/cc-dev` own public contract | `.claude` source first | source diff plus generated parity |
| T004 | US-003 / distribution mirrors source | adapter regeneration | `.codex/skills/**` generated mirror | no hand edits to `.codex` | `adapt:check`, examples, publish validation |

## Phase 1: Worktree Preparation Behavior

- [ ] T001 [TEST] Add failing isolated worktree preparation coverage (dependsOn:none) `test/cc-dev-work-branch.test.js`
  Goal: Prove that starting from `main` creates a sibling worktree on the canonical `REQ/<id>` branch and leaves the original checkout on `main`.
  Contract: user story `US-001`; method/interface `.claude/skills/cc-dev/scripts/prepare-change-worktree.sh --change-key REQ-003-isolate-main-checkout-with-worktrees --worktrees-root <tmpdir>`.
  Do not re-decide: trunk checkout must stay on `main`; branch must be exact-case; output must include `WORKTREE_PATH` and `WORK_BRANCH`.
  TDD phase: red
  Files: `test/cc-dev-work-branch.test.js`
  Read first: `task.md`, existing work-branch tests
  Verification: `npx jest test/cc-dev-work-branch.test.js --runInBand`
  Evidence: failing output because the preparation script does not exist yet.
  Completion: after failing evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md --task T001`.
  Public verification path: real Git fixture repo, real `git worktree list`, real branch checks.
  Ready when: no upstream dependency exists.

- [ ] T002 [IMPL] Implement the change worktree preparation script (dependsOn:T001) `.claude/skills/cc-dev/scripts/prepare-change-worktree.sh`
  Goal: Create or reuse the isolated worktree, then run `ensure-work-branch.sh` inside it so branch validation remains centralized.
  Contract: user story `US-001`; method/interface `prepare-change-worktree.sh --change-key <REQ/FIX-...> [--base main] [--worktrees-root <path>]`.
  Do not re-decide: keep `ensure-work-branch.sh` responsible for exact-case branch validation; wrapper only owns path creation/reuse and machine-readable output.
  TDD phase: green
  Files: `.claude/skills/cc-dev/scripts/prepare-change-worktree.sh`, `test/cc-dev-work-branch.test.js`
  Read first: `task.md`, `ensure-work-branch.sh`, T001 failing output
  Verification: `npx jest test/cc-dev-work-branch.test.js --runInBand`
  Evidence: passing worktree preparation tests and unchanged existing anchor tests.
  Completion: after green evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md --task T002`.
  Public verification path: temp repo main branch remains `main`; created worktree reports `REQ/003-isolate-main-checkout-with-worktrees`.
  Ready when: T001 has failing evidence.

## Phase 2: Skill Contract Propagation

- [ ] T003 [IMPL] Update cc-plan, cc-investigate, and cc-dev entry contracts (dependsOn:T002) `.claude/skills/cc-plan/SKILL.md`
  Goal: Make new planning and investigation flows call the worktree-preparation script before writing durable artifacts.
  Contract: user stories `US-001`, `US-002`; method/interface skill entry gates and operating loops name the new script and required path handoff.
  Do not re-decide: `.claude` remains source of truth; `cc-plan` and `cc-investigate` must not instruct direct branch switching in the main checkout.
  TDD phase: green
  Files: `.claude/skills/cc-plan/SKILL.md`, `.claude/skills/cc-investigate/SKILL.md`, `.claude/skills/cc-dev/SKILL.md`, `.claude/skills/cc-dev/PLAYBOOK.md`
  Read first: `task.md`, current skill contracts, passing T002 output
  Verification: `npx jest test/cc-dev-work-branch.test.js --runInBand`
  Evidence: source contract diff plus passing worktree behavior tests.
  Completion: after source contract and tests pass, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md --task T003`.
  Public verification path: skill text instructs preparation from main to isolated worktree before `task.md`.
  Ready when: T002 is green.

- [ ] T004 [VERIFY] Regenerate Codex mirror and run distribution gates (dependsOn:T003) `.codex/skills/cc-plan/SKILL.md`
  Goal: Propagate the source contract to generated Codex skills and prove publish/example surfaces are coherent.
  Contract: user story `US-003`; method/interface adapter output and validation scripts.
  Do not re-decide: do not hand-maintain `.codex`; use adapter generation only.
  TDD phase: evidence
  Files: `.codex/skills/cc-plan/**`, `.codex/skills/cc-investigate/**`, `.codex/skills/cc-dev/**`, generated metadata if adapter updates it
  Read first: `task.md`, source diffs from T003
  Verification: `npm run adapt:codex && npm run adapt:check && npm run verify:examples && npm run verify:publish && git diff --check`
  Evidence: adapter parity, example validation, publish validation, and diff hygiene output.
  Completion: after verification evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md --task T004`.
  Public verification path: generated `.codex` skills match `.claude` source.
  Ready when: T003 source contract is complete.

## Phase 3: Plan Closeout

- [ ] T005 [VERIFY] Commit the Plan stage and hand off to cc-do (dependsOn:T004) `devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md`
  Goal: Record this frozen plan in Git so implementation can resume from repository truth.
  Contract: plan-stage commit contains only this `task.md`.
  Do not re-decide: implementation belongs to `cc-do`; this task closes `cc-plan`.
  TDD phase: evidence
  Files: `devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md`
  Read first: `task.md`
  Verification: `git status --short && git diff --check`
  Evidence: clean plan diff, staged task file, plan commit hash.
  Completion: Plan-stage commit.
  Public verification path: Git history on `REQ/003-isolate-main-checkout-with-worktrees`.
  Ready when: task plan is frozen.

## Task Quality Bar

- Every behavior task must prove user-visible workflow behavior through Git commands or generated skill output.
- No test may assert private shell implementation details when public stdout, branch state, and worktree list are available.
- No implementation task may switch the primary checkout away from `main`.
- Any new branch/worktree path behavior must be deterministic and recoverable if the target worktree already exists.
