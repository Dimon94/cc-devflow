---
name: cc-pr-land
version: 1.4.0
description: Use in a separate session to land reviewed GitHub PRs into main with review-first, production-gate-aware, rebase-first discipline.
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
  - references/checklist-contract.md
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
  - production-gate-aware PR landing
  - rebase-first mainline integration
  - local and remote main parity proof
entry_gate:
  - Resolve `gh` from PATH or common install paths such as `/usr/local/bin/gh` before declaring it unavailable.
  - Require authenticated GitHub truth before reading PRs, reviews, or checks; anonymous API failures stop the route.
  - Fetch live GitHub PR truth; do not rely on stale refs.
  - Require prior review or perform a review pass before landing.
  - Require PR review evidence to include complexity and hardening/productization facet coverage when the PR touched those surfaces; blocked, failed, stale, or missing facet coverage routes away from landing.
  - Rebase onto the evolving integration mainline.
  - Stop when conflict resolution would require product intent guessing.
exit_criteria:
  - Each landed PR was reviewed before landing and re-reviewed after material rebase or conflict resolution.
  - Review-gate coverage is settled: complexity and production-risk facets are checked, skipped with concrete reasons, or not applicable; unresolved blocked/failed facets are not landed.
  - Requirement shrinkage is rejected or ruled out.
  - Remote main, local main, and active main worktree parity are verified.
  - No process file is created for landing state.
reroutes:
  - when: The PR has unreviewed implementation risk, stale review evidence, or missing/blocked hardening/productization coverage.
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

## Read First

1. `references/checklist-contract.md`

Land reviewed PRs. Do not implement new feature scope.

Evidence lives in GitHub, Git history, command output, and final response. Do not create local process files for landing state.

## Review Gate Carry-Forward

`cc-pr-land` is the final merge gate. It must preserve the review verdict, not
reinterpret it as a vague approval. Before landing, read the PR review output,
GitHub review comments, linked `task.md`, and `handoff/pr-brief.md` when
available, then classify review-gate coverage:

- Complexity: checked, skipped with reason, blocked, failed, or not applicable.
- Hardening/productization: selected facets checked, skipped with reason,
  blocked with missing evidence, failed, or not applicable.
- Release/readiness: local checks, config/env, migrations/data, deploy/health,
  smoke/cleanup, rollback, and watch items are passed, skipped with reason,
  blocked, failed, or not applicable when those surfaces are part of the PR.

Do not land a PR with unresolved `blocked`, `failed`, `changes-requested`,
`must-fix-before-release`, missing facet coverage, or stale coverage after a
material rebase/conflict resolution. Route missing or stale review coverage to
`cc-pr-review`; route concrete implementation fixes to `cc-dev`. A skipped or
not-applicable gate must name the evidence or scope reason.

## GitHub Truth Preflight

Run this preflight before listing, reviewing, rebasing, or merging any PR:

1. Resolve the GitHub CLI with `command -v gh`, then common fallback paths such as `/opt/homebrew/bin/gh` and `/usr/local/bin/gh`. If a fallback is used, call that absolute path instead of reporting that `gh` is not installed.
2. Prefer authenticated `gh` commands after `gh auth status` succeeds. Do not print tokens.
3. If `gh` auth is unavailable and REST/curl is needed, inspect only environment variable names for GitHub tokens, for example `GH_TOKEN`, `GITHUB_TOKEN`, `GITHUB_PAT`, `GHE_TOKEN`, or `GITHUB_ENTERPRISE_TOKEN`; never print values.
4. If no authenticated GitHub path is available, stop with route `stop`. Do not infer PR queue, reviews, checks, or mergeability from local refs.
5. Treat anonymous GitHub REST `404` for repository or PR endpoints as private-repo or unauthenticated-access evidence unless live authenticated proof says otherwise.
6. `git fetch`, `git ls-remote`, and remote refs may prove branch existence or commit ids, but they are not substitutes for live PR, review, and check truth.


## Default Output

For landing sessions, report:

1. PR: number, title, and head branch.
2. Review: prior review proof and any post-rebase re-review.
3. Gate carry-forward: complexity, hardening/productization, release/readiness coverage, with skips/blockers/failures named.
4. Landing: merge/rebase action and resulting main commit.
5. Parity: local main, remote main, and active main worktree proof.
6. Route: landed, `cc-pr-review`, `cc-dev`, or `stop`.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.
