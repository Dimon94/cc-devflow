# cc-act Checklist Contract

## Diagnosis

Ship failures usually come from stale verification, implicit postmortem decisions, inherited PR prose, or unclear push/handoff/local-merge state.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: `pr-brief.md`, postmortem files when required, Git commits, push/PR/local-main state, and final response
- Failure route: `cc-check` for stale evidence, `cc-do` for unfinished work, or finish create-pr/update-pr/local-handoff/local-main-merge/post-merge-closeout

## Pause Points

1. Before delivery mode: resolve CLI and read current task/Git/PR evidence.
2. Before PR/handoff: rerun postmortem trigger and stale-verification check.
3. Before exit: confirm commits, push/PR/local/local-main state, and postmortem verdict.

## Required Checks

- [ ] `task.md`, Git status, latest commits, validation evidence, and PR state are current
- [ ] one ship mode is selected: create-pr, update-pr, local-handoff, local-main-merge, or post-merge-closeout
- [ ] verification did not change during Act; otherwise route to `cc-check`
- [ ] release-readiness gates are stated as passed, failed, skipped with reason, blocked with missing evidence, or not applicable; rollback/watch path is named when relevant
- [ ] local-main-merge, when selected, has rebase proof, owning-main `--ff-only` merge proof, containing-commit proof, and no-push evidence
- [ ] postmortem trigger script ran and result is explicit
- [ ] PR brief is rebuilt from current diff, commits, task, and verification rather than inherited prose

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
