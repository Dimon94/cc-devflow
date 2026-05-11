# Artifact Contract

cc-devflow artifacts follow two rules: progressive disclosure and one state owner.

## Progressive Disclosure

Every skill output should have a default path and deeper layers.

- Default layer: the next actor can see the current state, next action, and proof source quickly.
- Conditional layer: open only when scope, dependency, review, or conflict questions arise.
- Deep layer: full evidence, reasoning, or historical review, opened only for audit or recovery.

If a field has no clear opener and no downstream consumer, remove it.

## State Owners

| State | Owner artifact | Projection / derived readers |
| --- | --- | --- |
| Roadmap item status and progress | `devflow/roadmap.json` | `devflow/ROADMAP.md`, `devflow/BACKLOG.md`, handoff summaries |
| Capability/spec sync state | `devflow/changes/<change-key>/change-meta.json` | `planning/tasks.md`, `review/report-card.json`, handoff summaries |
| Execution task status | `planning/task-manifest.json.tasks[].status` | `planning/tasks.md` checkboxes, recovery summaries |
| Ready task / phase | derived from `tasks[].status`, `tasks[].phase`, and `tasks[].dependsOn` | `currentTaskId` cache, ready-task selector output |
| Runtime checkpoint state | `execution/tasks/<task-id>/checkpoint.json` | `events.jsonl`, recovery summaries |
| Review verdict | `review/report-card.json.verdict` | PR brief, release note, act gate |
| PR / remote queue truth | live GitHub API / `gh` output | local review notes and handoff summaries |
| Project postmortem facts and principles | `devflow/postmortems/` | planning recall, investigation hypotheses, task guardrails |

## Duplication Rules

- Machine artifacts may reference another owner by id or path, but must not copy its status lifecycle.
- Markdown projections must state their source instead of becoming editable truth.
- Derived fields must be described as derived/cache and must be recomputable.
- A skill must not create a new status field unless it also names the owner, lifecycle, projection readers, and validation gate.
- Task manifests must not duplicate PRD narrative, review-loop prose, source-trust details, completion shell commands, roadmap progress, or spec sync status.
- Project postmortems must cite stronger owner artifacts and Git evidence; they do not own roadmap progress, task status, review verdicts, or spec sync state.

## Required Check

Before changing any skill output, answer:

1. Who owns this state?
2. Is this field consumed directly, or is it a projection?
3. Can it be recomputed from a stronger source?
4. What validation fails if this state diverges?
