# REQ-004 detect worktree state helper

## Plan Meta

- CC-Plan skill version: direct cc-dev execution
- Work branch: `REQ/004-detect-worktree-state-helper`
- Output language: zh-CN
- Source roadmap item: none; user-directed workflow optimization

## Contract Summary

Change: add a standalone worktree-state helper and make change-worktree preparation consume it.
Mode: plan/do/check
Approval: user selected "独立 helper" after comparing the external worktree mechanism.

Goal:
- Keep environment detection separate from REQ/FIX worktree creation and exact-case branch anchoring.
- Detect primary checkout, linked worktree, submodule, current branch state, and primary branch without mutating Git state.
- Preserve the existing invariant: main checkout stays on `main`; new REQ/FIX work happens in isolated worktrees.

Do Not Do:
- Do not make `ensure-work-branch.sh` create worktrees.
- Do not fall back to working on `main` when worktree preparation is unsafe.
- Do not touch unrelated dirty files in the primary checkout.

Decision Questions:
| ID | Decision | Evidence | Choice | Impact |
|----|----------|----------|--------|--------|
| D1 | Helper boundary | User: "应该作为一个独立 helper" | standalone helper | Detection, preparation, and branch anchoring stay separate |

Second-Move Review:
- First good move: put more detection branches into `prepare-change-worktree.sh`.
- Simpler move: only document that agents should inspect `git worktree list`.
- Better architecture: standalone detector with stable `KEY=value` output consumed by preparation scripts.
- Selected move: standalone detector plus targeted tests.
- Rejected tradeoff: fallback to in-place work when isolation creation is unsafe.

Acceptance:
- A new helper reports primary, linked, and submodule state without mutation.
- `prepare-change-worktree.sh` uses the helper and refuses nested preparation from the wrong linked worktree.
- Existing branch anchoring behavior still passes.

Verification:
- `npx jest test/cc-dev-work-branch.test.js --runInBand`
- `npm run adapt:codex`
- `npm run adapt:check`
- `npm run verify:examples`
- `npm run verify:publish`
- `git diff --check`

## Task Contract Matrix

| Task | User / edge story | Interface / method | File owner / responsibility | Do not re-decide | Verification evidence |
|------|-------------------|--------------------|-----------------------------|------------------|-----------------------|
| T001 | Agent needs preflight truth | `detect-worktree-state.sh` | helper owns read-only state reporting | standalone helper | Jest helper tests |
| T002 | Agent starts from main | `prepare-change-worktree.sh` | preparation owns create/reuse and policy checks | no main fallback | existing and new Jest tests |
| T003 | Maintainer ships skill update | `.claude` source plus generated adapters | package scripts own parity | `.claude` source first | adapt/publish checks |

## Phase 1: Foundation

- [x] T001 [TEST] Cover standalone worktree detection in `test/cc-dev-work-branch.test.js`.
- [x] T002 [IMPL] Add `detect-worktree-state.sh` and consume it from `prepare-change-worktree.sh`.
- [x] T003 [CHECK] Run targeted Jest plus adapter/publish validation.

## Completion Evidence

- `npx jest test/cc-dev-work-branch.test.js --runInBand`: 11 passed.
- `npm run adapt:codex`: completed.
- `npm run adapt:check`: no drift detected.
- `npm run verify:examples`: example bindings in sync.
- `npm run verify:publish`: `validate-publish: ok`.
- `npm test -- --runInBand`: 30 suites / 254 tests passed.
- `git diff --check`: passed.

Follow-up:
- User asked whether `cc-plan` and `cc-investigate` should also be optimized.
- Updated both entry contracts to read `detect-worktree-state.sh` before worktree preparation.
- Preserved the same blocker model: submodule entry, wrong linked worktree, case collision, or target branch mismatch blocks setup instead of falling back to `main`.
- `npm run adapt:codex`: completed after the entry contract updates.
- `npm run adapt:check`: no drift detected.
- `npm run verify:examples`: example bindings in sync after bumping `cc-plan`, `cc-investigate`, and `cc-dev` bindings.
- `npm run verify:publish`: `validate-publish: ok`.
- `npx jest test/cc-dev-work-branch.test.js --runInBand`: 11 passed.
- `npm test -- --runInBand`: 30 suites / 254 tests passed.
- `git diff --check`: passed.
