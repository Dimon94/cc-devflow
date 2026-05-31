---
name: cc-pr-land
version: 1.5.0
description: Use to land reviewed GitHub PRs into main with production-gate-aware parity proof.
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
  - Carry forward complexity, hardening/productization, and release/readiness gates from review evidence.
  - Rebase onto the evolving integration mainline.
  - Stop when conflict resolution would require product intent guessing.
exit_criteria:
  - Each landed PR was reviewed before landing and re-reviewed after material rebase or conflict resolution.
  - Review Gate Carry-Forward is settled; blocked, failed, stale, or missing facet coverage is not landed.
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
---

# CC-PR-Land

Land reviewed PRs. Do not implement new feature scope.

Evidence lives in GitHub, Git history, command output, and final response. Do not create local process files for landing state.

## Load Table

| Need | Load |
| --- | --- |
| Landing flow, GitHub preflight, Review Gate Carry-Forward | `PLAYBOOK.md` |
| Checklist before pause or exit | `references/checklist-contract.md` |
| Missing or stale review coverage | `../cc-pr-review/SKILL.md` |
| Implementation gap after conflict or validation | `../cc-dev/SKILL.md` |

## Flow

authenticated GitHub truth -> review evidence -> gate carry-forward -> rebase -> validate -> land -> main parity proof.


## Default Output

Answer with: PR, Review, Gate carry-forward, Landing, Parity, Route (landed, `cc-pr-review`, `cc-dev`, or `stop`).
