# CC-PR-Land Playbook

## Visible State Machine

`reviewed remote PRs -> cc-pr-land -> main parity | cc-pr-review | cc-dev | stop`

- Enter from: `cc-pr-review` approval, PR URL, PR number, or user request to land reviewed PRs.
- Stay in: `cc-pr-land` until each PR has review truth, gate carry-forward truth, rebase truth, conflict truth, validation truth, and parity truth.
- Exit to: main parity, `cc-pr-review` for missing review, `cc-dev` for implementation gaps, or stop when GitHub truth is unavailable.

## Core Rules

1. 先解析 `gh`：PATH 找不到时检查 `/opt/homebrew/bin/gh` 和 `/usr/local/bin/gh`。
2. GitHub live PR list is truth, and it must be authenticated truth.
3. 匿名 GitHub API `404` 视为私有仓库或未认证访问，除非认证后的 live proof 反证。
4. 只打印认证环境变量名，不打印 token 值。
5. `git fetch` / `git ls-remote` 只能证明远端 ref，不能代替 PR、review、checks 真相。
6. 先 review，再 landing。
7. review 不是一个布尔值；complexity、hardening/productization、release/readiness coverage 必须 checked、skipped with reason、not applicable，或明确 route away。
8. blocked、failed、changes-requested、must-fix-before-release、missing facet coverage、material rebase 后 stale coverage 都不能 landing。
9. rebase 到 evolving mainline，不 rebase 到过期 main。
10. 冲突解决后必须 re-review。
11. 不允许需求缩水。
12. 不确定是不是需求缩水，就停下来问。
13. 用 `--force-with-lease` 更新 PR head，不无脑 force。
14. main 只允许 ff-only / inspected push，不覆盖未检查远端。
15. landing 后必须证明 local main、remote main、active main worktree 一致。
16. 临时 branch / worktree 要清理或报告。

## Required Outputs

- Live PR truth set
- Landing order
- Review evidence
- Gate carry-forward evidence for complexity, hardening/productization, and release/readiness coverage
- Rebase/conflict notes
- Post-conflict re-review verdict
- Validation evidence
- Main parity proof
- Cleanup result

## GitHub Truth Preflight

Run before listing, reviewing, rebasing, or merging any PR:

1. Resolve `gh` with `command -v gh`, then `/opt/homebrew/bin/gh` and `/usr/local/bin/gh`. If a fallback is used, call that absolute path.
2. Prefer authenticated `gh` after `gh auth status` succeeds. Do not print tokens.
3. If REST/curl is needed, inspect only token environment variable names such as `GH_TOKEN`, `GITHUB_TOKEN`, `GITHUB_PAT`, `GHE_TOKEN`, or `GITHUB_ENTERPRISE_TOKEN`; never print values.
4. If no authenticated GitHub path is available, stop. Do not infer PR queue, reviews, checks, or mergeability from local refs.
5. Treat anonymous REST `404` for repository or PR endpoints as private-repo or unauthenticated-access evidence unless authenticated proof says otherwise.
6. `git fetch`, `git ls-remote`, and remote refs prove branch existence or commit ids only; they do not replace live PR, review, and check truth.

## Review Gate Carry-Forward

`cc-pr-land` is the final merge gate. It must preserve the review verdict, not reinterpret it as vague approval. Before landing, read PR review output, GitHub review comments, linked `task.md`, and `handoff/pr-brief.md` when available, then classify:

- Complexity: checked, skipped with reason, blocked, failed, or not applicable.
- Hardening/productization: selected facets checked, skipped with reason, blocked with missing evidence, failed, or not applicable.
- Release/readiness: local checks, config/env, migrations/data, deploy/health, smoke/cleanup, rollback, and watch items passed, skipped with reason, blocked, failed, or not applicable when those surfaces are part of the PR.

Do not land unresolved `blocked`, `failed`, `changes-requested`, `must-fix-before-release`, missing facet coverage, or stale coverage after a material rebase/conflict resolution. Route missing or stale review coverage to `cc-pr-review`; route concrete implementation fixes to `cc-dev`. A skipped or not-applicable gate must name evidence or scope reason.

## Reviewed Verdict And Main Parity Guard

Do not merge on implied approval. A PR needs an explicit reviewed verdict from
`cc-pr-review`, GitHub review, or an equivalent recorded review packet before
landing. Missing, stale, or ambiguous review evidence must route to
`cc-pr-review`; route to `cc-pr-review` before any merge attempt.

Main parity proof is command evidence, not prose. Before declaring landing
complete, show local main, remote main, and active main worktree commit proof
from Git/GitHub commands. If main parity command proof is missing, stop instead
of treating the merge as complete.

## Stop Conditions

Stop instead of guessing when:

- GitHub truth unavailable
- `gh` cannot be resolved and no authenticated REST/curl token name is available
- GitHub API only works anonymously or returns unauthenticated/private-repo `404`
- PR queue changed mid-run
- review evidence is missing
- production gate coverage is missing, blocked, failed, or stale
- conflict intent is unclear
- resolved diff drops required behavior
- validation fails only after integration
- main parity cannot be proven
