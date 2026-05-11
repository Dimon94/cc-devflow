---
name: cc-pr-land
version: 1.0.0
description: Use in a separate session to land one or more reviewed GitHub PRs into main with review-first, rebase-first discipline. It refreshes live PR truth, rebases each PR onto the evolving mainline, resolves conflicts without shrinking requirements, re-reviews after conflict resolution, pushes cleaned PR heads when needed, fast-forwards main, verifies local/remote parity, and cleans temporary branches. It must not implement new feature scope.
triggers:
  - 合并这个 PR
  - 单独会话合并 PR
  - land this PR
  - merge reviewed PRs
  - review and land open PRs
  - rebase PRs onto main
reads:
  - ../cc-pr-review/SKILL.md
  - ../cc-review/SKILL.md
  - ../cc-check/SKILL.md
  - GitHub pull requests
  - devflow/changes/<change-key>/review/report-card.json
writes:
  - path: GitHub pull request head branch
    durability: remote
    required: false
    when: the PR branch must be rebased or conflict fixes must be pushed back
  - path: origin/main
    durability: remote
    required: true
    when: landing succeeds
effects:
  - review-first PR landing
  - rebase-first mainline integration
  - local and remote main parity proof
entry_gate:
  - Fetch live GitHub PR truth; do not rely on stale local refs or cached queue state.
  - Require prior review truth or perform a review pass before landing.
  - Create only temporary integration/helper branches as needed; do not open new feature worktrees as product work.
  - Rebase onto the evolving integration mainline, not stale origin/main.
  - Stop when conflict resolution would require product intent guessing.
exit_criteria:
  - Each landed PR was reviewed before landing and re-reviewed after material rebase or conflict resolution.
  - Requirement shrinkage after conflict resolution is explicitly rejected or ruled out.
  - Remote main, local main, and the active main worktree parity are verified.
  - Open PR queue state is refreshed after landing when the task was to clear the queue.
  - Temporary branches or integration worktrees created by cc-pr-land are cleaned up or reported.
reroutes:
  - when: The PR has unreviewed implementation risk or stale review evidence.
    target: cc-pr-review
  - when: Conflict resolution reveals missing implementation or broken requirements.
    target: cc-dev
  - when: Mainline parity cannot be proven because GitHub, auth, or network truth is unavailable.
    target: stop
recovery_modes:
  - name: queue-changed
    when: The live open PR set changes during landing.
    action: Stop, refresh the queue, and recalculate the landing order before continuing.
  - name: requirement-shrinkage-risk
    when: A conflict resolution makes the PR smaller or removes user-facing behavior, tests, or docs.
    action: Re-review the resolved diff and stop for user decision if intent is unclear.
  - name: parity-failure
    when: local main, active main worktree, and origin/main do not match after landing.
    action: Diagnose without force reset; preserve local work and repair through fetch/rebase/ff-only sync.
tool_budget:
  read_files: 12
  search_steps: 8
  shell_commands: 18
---

# CC-PR-Land

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、公开文档和分发配置，然后检查 `CLAUDE.md`

## Role

`cc-pr-land` 是远程 PR 的落主干入口。它回答：

```text
这些已经 review 的 PR 是否可以线性落到 main，并证明本地远程一致？
```

它不做新需求开发。发现需要新代码，回 `cc-dev`。

## Read First

1. Live GitHub PR truth
2. `../cc-pr-review/SKILL.md`
3. `../cc-review/SKILL.md`
4. `../cc-check/SKILL.md`
5. Linked change artifacts when available

## Use This Skill When

- 一个或多个 PR 已 review，准备合并。
- 用户要求 review-first / rebase-first 落主干。
- 用户要求清空 open PR 队列并证明 main parity。

如果 PR 还没 review，先去 `cc-pr-review`。

## Harness Contract

- Allowed actions: refresh PR truth, verify prior review, rebase PR branches, resolve conflicts, re-review resolved diffs, push cleaned PR heads, fast-forward main, verify parity, and clean temporary integration state.
- Forbidden actions: implement new feature scope, silently drop requirements, force-push main, rely on stale PR refs, or declare parity without remote proof.
- Required evidence: PR list, review status, commit ranges, conflict resolutions, validation commands, remote main SHA, local main SHA, and active main worktree SHA when available.
- Reroute rule: unreviewed PRs go to `cc-pr-review`; requirement or implementation gaps go to `cc-dev`; unavailable GitHub truth stops landing.

## Landing Order

1. Fetch live PR truth.
2. Record PR number, title, head, base, review state, checks, and linked change.
3. For each PR:
   - confirm review exists or run/re-route to `cc-pr-review`
   - separate true PR commits from base drift
   - rebase onto the evolving integration mainline
   - resolve conflicts without shrinking requirements
   - re-review if the rebase or conflict resolution changed behavior
   - push cleaned PR head with `--force-with-lease` when the PR branch changed
   - fast-forward the integration branch
4. Validate integrated result.
5. Push or fast-forward main.
6. Verify parity.
7. Clean temporary state.

## Conflict Rule

Conflict resolution is not a place to redesign the product.

After every conflict:

- compare before vs after intent
- check tests and docs were not silently dropped
- rerun targeted verification
- re-review resolved files

If you cannot distinguish better upstream implementation from accidental requirement loss, stop and ask.

## Parity Proof

Do not declare done until these are true or explicitly blocked:

```text
origin/main SHA: <sha>
local main SHA: <sha>
active main worktree SHA: <sha or not-applicable>
open PR queue: <empty or remaining list>
```

Use ff-only sync. Do not force reset user work.

## Output

Report:

- PRs landed
- PRs skipped and why
- review evidence used
- conflicts and requirement-shrinkage verdict
- validation commands
- final remote/local main SHA
- open PR queue state
- cleanup actions
