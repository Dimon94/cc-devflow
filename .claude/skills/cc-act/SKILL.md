---
name: cc-act
version: 1.16.0
description: Use when verified work must be committed, handed off, pushed, merged into local main, or turned into a PR with the smallest durable delivery surface.
triggers:
  - 准备提 PR
  - 帮我发版
  - 收尾
  - ship this
  - handoff
  - close this requirement
reads:
  - PLAYBOOK.md
  - references/closure-contract.md
  - references/git-commit-guidelines.md
  - assets/PR_BRIEF_TEMPLATE.md
  - assets/PROJECT_POSTMORTEM_TEMPLATE.md
  - assets/PROJECT_POSTMORTEM_INDEX_TEMPLATE.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - scripts/ensure-ship-branch.sh
  - scripts/evaluate-postmortem-trigger.sh
  - ../cc-dev/references/user-choice-output-protocol.md
  - references/checklist-contract.md
writes:
  - path: devflow/changes/<change-key>/handoff/pr-brief.md
    durability: durable
    required: false
    when: creating or updating a PR
  - path: devflow/postmortems/incidents/<date>-<change-key>.md
    durability: durable
    required: false
    when: closing a FIX or recurring AI/process/engineering failure
---

# CC-Act

## Quick Start

All paths below are relative to this `SKILL.md` directory, not the shell cwd.

1. Read `references/checklist-contract.md`, `PLAYBOOK.md`, and `references/closure-contract.md`.
2. Resolve CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require config`.
3. Read `task.md`, Git status, latest commits, validation evidence, and PR state.
4. If verification changed, route to `cc-check`; if implementation is unfinished, route to `cc-do`.
5. Choose exactly one delivery mode before pushing, creating a PR, or merging locally.

## Durable Outputs

Allowed durable outputs only:

- `devflow/changes/<change-key>/handoff/pr-brief.md`
- `devflow/postmortems/incidents/<date>-<change-key>.md`

Everything else is Git history, PR history, or final response.

## Ship Modes

| Mode | When |
| --- | --- |
| `create-pr` | feature branch can push and no existing PR owns the delivery |
| `update-pr` | existing PR needs refreshed commits or body |
| `local-handoff` | local commits and next step are enough; no remote push |
| `local-main-merge` | user explicitly requests local `main` integration |
| `post-merge-closeout` | work is already merged and needs archive/postmortem closeout |

If delivery mode is not explicit, ask through `../cc-dev/references/user-choice-output-protocol.md`. Do not default to remote push, PR, or local-main merge.

## Hard Rules

- All completed work is committed with coherent Conventional Commit messages; use `references/git-commit-guidelines.md`.
- PR/handoff mode writes or refreshes only `handoff/pr-brief.md`.
- Release-readiness gates are explicit: passed, failed, skipped with reason, blocked with missing evidence, or not applicable.
- `POSTMORTEM_REQUIRED=no` is reported, or an incident postmortem path is written with `Workflow Patch Candidate` completed.
- Incident postmortems use confirmed `Failure Ledger` lessons, not raw `cc-review` findings, chat memory, or unclassified review escape candidates.
- `local-main-merge` requires fresh check evidence, rebase, owning-main `--ff-only` merge, containing-commit proof, and no-push evidence.
- No process file is created beyond allowed durable outputs.

## Default Output

1. Commit: latest commit hash or explicit uncommitted state.
2. Verification: fresh evidence reused from `cc-check` or reroute reason.
3. Delivery: PR URL, updated PR, local handoff path, local-main merge proof, or post-merge closeout state.
4. Postmortem: `POSTMORTEM_REQUIRED=no` or incident path written with workflow patch candidate.
5. Release: gate status, rollback/watch path, or explicit not-applicable reason.
6. Route: terminal state or next skill.

## Exit Criteria

- Delivery mode and push/PR/handoff/local-main state are explicit.
- Postmortem trigger gate ran via `scripts/evaluate-postmortem-trigger.sh`.
- Release-readiness gate status is explicit in PR/handoff output or final response.
- Verification did not change during Act.
- No process file was created beyond allowed durable outputs.
