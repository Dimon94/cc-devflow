# CC-PR-Review Playbook

## Visible State Machine

`remote PR -> cc-pr-review -> cc-dev | cc-do | cc-pr-land | stop`

- Enter from: a remote PR URL, PR number, or `cc-dev` terminal state.
- Stay in: `cc-pr-review` until PR truth, diff intent, checks, artifacts, findings, and verdict are explicit.
- Exit to: `cc-pr-land` when approved, `cc-dev` or `cc-do` when fixes are required, or stop when blocked or unclear.

## Core Rules

1. 只 review，不 merge。
2. 先冻结 GitHub PR truth。
3. 先区分 true PR commits 和 stale base drift。
4. 先写 review packet，再写 findings。
5. finding 必须有证据。
6. 没有证据就写 unknown，不伪装成 bug。
7. 宽 diff 使用四类风险 lane。
8. subAgent reviewer 只读；主线程负责验证和去重。
9. PR head 或 checks 改了，重新 refresh。
10. 干净 PR 的下一步是 `cc-pr-land`，不是在本 skill 里顺手合并。

## Required Outputs

- PR review packet
- ASCII PR Review Chain for each non-trivial finding
- Output-language check: ASCII connectors only; labels and finding text follow the PR/task/handoff language
- Covered lanes
- Findings triage
- Checks status
- Verdict
- Next gate

## Finding Shape

Each accepted finding should include:

```text
- Path or PR surface:
- Issue:
- Why it matters:
- Evidence:
- Confidence:
- ASCII Branch Chain:
- Fix path:
```

Speculative or style-only comments do not block landing.
