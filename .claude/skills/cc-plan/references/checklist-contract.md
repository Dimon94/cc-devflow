# cc-plan Checklist Contract

## Diagnosis

Planning has many correct gates, but long prose makes it easy to miss a small step before freezing tasks.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: `devflow/changes/<change-key>/task.md` and the Plan-stage commit
- Failure route: `cc-do` after approval, or stop for one blocking decision

## Pause Points

1. Before writing `task.md`: finish evidence read, value check, and worktree setup.
2. Before generating task blocks: freeze interfaces, data, abstraction boundary, and execution architecture.
3. Before handoff: verify domain context growth and Plan-stage commit.

## Required Checks

- [ ] change key, isolated worktree, and exact-case work branch are established
- [ ] repo evidence was read before asking the user
- [ ] relevant `CONTEXT.md`, `CONTEXT-MAP.md`, and ADRs were read when present; missing context docs were skipped silently
- [ ] product value and engineering design were confirmed separately for non-trivial plans
- [ ] Second-Move Review compared first move, simpler move, and better architecture
- [ ] context growth was proposed for stable new terms, context splits, or ADR-worthy decisions and only written after user confirmation
- [ ] `task.md` contains Contract Summary, ASCII Branch Chain Analysis, task blocks, verification, non-goals, and commit requirement

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
