# cc-roadmap Checklist Contract

## Diagnosis

Roadmap decisions already have strong gates, but they are spread across funnel prose and can be skipped when the agent jumps directly to stages or RM items.

## Checklist Mode

- Mode: do-confirm
- Evidence sink: `devflow/roadmap.json`, rendered roadmap docs, and the final route recommendation
- Failure route: `cc-plan` for ready single requirements, `cc-next` for ready queue work, or stop with `needs-evidence`

## Pause Points

1. Before recommending stages: classify project direction and evidence maturity.
2. Before writing roadmap state: run funnel rounds as answered, asked, or explicitly skipped.
3. Before exit: verify each ready item has route, dependency, kill signal, and non-goals.

## Required Checks

- [ ] current roadmap and capability specs were read before naming stages
- [ ] project-direction class and evidence maturity were selected before priority ranking
- [ ] reachable user/operator, current workaround, first success signal, and kill signal are named
- [ ] 1-3 stages have dependencies, non-goals, exit signals, and AI leverage verdicts
- [ ] ready RM items include review gate hints for plan and implementation risk
- [ ] ready RM handoff can enter `cc-plan` without strategic guessing

## Exit Rule

Do not exit this skill with a success claim until every required check is satisfied, explicitly skipped with a reason, or routed to the failure route above. The checklist is not a new artifact to fill out; it is the execution gate that must be reflected in the skill's normal evidence sink.
