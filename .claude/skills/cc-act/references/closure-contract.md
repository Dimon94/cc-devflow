# Closure Contract

## Allowed Durable Outputs

- `handoff/pr-brief.md`
- `devflow/postmortems/INDEX.md`
- `devflow/postmortems/incidents/<date>-<change-key>.md`

## Hard Rules

1. Git commits are the process record.
2. PR text is rebuilt from current commits, diff, `task.md`, and fresh validation.
3. Incident postmortems are factual and evidence-backed.
4. Incident postmortems compress confirmed `task.md#Failure Ledger` entries, not raw attempts, raw `cc-review` findings, or chat memory.
5. `cc-act` must make the postmortem trigger decision explicit with `POSTMORTEM_REQUIRED=yes/no`.
6. When a postmortem is written, `Workflow Patch Candidate` is completed before exit.
7. No process file beyond the allowed durable outputs.
8. Before delivery, `cc-act` loads local Codex orchestration, discovers `create_thread`, `list_threads`, `read_thread`, `send_message_to_thread`, and `automation_update`, then runs `cc-simplify` in a child thread by default with model `gpt-5.5` and the requested reasoning effort set and verified on the thread; if that tool/resource chain is unavailable or the actual child resource differs, it runs the same gate in the main thread and reports the fallback.
9. If verification changes during Act, or `cc-simplify` changes code, tests, or verification posture, return to `cc-check`.
10. If delivery mode is not explicit, ask the user through `references/user-choice-output-protocol.md` before pushing, creating a PR, or merging locally.
11. PR creation/update, branch push, or local-main merge requires a fresh full verification suite pass after the final owned commit; failures must be fixed and rerun before delivery.
12. Release-readiness gates are explicit in PR/handoff output or final response:
    `passed`, `failed`, `skipped:<reason>`, `blocked:<missing evidence>`, or
    `not-applicable:<reason>`.

## Release Readiness Gate

`cc-act` does not rerun the whole release process. It first runs the pre-act
`cc-simplify` gate under the local child-thread and heartbeat contract, then
checks that ship output honestly carries the release gates already proven by
`cc-check` or explicitly marks the gate as skipped, blocked, or not applicable.
For PR creation/update, branch push, or local-main merge, the local quality gate
also requires the repository-defined full test/verification suite to pass after
the final owned commit.

## Full Verification Gate

Before any PR creation/update, branch push, or local-main merge, identify the
repository full-suite command from project scripts, documentation, or CI. Run it
on the final tree after all owned edits and commits are done. Focused tests or
stale `cc-check` evidence alone do not satisfy this gate.

If the full suite fails, the release gate is `failed`, not "known issue" or
"probably okay." Fix the failure through the appropriate implementation or
diagnosis route, rerun the full suite, and return to `cc-check` whenever the fix
changed code, tests, fixtures, generated artifacts, or verification posture. If
no repository full-suite command can be identified, mark the gate as
`blocked:<missing full-suite command>` and do not mutate remote PR state or
local `main`.

## Simplify Child Thread Guard

The simplify child is a Codex child thread, not a generic subagent. Use the
local Codex adapter and completed simplify dispatch packet. The packet must require
the child to send a compact handoff back to the parent with
`send_message_to_thread` after its final report is ready.

The parent must set model `gpt-5.5` and the selected reasoning effort on the
`create_thread` call, then verify the actual child thread reports those
resources before treating child mode as valid. A child running on a different
model or reasoning effort is unsupported resource evidence, not a usable
simplify verdict; run main-thread fallback instead.

The parent owns trust. A child handoff is only a wake-up hint; before shipping,
the parent must call `read_thread`, inspect the final report, and record the
thread id, resource proof, handoff summary, heartbeat id/status, simplify
verdict, dirty state, touched files, blockers, and verification evidence.

If the child is still running after dispatch, the parent must create or update a
10 minute heartbeat with `automation_update` and stop as
`waiting-for-child-results`. Do not replace this with repeated manual polling in
the same conversation. If heartbeat creation fails, report
`waiting-for-child-results` with child ids and a manual polling checklist.

## Delivery Mode And Release Gate Guard

Do not infer or default a delivery mode. If the user did not explicitly request
push, PR creation, PR update, local handoff, local-main merge, or post-merge
closeout, stop and ask through the shared choice protocol before acting.

Every release gate needs both a status and evidence or reason. Passed and failed
gates need current proof; skipped, blocked, and not-applicable gates need reasons.
Reasonless gates are not closeout evidence.

Use these gates when relevant:

- Local quality: typecheck, lint, unit, build, focused integration, e2e/visual,
  or domain verifier.
- Runtime config: required env vars, startup validation, production-only config,
  and clear boot failures.
- Migrations/data: ordering, compatibility, idempotency, backup, rollback, and
  locking risk.
- Deploy/health: deploy command, platform config, artifact, health/readiness,
  and provider dependency checks.
- Smoke/cleanup: production-shaped smoke creates temporary data, proves critical
  routes/auth/persistence/providers, cleans up, and verifies no residue.
- Rollback/watch: concrete rollback path plus post-deploy logs, dashboards,
  alerts, 4xx/5xx, provider failures, boot errors, and named watch items.

Rules:

- A passed gate needs current evidence: command output, CI/deploy truth, smoke
  proof, config proof, log/metric proof, or explicit product scope evidence.
- A PR push, PR creation/update, or local-main merge needs full-suite evidence;
  focused or partial commands may support the story but cannot replace it.
- A skipped gate needs a reason and accepted risk.
- A blocked gate needs the missing environment, credential, service, artifact,
  or owner, then route to `cc-check` when the gate is required for shipping.
- `local-handoff` may mark deploy/health or post-deploy gates as blocked or not
  applicable, but must not describe the work as released.
- `local-main-merge` may mark remote deploy/health gates as not applicable, but
  must prove local rebase, fast-forward merge, and containing commit evidence.
- PR mode includes the gate ledger in `pr-brief.md` so reviewers can see what is
  proven, skipped, blocked, and what to watch after merge.

## Local Main Merge Gate

`local-main-merge` is allowed only after explicit user request and fresh
verification. It must not push.

Required evidence:

- work branch name and delivered commit
- owning primary checkout path on `main`
- current local `main` commit before merge
- successful work-branch rebase on local `main`
- fresh full verification suite pass before the merge
- successful `git merge --ff-only <work-branch>` from the owning checkout
- final local `main` commit and proof it contains the delivered commit
- explicit no-push statement unless a separate push request was made

## Exit

Close with commit hashes, validation commands, release gate status, PR/handoff
or local-main merge state, rollback/watch path, and any incident postmortem path.
