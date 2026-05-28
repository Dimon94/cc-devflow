# CC-Act Playbook

## State Machine

`cc-check -> cc-act -> PR | local handoff | local main merge | post-merge closeout | next roadmap/REQ/FIX`

Act ships verified work. It does not create process state.

## Durable Outputs

- `handoff/pr-brief.md` for PR or local handoff
- incident postmortem for FIX or recurring failure

Everything else is Git history, PR history, or final response.

## Closeout

1. Verify Git status and latest commits.
2. Run or cite the current validation commands.
3. Commit any remaining owned changes.
4. State release-readiness gates: local checks, config/env, migrations/data,
   deploy/health, smoke/cleanup, rollback, and watch items. Mark skipped,
   blocked, or not applicable gates honestly.
5. Build `pr-brief.md` only when PR/handoff needs it.
6. Run `evaluate-postmortem-trigger.sh`; write incident postmortem when it returns `POSTMORTEM_REQUIRED=yes`.
7. Push/create/update PR when requested and available.
8. For `local-main-merge`, rebase the work branch onto local `main`, fast-forward merge from the owning main checkout, prove `main` contains the delivered commit, and do not push unless explicitly requested.
9. Archive completed change only after merge or explicit closeout.

## Local Main Merge

Use this mode only when the user explicitly asks for local `main` integration.

Required sequence:

1. Confirm the work branch has fresh `cc-check` pass evidence.
2. Confirm all intended changes are committed.
3. Confirm the owning primary checkout is on `main`.
4. Rebase the work branch on current local `main`.
5. From the owning primary checkout, run `git merge --ff-only <work-branch>`.
6. Verify local `main` contains the delivered commit.
7. Report that no remote push happened unless the user separately requested it.

If the owning main checkout is dirty, not on `main`, missing, or cannot fast-forward,
stop blocked with the exact Git evidence.

## Blockers

Return to `cc-check` when evidence changed. Return to `cc-do` when implementation is unfinished. If the postmortem gate depends on session-only rework evidence, pass it as `--trigger <short-label>` instead of silently dropping it. Do not patch around missing proof in Act.
