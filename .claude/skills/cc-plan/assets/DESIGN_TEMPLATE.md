# DESIGN

## Document Meta

- Requirement version:
- Design version:
- CC-Plan skill version:
- Output language:
- Requirement ID:
- Design mode: `full-design`
- Why not `tiny-design`:
- Design status: `draft` | `in-review` | `approved`
- Source roadmap item:
- Source roadmap version:
- Source roadmap skill version:
- Primary capability:
- Secondary capabilities:
- Date:
- Owner:

## Source Handoff

- Source stage:
- Why now from roadmap:
- Capability gap from roadmap:
- Expected spec delta:
- Inherited success signal:
- Inherited kill signal:
- Inherited dependencies:
- Inherited non-goals:
- Upstream evidence:
- Assumptions to re-validate:

## Capability Handoff

- Canonical capability spec:
- Related capability specs:
- Current truth to preserve:
- Current gaps:
- Intentional gaps:
- Spec sync target:

## Domain Language & Durable Decisions

- Language sources loaded:
- Canonical terms used:
- Terms avoided / aliases:
- Language conflicts:
- Native decision sources loaded:
- Capability spec / roadmap decision conflicts:
- Decisions worth long-term capability spec sync:

## Requirement Snapshot

- Raw ask:
- User:
- Pain:
- Smallest viable wedge:
- Out of scope:

> 写完这一段后，执行者应该能用一句话复述：
> “这次要解决的是什么，不解决什么，最小落地点是什么。”

## Success Criteria

- Observable success signals:
- Business / operator success signals:
- Abort signals:

## Options Considered

### Option A

- Role: `minimal viable` | `ideal architecture` | `hybrid`
- Shape:
- Reuses:
- Completeness:
- Pros:
- Cons:
- Risks:

### Option B

- Role: `minimal viable` | `ideal architecture` | `hybrid`
- Shape:
- Reuses:
- Completeness:
- Pros:
- Cons:
- Risks:

### Eliminated Options

- Option:
- Why eliminated:

## Approved Direction

- Approved option:
- Why this is the best trade-off now:
- Why not the other options now:
- What we explicitly rejected:
- Frozen decisions:
- Deferred questions:

## Design

- Modules touched:
- Data flow:
- Contracts:
- Error handling:
- Rollout / migration:

## Interface / Deep Module Check

| Surface | Callers | Public operations | Complexity hidden | Misuse risk | Shape decision |
|---------|---------|-------------------|-------------------|-------------|----------------|
|  |  |  |  |  |  |

> 新增或改动公共接口时，优先小接口深模块。若有两个合理形态，写清为什么没有选择另一个。

## Implementation Decision Horizon

| Phase | Decision `cc-do` would otherwise hit | Frozen answer | Evidence / owner |
|-------|--------------------------------------|---------------|------------------|
| Foundation |  |  |  |
| Core logic |  |  |  |
| Integration |  |  |  |
| Polish / tests |  |  |  |

## Invariant Impact

- Affected invariants:
- Invariants kept unchanged:
- New invariants introduced:

## Gap Changes

- Gaps closed by this change:
- New gaps introduced:
- Gaps intentionally left open:

## File Plan

| File | Change | Reason |
|------|--------|--------|
|  |  |  |

> 如果文件计划超过 5-8 个文件，先问自己：这是不是已经逼近 `full-design` 之外的需求膨胀。

## Implementation Surface Map

| Surface | Responsibility | Why here | Coupling risk | Split / merge decision |
|---------|----------------|----------|---------------|------------------------|
|  |  |  |  |  |

> 先锁定文件职责，再拆任务。执行者不应该在 `cc-do` 阶段重新决定代码该放哪里。

## Validation Strategy

- Test framework source:
- First failing tests:
- Test seams / public interfaces:
- Behavior assertions:
- Mock boundaries:
- Feedback loop types:
- Tracer bullet order:
- Red/Green/Refactor task chain:
- TDD exceptions:
- Regression tests required:
- Unit:
- Integration:
- E2E:
- Eval:
- Manual:
- Observability / evidence:

## Test Coverage Map

| Code path / user flow | Public seam | Behavior asserted | Existing coverage | Quality | Required test | Level | Mock boundary | Implementation-detail risk | Regression? |
|-----------------------|-------------|-------------------|-------------------|---------|---------------|-------|---------------|----------------------------|-------------|
|  |  |  |  | strong / happy-path-only / smoke-only / missing |  | unit / integration / e2e / eval | none / system boundary | low / medium / high | Yes / No |

## Error & Rescue Map

| Codepath | What can fail | Rescue action | User sees | Test evidence |
|----------|---------------|---------------|-----------|---------------|
|  |  |  |  |  |

## UI Design Gate

- Applies: Yes / No
- Design completeness score:
- What 10/10 means here:
- Existing design patterns to reuse:
- State coverage:

| Feature | Loading | Empty | Error | Success | Partial |
|---------|---------|-------|-------|---------|---------|
|  |  |  |  |  |  |

## DX / Operator Gate

- Applies: Yes / No
- Target developer / operator:
- Current first-success path:
- Target time to first value:
- Magic moment:
- Install / run / debug / upgrade risks:
- Required docs / examples / entrypoints:

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
|  |  |  |

## Review Gate

- Placeholder scan:
- Consistency scan:
- Scope scan:
- Ambiguity scan:
- Feasibility scan:
- Source alignment:
- Domain language scan:
- Implementation surface scan:
- Interface depth scan:
- Decision horizon scan:
- Error & rescue scan:
- Test framework / regression scan:
- Test seam / mock boundary scan:
- Tracer bullet scan:
- UI / interaction review summary:
- DX / operator review summary:
- Test-first readiness:
- Review calibration:
- Auto-decided items:
- Taste decisions:
- User challenges:
- Recommendation:

## Approval

- User approval status:
- Follow-up changes after review:

## First-Read Test

- 10 秒内能否看出这次为什么不是 `tiny-design`
- 10 秒内能否看出批准方案和被拒方案的边界
- `cc-do` 是否还能被迫二次设计；如果会，说明这里还不够清楚
