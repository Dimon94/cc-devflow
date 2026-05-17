# cc-spec-init Checklist Contract

## Diagnosis

Capability specs drift when implementation names or temporary project language are promoted to durable domain truth.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: `devflow/specs/INDEX.md`, capability spec files, and the spec commit
- Failure route: `cc-roadmap`/`cc-plan` consumers after spec truth is clear, or stop for unresolved boundary decisions

## Pause Points

1. Before writing: freeze capability boundary and language source.
2. Before linking: check current truth, gaps, non-goals, and acceptance signal.
3. Before exit: verify `INDEX.md` and commit.

## Required Checks

- [ ] capability boundary is clear before writing
- [ ] current truth, known gaps, non-goals, callers, and acceptance signal are recorded
- [ ] canonical terms, aliases to avoid, and ambiguity are resolved
- [ ] `INDEX.md` links to the capability file and relationship constraints are consistent
- [ ] spec changes are committed to Git

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
