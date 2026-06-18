---
name: cc-act
version: 1.17.2
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
  - scripts/resolve-cc-devflow.sh
  - scripts/ensure-ship-branch.sh
  - scripts/evaluate-postmortem-trigger.sh
  - references/codex-thread-orchestration.md
  - assets/SIMPLIFY_CHILD_DISPATCH_PACKET.md
  - ../cc-simplify/SKILL.md
  - ../cc-simplify/PLAYBOOK.md
  - references/user-choice-output-protocol.md
  - references/checklist-contract.md
  - ../task-contract/SKILL.md
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
2. Resolve CLI with `scripts/resolve-cc-devflow.sh require config`.
3. Read `task.md`, Git status, latest commits, validation evidence, and PR state.
4. Before Act delivery, load `references/codex-thread-orchestration.md`, then run the `cc-simplify` gate in a real Codex child thread by default with `create_thread` resources set to model `gpt-5.5` and the required reasoning effort; if required thread, resource, or heartbeat tools are unavailable or the created thread cannot be verified on those resources, run the same gate in the main thread and report the fallback.
5. If `cc-simplify` changed code, tests, or verification posture, route to `cc-check`; if verification changed, route to `cc-check`; if implementation is unfinished, route to `cc-do`.
6. Choose exactly one delivery mode before pushing, creating a PR, or merging locally.
7. For push, PR create/update, or local-main merge delivery, satisfy the repository full verification gate after final owned changes are committed.

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

If delivery mode is not explicit, ask through `references/user-choice-output-protocol.md`. Do not default to remote push, PR, or local-main merge.

## Hard Rules

- All completed work is committed with coherent Conventional Commit messages; use `references/git-commit-guidelines.md`.
- Act cannot ship until the pre-act `cc-simplify` verdict is explicit: child-thread pass, main-thread fallback pass, `NO FINDINGS`, or not-applicable because there is no changed implementation surface.
- `cc-act` simplify child threads follow the local Codex contract: discover `create_thread`, `list_threads`, `read_thread`, `send_message_to_thread`, and `automation_update`; dispatch with `assets/SIMPLIFY_CHILD_DISPATCH_PACKET.md`; set and verify model `gpt-5.5` plus the required reasoning effort on the child thread; require child-to-parent handoff; and create heartbeat monitoring before stopping as `waiting-for-child-results`.
- Push, PR create/update, and local-main-merge are blocked until the repository full verification gate passes on the final tree. If it fails, fix failures and rerun the full suite before delivery.
- PR/handoff mode writes or refreshes only `handoff/pr-brief.md`.
- Release-readiness gates are explicit: passed, failed, skipped with reason, blocked with missing evidence, or not applicable.
- `POSTMORTEM_REQUIRED=no` is reported, or an incident postmortem path is written with `Workflow Patch Candidate` completed.
- Incident postmortems use confirmed `Failure Ledger` lessons, not raw `cc-review` findings, chat memory, or unclassified review escape candidates.
- `local-main-merge` requires fresh check evidence, rebase, owning-main `--ff-only` merge, containing-commit proof, and no-push evidence.
- No process file is created beyond allowed durable outputs.

## Default Output

1. Commit: latest commit hash or explicit uncommitted state.
2. Verification: fresh evidence reused from `cc-check` or reroute reason.
3. Simplify: child thread ID/report, child-to-parent handoff summary, heartbeat id/status, main-thread fallback report, `NO FINDINGS`, or not-applicable reason.
4. Delivery: PR URL, updated PR, local handoff path, local-main merge proof, or post-merge closeout state.
5. Postmortem: `POSTMORTEM_REQUIRED=no` or incident path written with workflow patch candidate.
6. Release: gate status, rollback/watch path, or explicit not-applicable reason.
7. Route: terminal state or next skill.

## Exit Criteria

- Delivery mode and push/PR/handoff/local-main state are explicit.
- Pre-act `cc-simplify` gate completed or was explicitly not applicable; child thread handoff and heartbeat status were verified when child mode was used; any simplify edit rerouted to `cc-check`.
- Postmortem trigger gate ran via `scripts/evaluate-postmortem-trigger.sh`.
- Release-readiness gate status is explicit in PR/handoff output or final response.
- Push, PR create/update, or local-main-merge delivery includes full-suite command, exit status, and claim proven after the final owned commit.
- Verification did not change during Act.
- No process file was created beyond allowed durable outputs.
