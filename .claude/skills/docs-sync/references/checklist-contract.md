# docs-sync Checklist Contract

## Diagnosis

Docs sync fails when version bumps, changelogs, README text, and migration notes are treated as optional memory work.

## Checklist Mode

- Mode: read-do
- Evidence sink: skill versions, skill changelogs, public docs, migration notes, and final sync summary
- Failure route: commit-ready docs sync, or stop for unresolved version/migration scope

## Pause Points

1. Before editing docs: inventory changed skills and public surfaces.
2. Before version bump: classify patch/minor/major and migration need.
3. Before exit: drift-scan public docs and changelog/version alignment.

## Required Checks

- [ ] git diff/status identifies touched skills, CLI contracts, and public workflow changes
- [ ] each affected skill has patch/minor/major version conclusion
- [ ] each changed skill changelog explains the contract delta
- [ ] README/CONTRIBUTING/docs/migration notes are checked for stale public facts
- [ ] major changes have migration notes and no stale version/command references remain

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
