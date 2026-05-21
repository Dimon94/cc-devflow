# CC-Act Skill Changelog

## v1.13.0 - 2026-05-21

- require delivery-mode selection when the user has not explicitly chosen remote PR, PR update, local handoff, or post-merge closeout
- add the shared user-choice output protocol so Codex uses `request_user_input` and Claude Code uses structured input when available before falling back to fixed A/B/C text

## v1.12.0 - 2026-05-20

- compress confirmed Failure Ledger entries into incident postmortems instead of treating raw task failures as long-term truth
- add `Workflow Patch Candidate` to the postmortem template so each incident decides whether the workflow changes through a skill rule, template field, script guard, regression test, roadmap follow-up, or explicit no-action
- teach `evaluate-postmortem-trigger.sh` to trigger on confirmed ledger entries marked for postmortem

## v1.11.0 - 2026-05-18

- add a fixed Default Output contract for commit, evidence, delivery, postmortem gate, and route reporting

## v1.10.0 - 2026-05-18

- add a closeout-specific checklist contract for mode selection, commit coherence, stale verification detection, postmortem trigger proof, PR brief rebuild, and handoff status

## v1.9.3 - 2026-05-17

- add `evaluate-postmortem-trigger.sh` so FIX closeout, task-recorded incident markers, and session rework triggers produce an explicit postmortem gate decision
- render the postmortem trigger verdict into `pr-brief.md` so handoff material records whether an incident postmortem is required
- require final closeout to report either `POSTMORTEM_REQUIRED=no` or the written incident path instead of relying on implicit model memory

## v1.9.2 - 2026-05-17

- make `render-pr-brief.sh` resolve `Output language` from `task.md` or runtime config and render PR handoff headings, metadata, and placeholders in Chinese when configured
- keep machine literals such as branch names, SHAs, paths, and commit subjects unchanged while localizing the surrounding durable handoff document

## v1.9.1 - 2026-05-13

- simplify closeout rules so `cc-act` names only the allowed durable outputs and bans extra process files as a class
- remove old release/status/resume/report/ledger filename lists from the default ship contract

## v1.8.11 - 2026-05-13

- collapse `cc-act` delivery material into a single default `handoff/pr-brief.md` file
- fold release notes, local resume entry, and doc sync status into `pr-brief.md` sections instead of generating parallel `release-note.md`, `resume-index.md`, or `doc-sync-report.md`
- update `sync-act-docs.sh` so it collects doc-sync inputs without writing extra handoff Markdown files
- add `inspect-git-index.sh` and unborn-branch preflight rules so commit flow checks HEAD/ref/index truth before staging or committing

## v1.8.10 - 2026-05-13

- require the shared `resolve-cc-devflow.sh` CLI resolver before delivery context reset or post-merge archive commands
- make old global CLIs a ship blocker instead of allowing stale workflow context or archive claims
- update closeout language to call resolved CLI commands for archive proof

## v1.8.9 - 2026-05-13

- internalize closure operating rules so `cc-act` chooses one ship mode from verified facts, records rejected paths, and keeps handoff materials mode-specific
- require handoffs to state done, verified, remaining/blocker, and next entry while exposing skipped tests, archive, auth, PR, or release uncertainty loudly

## v1.8.8 - 2026-05-12

- require `cc-devflow query workflow-context` before ship work so `cc-act` confirms the context-index next action before opening delivery artifacts
- make deep closeout reads conditional on ship-mode, rollback, roadmap-sync, or postmortem triggers
- keep `ship-readiness` as the hard readiness query while using workflow context for the end-to-end PDCA/IDCA handoff

## v1.8.7 - 2026-05-11

- add project-level AI postmortem writeback under `devflow/postmortems/` for FIX closeout and recurring AI/process/engineering failures
- add index, principle, and incident templates with progressive disclosure, Git evidence, verification evidence, and prevention summaries
- make `cc-act` the default postmortem writer because ship closeout has the verified review range, branch state, commits, PR/handoff, and follow-up truth
- add a Redaction Guard so project postmortems preserve evidence without copying secrets, customer data, private logs, or personal machine paths
- make post-merge archive a hard closeout gate instead of a soft next-action suggestion
- require `cc-devflow archive-change <change-key>` plus archive-path proof for `post-merge-closeout`
- allow skipping archive only with an explicit `ArchiveSkip` blocker and retry command in handoff material

