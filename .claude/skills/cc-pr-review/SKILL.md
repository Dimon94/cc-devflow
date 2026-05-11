---
name: cc-pr-review
version: 1.0.0
description: Use in a separate session to review one remote GitHub PR before landing. It fetches PR truth, builds a review packet, runs cc-review-style plan or implementation review with optional read-only reviewers, records findings, and updates the PR or reroutes to cc-dev/cc-do for fixes. It must not merge the PR or push main.
triggers:
  - review 这个 PR
  - 单独会话 review PR
  - 审这个远程 PR
  - review remote PR
  - pre-landing PR review
  - check this PR before merge
reads:
  - ../cc-review/SKILL.md
  - ../cc-check/SKILL.md
  - GitHub pull request
  - devflow/changes/<change-key>/review/report-card.json
writes:
  - path: devflow/changes/<change-key>/review/cc-pr-review.md
    durability: durable
    required: false
    when: the PR maps to a local cc-devflow change
  - path: GitHub pull request comments or review
    durability: remote
    required: false
    when: remote review feedback is posted
effects:
  - remote PR review packet
  - finding triage
  - fix or landing recommendation
entry_gate:
  - Freeze PR title, body, commits, head branch, base branch, checks, linked issues, and current diff from GitHub.
  - Separate true PR commits from stale base drift before judging the diff.
  - Read local cc-devflow artifacts when the PR links to a change key.
  - Build a review packet before producing findings.
  - Do not merge, push main, or mark the PR landed.
exit_criteria:
  - Review result is exactly one of approved-for-landing, changes-requested, needs-clarification, or blocked.
  - Findings cite concrete PR diff, artifacts, command output, checks, or missing evidence.
  - Any required fixes route back to cc-dev or cc-do; clean PRs route to cc-pr-land.
  - No merge or mainline integration happened inside cc-pr-review.
reroutes:
  - when: Required fixes are inside the PR implementation scope.
    target: cc-dev
  - when: The PR is clean and ready to land.
    target: cc-pr-land
  - when: The review needs deeper local artifact or diff review.
    target: cc-review
recovery_modes:
  - name: stale-pr-refresh
    when: PR head, checks, comments, or base branch changed during review.
    action: Refresh GitHub PR truth and rebuild the review packet before continuing.
  - name: base-drift-confusion
    when: The raw PR diff appears to delete or rewrite unrelated base work.
    action: Use commit and cherry inspection to separate true PR changes from stale-base perspective.
tool_budget:
  read_files: 10
  search_steps: 6
  shell_commands: 12
---

# CC-PR-Review

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、公开文档和分发配置，然后检查 `CLAUDE.md`

## Role

`cc-pr-review` 是远程 PR 的独立审查入口。它回答：

```text
这个 PR 是否可以交给 cc-pr-land 合并？
```

它只 review，不合并。

## Read First

1. GitHub PR snapshot
2. `../cc-review/SKILL.md`
3. `../cc-check/SKILL.md`
4. Linked `devflow/changes/<change-key>/` artifacts when available

## Use This Skill When

- PR 已经由 `cc-dev` 创建或更新。
- 用户想在独立会话 review PR。
- 合并前需要证明 diff、测试、门禁和需求没有漂移。

如果用户要求合并，进入 `cc-pr-land`，不要把 review 和 landing 混成一个动作。

## Harness Contract

- Allowed actions: fetch PR truth, build review packet, inspect diffs/artifacts/checks, run safe verification, dispatch read-only reviewers when available, record review findings, and recommend fix or landing.
- Forbidden actions: merge PRs, push main, rewrite unrelated PR scope, or accept findings without evidence.
- Required evidence: every accepted finding must cite PR diff, local artifact, command output, check result, issue/PR text, or explicit missing evidence.
- Reroute rule: required implementation fixes go back to `cc-dev` or `cc-do`; clean PRs go to `cc-pr-land`.

## Review Packet

Build this before findings:

```text
PR Review Packet
- PR: #<number> <title>
- Base/head: <base> <- <head>
- Intended behavior: <from PR body, issue, commits, artifacts>
- Must remain unchanged: <known invariants>
- True PR commits: <commit range>
- Drift ruled out: <yes/no and evidence>
- Checks: <latest status>
- Local artifacts: <change key and report-card if found>
```

## Review Lanes

Use `cc-review` methods. For broad diffs, cover:

- intent and regression
- security and privacy
- performance and reliability
- contracts and coverage

Small diffs may combine lanes, but the report must state what was covered or skipped.

## Verdicts

- `approved-for-landing`: no blocking findings; route to `cc-pr-land`.
- `changes-requested`: PR needs fixes; route to `cc-dev` or `cc-do`.
- `needs-clarification`: product intent or requirement shrinkage is unclear.
- `blocked`: GitHub, auth, checks, dependencies, or local artifacts are unavailable.

## Output

Report:

- PR number and URL
- review packet summary
- lanes covered or skipped
- accepted findings
- rejected or downgraded raw findings when reviewers were used
- latest checks
- verdict
- next gate
