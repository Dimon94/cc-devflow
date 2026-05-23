# cc-pr-review Checklist Contract

## Diagnosis

PR review becomes unsafe when local refs or old chat state substitute for live PR truth.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: current response or GitHub PR review only
- Failure route: `cc-pr-land` for clean PRs, `cc-dev`/`cc-do` for required fixes, `cc-review` for deeper local review, or blocked

## Pause Points

1. Before review: refresh live PR truth.
2. Before finding: map evidence to diff, task, check, or missing proof.
3. Before exit: select landing, fix, deeper review, clarification, or blocked route.

## Required Checks

- [ ] PR title, body, commits, head/base, checks, linked issues, and diff are frozen from GitHub
- [ ] `task.md` and `pr-brief.md` are read when the PR links to a change key
- [ ] findings cite PR diff, command/check output, task facts, or missing evidence
- [ ] non-trivial risk includes an ASCII PR Review Chain
- [ ] hardening/productization facets are selected, skipped with reason, or blocked with missing evidence when the PR touches production risk or product control surfaces
- [ ] result is approved-for-landing, changes-requested, needs-clarification, or blocked

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