## v1.8.6 - 2026-05-11

- add a language-aware Pull Request Body Contract so `create-pr` and `update-pr` derive PR title/body language from runtime `Output language`
- render a detailed PR body draft in `pr-brief.md` with summary, problem, changes, validation, review/gate evidence, risk/rollback, docs/writeback, and follow-ups
- block shallow PR descriptions by requiring current diff/report-card/doc-sync/roadmap facts, real validation evidence, and no leftover placeholders before `gh pr create` or `gh pr edit`

## v1.8.5 - 2026-05-11

- expand `references/git-commit-guidelines.md` from title-only guidance into a structured commit-record contract with problem, change, rationale, validation, risk, and refs sections
- require Chinese commit subjects and body text for Chinese output contexts while keeping the Conventional Commits `type(scope)` prefix machine-readable
- add type-specific commit body templates so fixes carry root cause, tests carry real seam evidence, and docs/tooling commits explain validation and risk instead of shipping one-line summaries

## v1.8.4 - 2026-05-11

- prefer `change-meta.json` for roadmap sync and spec file summaries so `task-manifest.json` stays focused on execution state
- keep backward-compatible manifest fallback for older change folders while preserving one owner for roadmap/spec status

## v1.8.3 - 2026-05-11

- add `ensure-ship-branch.sh` so detached HEAD closeouts can create a named branch and continue toward `create-pr`
- surface `BRANCH_STATE`, `BRANCH_RESCUE`, and rescue action fields in ship detection, status, PR briefs, and resume indexes
- clarify that user-directed continue / remote PR requests should not downgrade to `local-handoff` just because `CURRENT_BRANCH` is empty

## v1.8.2 - 2026-05-06

- add an execution-time Roadmap Progress Check so act verifies source RM state before ship work continues
- align all roadmap writeback guidance on `devflow/roadmap.json` with generated `ROADMAP.md` / `BACKLOG.md` projections
- update delivery templates and act render scripts to surface roadmap sync state in PR briefs, release notes, resume indexes, and doc sync reports

## v1.8.1 - 2026-04-29

- add structured ship preflight fields with `ShipPreflightError` rescue actions
- require rollback guards before publish, merge, PR update, or release note handoff
- add PR branch hygiene and learning extraction targets to delivery templates

## v1.8.0 - 2026-04-28

- add remote state consistency rules for issue, PR, tracker, `needs-info`, and `ready-for-agent` closeout handoffs
- require dangerous git actions to have explicit ship semantics and user confirmation before reset, clean, branch deletion, or whole-tree restore
- require tooling changes to prove the real hook, adapt, publish, lint, or verification entrypoint still works

## v1.7.0 - 2026-04-28

- carry cc-check QA feedback-loop and behavior evidence into PR briefs, handoffs, and release notes so ship materials preserve expected/actual/reproduction truth
- add durable follow-up brief rules for current behavior, desired behavior, key interfaces, acceptance criteria, and out-of-scope boundaries
- teach shared follow-up and evidence extraction to include report-card followup briefs and QA architecture follow-ups
- extend readiness dashboard guidance with feedback-loop quality and behavior evidence checks

## v1.6.4 - 2026-04-28

- add a readiness dashboard covering review freshness, review quality, specialist facets, QA coverage, browser QA, failure ownership, documentation release, and PR body accuracy
- require verification to rerun on every cc-act invocation while keeping ship actions idempotent
- update `verify-act-gate.sh` to recognize `claimEvidence`, review freshness, QA coverage/browser status, and unresolved failure ownership
- update `render-pr-brief.sh`, shared evidence extraction, and the PR brief template with readiness and PR body accuracy fields

## v1.6.3 - 2026-04-28

