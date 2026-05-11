# CC-PR-Land Playbook

## Visible State Machine

`reviewed remote PRs -> cc-pr-land -> main parity | cc-pr-review | cc-dev | stop`

- Enter from: `cc-pr-review` approval, PR URL, PR number, or user request to land reviewed PRs.
- Stay in: `cc-pr-land` until each PR has review truth, rebase truth, conflict truth, validation truth, and parity truth.
- Exit to: main parity, `cc-pr-review` for missing review, `cc-dev` for implementation gaps, or stop when GitHub truth is unavailable.

## Core Rules

1. GitHub live PR list is truth.
2. 先 review，再 landing。
3. rebase 到 evolving mainline，不 rebase 到过期 main。
4. 冲突解决后必须 re-review。
5. 不允许需求缩水。
6. 不确定是不是需求缩水，就停下来问。
7. 用 `--force-with-lease` 更新 PR head，不无脑 force。
8. main 只允许 ff-only / inspected push，不覆盖未检查远端。
9. landing 后必须证明 local main、remote main、active main worktree 一致。
10. 临时 branch / worktree 要清理或报告。

## Required Outputs

- Live PR truth set
- Landing order
- Review evidence
- Rebase/conflict notes
- Post-conflict re-review verdict
- Validation evidence
- Main parity proof
- Cleanup result

## Stop Conditions

Stop instead of guessing when:

- GitHub truth unavailable
- PR queue changed mid-run
- review evidence is missing
- conflict intent is unclear
- resolved diff drops required behavior
- validation fails only after integration
- main parity cannot be proven
