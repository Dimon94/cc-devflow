# CC-Act Playbook

## State Machine

`cc-check -> cc-act -> next roadmap/REQ/FIX`

Act ships verified work. It does not create process state.

## Durable Outputs

- `handoff/pr-brief.md` for PR or local handoff
- incident postmortem for FIX or recurring failure

Everything else is Git history, PR history, or final response.

## Closeout

1. Verify Git status and latest commits.
2. Run or cite the current validation commands.
3. Commit any remaining owned changes.
4. Build `pr-brief.md` only when PR/handoff needs it.
5. Run `evaluate-postmortem-trigger.sh`; write incident postmortem when it returns `POSTMORTEM_REQUIRED=yes`.
6. Push/create/update PR when requested and available.
7. Archive completed change only after merge or explicit closeout.

## Blockers

Return to `cc-check` when evidence changed. Return to `cc-do` when implementation is unfinished. If the postmortem gate depends on session-only rework evidence, pass it as `--trigger <short-label>` instead of silently dropping it. Do not patch around missing proof in Act.
