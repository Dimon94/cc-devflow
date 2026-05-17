# PR Brief

## Change

- Change key: `REQ-003-isolate-main-checkout-with-worktrees`
- Branch: `REQ/003-isolate-main-checkout-with-worktrees`
- Head: current `REQ/003-isolate-main-checkout-with-worktrees` branch head

## Task Summary

- Added an isolated change-worktree entrypoint so new `REQ` / `FIX` work can start from the main checkout without switching the main directory away from `main`.
- Kept exact-case work-branch validation in `ensure-work-branch.sh` and delegated to it from the new preparation script.
- Updated `cc-dev`, `cc-plan`, and `cc-investigate` source contracts plus generated Codex parity and examples.
- Completed `T001` through `T005` in `devflow/changes/REQ-003-isolate-main-checkout-with-worktrees/task.md`.

## Recent Commits

- `2932207` fix(cc-dev): 防止工作分支大小写碰撞
- `dc50258` docs(plan): 冻结主目录工作树隔离方案
- `7d62f19` test(cc-dev): 覆盖主目录工作树隔离
- `25c4efe` feat(cc-dev): 准备独立需求工作树
- `9aaf9eb` docs(skills): 固化主目录工作树隔离契约
- `6f16590` docs(examples): 同步工作树隔离技能版本
- `5db49f2` chore(task): 完成工作树隔离执行任务
- `329f448` chore(check): 验证主目录工作树隔离
- current head: docs(act): 添加工作树隔离 PR 交接

## Current Diff

- Adds `.claude/skills/cc-dev/scripts/prepare-change-worktree.sh`.
- Expands `test/cc-dev-work-branch.test.js` with public Git worktree behavior coverage.
- Updates source skill contracts/changelogs for `cc-dev`, `cc-plan`, and `cc-investigate`.
- Updates example bindings and task examples to the new skill versions.
- Adds the durable `task.md` for this REQ.
- Adds the PR handoff brief used to create this PR.

## Validation

- Command: `npm run adapt:codex`
  Result: exit 0
  Key observation: Codex surface regenerated with 15 skills registered.
- Command: `npm run adapt:check`
  Result: exit 0
  Key observation: no generated-surface drift detected.
- Command: `npm run verify:examples`
  Result: exit 0
  Key observation: example bindings match current skill versions.
- Command: `npm run verify:publish`
  Result: exit 0
  Key observation: publish validator returned `validate-publish: ok`.
- Command: `npx jest test/cc-dev-work-branch.test.js --runInBand`
  Result: exit 0
  Key observation: 4 tests passed, including change-worktree creation, main-checkout isolation, exact-case branch anchoring, default-branch block, and case-collision fail-closed.
- Command: `git diff --check`
  Result: exit 0
  Key observation: no diff hygiene errors.

## PR Body Draft

```markdown
## Summary

- Add `prepare-change-worktree.sh` so new REQ/FIX work creates or reuses an isolated worktree before branch anchoring.
- Keep the main checkout bound to `main` and update `cc-dev`, `cc-plan`, and `cc-investigate` contracts to route work into the returned `WORKTREE_PATH`.
- Add Git-backed regression coverage and sync example skill versions.

## Validation

- `npm run adapt:codex`
- `npm run adapt:check`
- `npm run verify:examples`
- `npm run verify:publish`
- `npx jest test/cc-dev-work-branch.test.js --runInBand`
- `git diff --check`

## Risk / Rollback

- Risk is limited to workflow scripts and skill contracts.
- Rollback by reverting this PR; existing `ensure-work-branch.sh` branch anchoring remains isolated in its own script.
```
