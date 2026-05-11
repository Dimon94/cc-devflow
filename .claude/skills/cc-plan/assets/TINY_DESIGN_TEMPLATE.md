# DESIGN

## Document Meta

- Requirement version:
- Design version:
- CC-Plan skill version:
- Output language:
- Requirement ID:
- Design mode: `tiny-design`
- Why this stays `tiny-design`:
- Approval status: `draft` | `in-review` | `approved`
- Source roadmap item:
- Source roadmap version:
- Roadmap sync status:
- Primary capability:
- Secondary capabilities:

## Progressive Disclosure Index

- Default read: Frozen Design Card, Validation, Main Risk, Approval.
- Open for scope questions: Source Handoff, Capability Handoff, Implementation Surface Map.
- Open for trust/conflict questions: Source Trust Boundary, External Document Conflicts, Domain Language & Decisions.
- Open for audit/recovery: Review Gate, Bounded Review Loop, Decision Questions.

## Source Handoff

- Why now:
- Capability gap:
- Expected spec delta:
- Inherited success signal:
- Inherited kill signal:
- Inherited non-goals:
- Upstream evidence:

## Source Trust Boundary

- Internal contracts:
- Repo evidence:
- External evidence:
- Untrusted text:
- Instruction risk:

## Assumptions Preview & Ambiguity Gate

- WHAT ambiguity score:
- WHY ambiguity score:
- Assumptions preview:
- Gate verdict: `pass` | `blocked`
- Blocked question if any:

## External Document Conflicts

- Auto-resolved:
- Competing:
- Unresolved blockers:

## AI Leverage Decision Lens

- Real user / operator:
- Status quo workaround:
- Human-team effort for full scope:
- CC / agent effort for full scope:
- AI compression ratio:
- Complete-lake boundary:
- Ocean boundary:
- Scope recommendation: `boil-lake` | `sharp-wedge`
- Cost model:
- Verdict: `boil-lake` | `sharp-wedge` | `needs-evidence` | `pivot`
- Missing evidence or pivot reason:

## External Best-Practice Validation

- Needed: Yes / No
- Decision status: not-needed / ask-user / approved / declined / search-unavailable
- Decision question:
- Privacy guard: generalized terms only; no project names, private requirements, customer names, secrets, logs, or proprietary concepts
- Generalized search terms:
- Sources checked:
- Conventional wisdom:
- Current discourse:
- Repo-fit verdict: confirmed / adjusted / contradicted / skipped
- Changes to frozen design:
- Skipped reason:

## Capability Handoff

- Canonical capability spec:
- Current truth to preserve:
- Current gaps:
- Spec sync target:

## Domain Language & Decisions

- Language sources loaded:
- Canonical terms used:
- Language / spec decision conflicts:
- Decisions worth long-term spec sync:

## Frozen Design Card

- Change:
- Keep out:
- Touched files:
- Contract changes:
- Invariant impact:
- Gap changes:
- Key decisions that `cc-do` must not re-decide:
- Upgrade trigger to `full-design`:

> `tiny-design` 是短设计，不是免设计。没有明确批准状态、验证证据和升级触发条件，就不能继续拆任务。

## PRD-Grade Brief

- Problem statement:
- Solution summary:
- Actors / personas:
- User stories:
  - US-001: As a `<actor>`, I want `<feature>`, so that `<benefit>`.
- Implementation decisions:
- Testing decisions:
- Out of scope:
- Further notes:

> 即使是 tiny-design，也要保留用户视角和验收口径。这里只写 durable 行为、契约和模块责任，不写易过期的行号或代码片段。

## Interface Shape

- Callers:
- Public operations:
- Complexity hidden:
- Misuse risk:
- Why this stays simple:

## Interface Testability

- Dependency shape: injected / created internally
- Result shape: returned result / side effect
- Boundary adapter shape: specific operation / generic fetcher / N/A
- Test setup complexity: simple / conditional / brittle
- Decision:

## Implementation Surface Map

| Surface | Responsibility | Why here | Coupling risk |
|---------|----------------|----------|---------------|
|  |  |  |  |

## Validation

- Test framework source:
- First failing test:
- Test seam / public interface:
- Spec-style test name:
- One logical behavior:
- Public verification path:
- Behavior asserted:
- Mock boundary:
- Boundary adapter shape:
- Feedback loop type:
- Tracer bullet order:
- Green implementation check:
- Green minimality guard:
- Refactor checkpoint:
- Refactor candidates:
- TDD exceptions:
- Regression test required:
- Primary check:
- Secondary checks:

## Roadmap Sync Gate

- Source RM:
- Locate command:
- Sync command:
- Updated files: `devflow/roadmap.json`, `devflow/ROADMAP.md`, optional `devflow/BACKLOG.md`
- Status after sync: `Planned` | `Split` | `Rerouted` | `No source RM`
- Progress after sync:
- No-op reason:
- Blocking mismatch:
- Evidence to collect:

## Conditional Design Checks

- UI / interaction scope: Yes / No
- UI state coverage if applicable:
- Developer / operator-facing scope: Yes / No
- Target developer / operator if applicable:
- Time to first value if applicable:
- Magic moment if applicable:

## Main Risk

- Risk:
- Mitigation:

## Review Gate

- Placeholder scan:
- Consistency scan:
- Scope scan:
- Ambiguity scan:
- Feasibility scan:
- Domain language scan:
- Implementation surface scan:
- Interface depth scan:
- Interface testability scan:
- Test framework / regression scan:
- Test seam / mock boundary scan:
- Public verification path scan:
- Tracer bullet scan:
- Green minimality / refactor candidate scan:
- PRD brief scan:
- Source trust boundary scan:
- AI Leverage Decision Lens scan:
- External best-practice scan:
- External conflict scan:
- Ambiguity gate:
- Review loop status:
- Decision question scan:
- Test-first readiness:
- Review calibration:
- Final recommendation:

## Bounded Review Loop

- Attempt:
- Max attempts:
- Repeated concern fingerprints:
- Stall reason:
- Reroute if stalled:

## Decision Questions

| ID | Gate | Known evidence | Recommendation | User choice | Impact on `cc-do` | Status |
|----|------|----------------|----------------|-------------|-------------------|--------|
| D1 | planning-mode / ambiguity-blocker / approach-approval / taste-or-user-challenge / final-design-approval |  |  |  |  | asked / answered / auto-decided |

## Approval

- User approval status:
- Deferred questions:

## First-Read Test

- 一眼能看出这次为什么够小
- 一眼能看出什么情况会逼它升级成 `full-design`
- `cc-do` 看完不会继续追问“那接口 / 边界到底怎么算”
