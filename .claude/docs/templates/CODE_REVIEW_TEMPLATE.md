# Code Review Report Template

```
---
reqId: {{REQ_ID}}
phase: {{PHASE_NAME}}
phaseSlug: {{PHASE_SLUG}}
completedTasks:
  - {{TASK_ID}} {{TASK_DESC}}
generatedAt: {{ISO8601_TIMESTAMP}}
reviewer: code-reviewer
phaseStatus: {{ready_for_next_phase|blocked}}
decision: {{approve|comment|request_changes|blocker}}
---

- **What changed**: {{concise-overview-within-prd-epic-scope}}
- **Top risks**:
  - {{risk-1-or-"None"}}
  - {{risk-2}}
- **Alignment Check**:
  - **PRD scope**: {{within_scope|out_of_scope}} — {{evidence}}
  - **EPIC alignment**: {{aligned|misaligned}} — {{evidence}}
- **Previous review follow-up**:
  - {{status of prior findings or "No prior review"}}

## Findings

{{For each finding:}}
- [{{severity}}] {{category}} — {{title}}
  - **Where**: `{{file}}:{{line_range}}`
  - **Evidence**: {{brief snippet or description}}
  - **Impact**: {{user / system impact}}
  - **Scope Fit**: {{affirm requirement reference or flag scope creep}}
  - **Recommendation**: {{minimal fix or rollback}}
  - **Tests**: {{tests to add/run}}

## Performance & Reliability
- Hotspots: {{items|None}}
- Complexity notes: {{items|None}}
- Monitoring/Benchmarks: {{plan|None}}

## Security & Compliance
- Risks: {{items|None}}
- Secrets/PII: {{status}}
- Hardening suggestions: {{items|None}}

## Testing & Verification
- Coverage signals: {{summary}}
- Gaps: {{items|None}}
- Suggested test plan: {{Given/When/Then bullets|None}}

## Documentation & DX
- Updates needed: {{items|None}}
- Observability: {{logging/metrics recommendations|None}}

## Decision
- **Phase Gate Result**: {{Pass|Fail}}
- **Required Actions Before Next Phase**:
  1. {{action or "None"}}
- **Optional Follow-ups**:
  1. {{item or "None"}}

## Next Actions for Main Agent
1. {{If decision fail → fix blockers referencing findings}}
2. {{If pass → proceed guidance, e.g., start next phase}}
```

> **Instructions**:
> - Never introduce features or fixes outside PRD/EPIC scope. Flag any scope creep.
> - Reference prior code reviews to confirm resolutions or carry-over risks.
> - Set `phaseStatus` to `blocked` if any blocker/high severity issues remain; otherwise `ready_for_next_phase`.
