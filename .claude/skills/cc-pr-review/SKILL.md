---
name: cc-pr-review
version: 1.1.1
description: Use in a separate session to review one remote GitHub PR before landing. It reports findings from PR truth and current diff without writing process files.
triggers:
  - review 这个 PR
  - 单独会话 review PR
  - review remote PR
  - pre-landing PR review
reads:
  - ../cc-review/SKILL.md
  - ../cc-check/SKILL.md
  - GitHub pull request
  - devflow/changes/<change-key>/task.md
  - devflow/changes/<change-key>/handoff/pr-brief.md
writes:
  - path: GitHub pull request comments or review
    durability: remote
    required: false
    when: remote review feedback is posted
effects:
  - remote PR review
  - finding triage
  - fix or landing recommendation
entry_gate:
  - Freeze PR title, body, commits, head branch, base branch, checks, linked issues, and current diff from GitHub.
  - Read local `task.md` and `pr-brief.md` when the PR links to a change key.
  - Do not merge, push main, or write local process files.
exit_criteria:
  - Review result is approved-for-landing, changes-requested, needs-clarification, or blocked.
  - Findings cite concrete PR diff, command output, checks, local task facts, or missing evidence.
  - Required fixes route back to cc-dev or cc-do; clean PRs route to cc-pr-land.
  - No local process file is created.
reroutes:
  - when: Required fixes are inside the PR implementation scope.
    target: cc-dev
  - when: The PR is clean and ready to land.
    target: cc-pr-land
  - when: The review needs deeper local diff review.
    target: cc-review
tool_budget:
  read_files: 10
  search_steps: 6
  shell_commands: 12
---

# CC-PR-Review

Review remote PR reality. Do not merge.

Build the review from:

- live PR metadata
- true PR commits
- latest checks
- PR diff
- `task.md` and `handoff/pr-brief.md` when available

Output findings in the response or GitHub review only. Do not write local process files.
