---
name: cc-pr-land
version: 1.1.0
description: Use in a separate session to land reviewed GitHub PRs into main with review-first, rebase-first discipline.
triggers:
  - 合并这个 PR
  - 单独会话合并 PR
  - land this PR
  - merge reviewed PRs
reads:
  - ../cc-pr-review/SKILL.md
  - ../cc-review/SKILL.md
  - ../cc-check/SKILL.md
  - GitHub pull requests
  - devflow/changes/<change-key>/task.md
  - devflow/changes/<change-key>/handoff/pr-brief.md
writes:
  - path: GitHub pull request head branch
    durability: remote
    required: false
    when: rebase or conflict fixes must be pushed
  - path: origin/main
    durability: remote
    required: true
    when: landing succeeds
effects:
  - review-first PR landing
  - rebase-first mainline integration
  - local and remote main parity proof
entry_gate:
  - Fetch live GitHub PR truth; do not rely on stale refs.
  - Require prior review or perform a review pass before landing.
  - Rebase onto the evolving integration mainline.
  - Stop when conflict resolution would require product intent guessing.
exit_criteria:
  - Each landed PR was reviewed before landing and re-reviewed after material rebase or conflict resolution.
  - Requirement shrinkage is rejected or ruled out.
  - Remote main, local main, and active main worktree parity are verified.
  - No process file is created for landing state.
reroutes:
  - when: The PR has unreviewed implementation risk or stale review evidence.
    target: cc-pr-review
  - when: Conflict resolution reveals missing implementation or broken requirements.
    target: cc-dev
  - when: Mainline parity cannot be proven.
    target: stop
tool_budget:
  read_files: 12
  search_steps: 8
  shell_commands: 18
---

# CC-PR-Land

Land reviewed PRs. Do not implement new feature scope.

Evidence lives in GitHub, Git history, command output, and final response. Do not create local process files for landing state.
