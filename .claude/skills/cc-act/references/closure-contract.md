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
8. If verification changes during Act, return to `cc-check`.
9. If delivery mode is not explicit, ask the user through `../cc-dev/references/user-choice-output-protocol.md` before pushing, creating a PR, or merging locally.
10. Release-readiness gates are explicit in PR/handoff output or final response:
    `passed`, `failed`, `skipped:<reason>`, `blocked:<missing evidence>`, or
    `not-applicable:<reason>`.

## Release Readiness Gate

`cc-act` does not rerun the whole release process. It checks that ship output
honestly carries the release gates already proven by `cc-check` or explicitly
marks the gate as skipped, blocked, or not applicable.

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
- A skipped gate needs a reason and accepted risk.
- A blocked gate needs the missing environment, credential, service, artifact,
  or owner, then route to `cc-check` when the gate is required for shipping.
- `local-handoff` may mark deploy/health or post-deploy gates as blocked or not
  applicable, but must not describe the work as released.
- PR mode includes the gate ledger in `pr-brief.md` so reviewers can see what is
  proven, skipped, blocked, and what to watch after merge.

## Exit

Close with commit hashes, validation commands, release gate status, PR/handoff
state, rollback/watch path, and any incident postmortem path.
