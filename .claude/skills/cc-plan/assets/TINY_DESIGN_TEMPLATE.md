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

## Interface Shape

- Callers:
- Public operations:
- Complexity hidden:
- Misuse risk:
- Why this stays simple:

## Implementation Surface Map

| Surface | Responsibility | Why here | Coupling risk |
|---------|----------------|----------|---------------|
|  |  |  |  |

## Validation

- Test framework source:
- First failing test:
- Test seam / public interface:
- Behavior asserted:
- Mock boundary:
- Feedback loop type:
- Tracer bullet order:
- Green implementation check:
- Refactor checkpoint:
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
- Test framework / regression scan:
- Test seam / mock boundary scan:
- Tracer bullet scan:
- Source trust boundary scan:
- External conflict scan:
- Ambiguity gate:
- Review loop status:
- Test-first readiness:
- Review calibration:
- Final recommendation:

## Bounded Review Loop

- Attempt:
- Max attempts:
- Repeated concern fingerprints:
- Stall reason:
- Reroute if stalled:

## Approval

- User approval status:
- Deferred questions:

## First-Read Test

- 一眼能看出这次为什么够小
- 一眼能看出什么情况会逼它升级成 `full-design`
- `cc-do` 看完不会继续追问“那接口 / 边界到底怎么算”
