# cc-act Checklist Contract

## Diagnosis

Ship failures usually come from stale verification, skipped simplification, missing full-suite evidence, implicit postmortem decisions, inherited PR prose, or unclear push/handoff/local-merge state.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: `pr-brief.md`, postmortem files when required, Git commits, push/PR/local-main state, and final response
- Failure route: `cc-check` for stale evidence or simplify edits, `cc-do` for unfinished work, or finish create-pr/update-pr/local-handoff/local-main-merge/post-merge-closeout

## Pause Points

1. Before delivery mode: resolve CLI and read current task/Git/PR evidence.
2. Before any delivery action: load local Codex thread orchestration, discover required thread/resource/heartbeat tools, then run the pre-act `cc-simplify` gate in a child thread by default.
3. Before waiting on a child: confirm any explicit child thread resource request was honored, child-to-parent handoff instructions are in the dispatch packet, and `automation_update` created heartbeat monitoring.
4. Before PR push/update or local-main merge: identify and run the full repository test/verification suite on the final tree; fix failures and rerun before delivery.
5. Before PR/handoff: rerun postmortem trigger and stale-verification check.
6. Before exit: confirm commits, simplify verdict, push/PR/local/local-main state, full-suite gate when required, remote issue closeout state, and postmortem verdict.

## Required Checks

- [ ] `task.md`, Git status, latest commits, validation evidence, and PR state are current
- [ ] local Codex orchestration was loaded before child dispatch: `codex-thread-orchestration.md` and `SIMPLIFY_CHILD_DISPATCH_PACKET.md`
- [ ] `create_thread`, `list_threads`, `read_thread`, `send_message_to_thread`, and `automation_update` were discovered before child dispatch, or main-thread fallback is explicit
- [ ] child thread resources use host defaults unless the user explicitly requested a supported resource; explicit requests are verified after launch or main-thread fallback reports the unsupported resource
- [ ] pre-act `cc-simplify` gate completed in a child thread, completed by main-thread fallback, returned `NO FINDINGS`, or is explicitly not applicable because there is no changed implementation surface
- [ ] child mode includes child-to-parent handoff proof and heartbeat id/status; the parent verified the child result with `read_thread`
- [ ] any `cc-simplify` code, test, or verification-posture edit routed back to `cc-check`
- [ ] one ship mode is selected: create-pr, update-pr, local-handoff, local-main-merge, or post-merge-closeout
- [ ] repository full-suite command was identified from project scripts, docs, or CI when delivery may push, update/create PR, or merge local main
- [ ] full-suite verification passed after the final owned commit and before push, PR create/update, or local-main merge; failures were repaired and rerun, or delivery is blocked with missing evidence
- [ ] remote issue closeout gate is satisfied when a tracker issue is in scope: direct completed issues are closed and verified, open PR/MR issues are auto-close-on-merge, parent/partial refs stay related-only, or blocked/manual action is explicit
- [ ] verification did not change during Act; otherwise route to `cc-check`
- [ ] release-readiness gates are stated as passed, failed, skipped with reason, blocked with missing evidence, or not applicable; rollback/watch path is named when relevant
- [ ] local-main-merge, when selected, has rebase proof, owning-main `--ff-only` merge proof, containing-commit proof, and no-push evidence
- [ ] postmortem trigger script ran and result is explicit
- [ ] PR brief is rebuilt from current diff, commits, task, and verification rather than inherited prose

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