- require PR briefs and PR bodies to carry the reviewed base/head SHA, review packet summary, finding triage, and QA / claim evidence summary
- require post-merge closeout to verify the merged result instead of relying only on pre-merge evidence
- add destructive cleanup confirmation rules for branch, worktree, discard, and archive actions
- update `render-pr-brief.sh` and the PR brief template with review range and merged-result verification fields

## v1.6.2 - 2026-04-27

- require closeout handoff documents to resolve the runtime output policy before writing PR briefs, release notes, resume indexes, or status handoffs
- record `Output language` as the machine-enforced language contract while treating `agent_preferences` as advisory style input
- render `Output language` metadata in generated PR briefs, release notes, resume indexes, and doc sync reports

## v1.6.1 - 2026-04-25

- remove external tool provenance from the public skill contract so ship and documentation release rules read as native `cc-act` behavior
- keep idempotent ship, documentation audit, changelog protection, and PR regeneration requirements unchanged

## v1.6.0 - 2026-04-24

- add the native `cc-act` ship and documentation closeout contract
- add ship hygiene rules for base detection, version/package/changelog drift, bisectable commits, final verification, push idempotency, and PR idempotency
- strengthen documentation release rules so README/CLAUDE/architecture/handoff/changelog/TODO updates are audited from the final diff before PR or handoff
- require PR bodies to be regenerated from current `cc-check`, scope drift, plan completion, verification, documentation, and test-plan facts

Migration note:

- new `create-pr` and `update-pr` closeouts should treat documentation sync and PR-body regeneration as first-class ship steps rather than optional post-processing

## v1.5.0 - 2026-04-19

- require `cc-act` to finish formal spec synchronization before ship closeout when `cc-check` marks `specSyncReady=true`
- surface spec sync state and target capability files in `sync-act-docs.sh` outputs so closeout materials stay aligned with capability truth
- tighten act entry rules so a passing report without spec readiness can no longer masquerade as a complete closeout

Migration note:

- change closeout now expects `change-meta.json`, related capability specs, and `report-card.json.specSyncReady`

## v1.4.1 - 2026-04-18

- compress duplicated commit-rule summaries in `SKILL.md` and `PLAYBOOK.md` so `references/git-commit-guidelines.md` stays the single truth source
- keep only stage-level enforcement language in the main docs and move commit-detail semantics fully behind the reference
- reduce drift risk between skill overview text and playbook execution text

## v1.4.0 - 2026-04-18

- add `references/git-commit-guidelines.md` as the canonical commit-history reference for `cc-act`
- require `create-pr` and `update-pr` flows to generate commit messages and commit boundaries by that guideline instead of relying on vague "clear message" wording
- surface the commit guideline in `Read First`, bundled resources, playbook integration steps, and working rules so commit generation has one explicit truth source

## v1.3.0 - 2026-04-18

- add an explicit pre-ship validation stage for `cc-simplify`, unit tests, and coordinator-directed e2e runs
- require `create-pr` and `update-pr` flows to commit verified changes, push the branch, and use `gh pr create` or refresh the existing PR instead of duplicating it
- tighten reroute rules so any simplify or test-driven code change sends the requirement back through `cc-check` before act can continue

## v1.2.0 - 2026-04-17

- add structured frontmatter contract fields so cc-act exposes ship-mode rules, reroutes, recovery, and tool budget directly in the skill
- add `Harness Contract` and `Visible State Machine` to make closeout behavior readable without internal harness code
- add memory-consolidation guidance so delivery truth is compressed into status, brief, and resume artifacts before handoff

Migration note:

- existing `pr-brief.md`, `status-report.md`, and `resume-index.md` files remain valid
- registry and publish tooling now expect the new public frontmatter keys on this skill

## v1.1.0 - 2026-04-15

- add stronger trigger phrases in frontmatter
- add `Quick Start` mode selector for first-use clarity
- add `Minimum Output By Mode` to reduce overproduction
- add `Good Output` criteria so ship materials stay concise and mode-aware
- align protocol and read-first sections with versioned changelog workflow
