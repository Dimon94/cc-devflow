# Review Methods

Use this reference for every `cc-review` run. It defines the method library. Load branch-specific references for concrete workflow steps.

## Method Selection

Pick every method needed by the current risk. This is a routing map, not a finding cap:

| Risk | Method |
| --- | --- |
| unclear goal | goal tree |
| repeated symptom | current reality tree |
| hidden tradeoff | conflict diagram |
| uncertain fix impact | future reality tree |
| implementation complexity | logic tree and smell scan |
| UI/runtime mismatch | E2E/plugin verification |
| code quality or simplification risk | cc-simplify reference plus smell scan |
| security, observability, release, or test-suite hardening risk | hardening specialists |
| broad implementation diff | risk-lane review swarm profile |

Selected methods stay in scratch reasoning and final response/task updates. Do not write process files.

## ASCII Branch Chains

For any plan, investigation, PR, broad implementation, or code-smell finding, include a compact ASCII tree in the durable task update or review output. Keep `|--`, `` `-- ``, `|`, spaces, and punctuation ASCII; write labels, explanations, findings, and evidence summaries in the configured output language. Resolve language from `task.md` `Output language`, PR/task/handoff language fields, then the current conversation language.

Build the chain around the faulty node. Walk upward through three concrete layers when available: direct input/caller proof, governing contract/spec/provider, then source intent/roadmap. Walk downward through three concrete layers when available: first affected seam, behavior or artifact, then release or maintenance risk. If a layer cannot be proven from current evidence, keep the layer and mark it `missing evidence` or `blocked`; do not compress the gap into a generic source or impact line.

Label table:

| Semantic slot | en | zh-CN |
| --- | --- | --- |
| reviewChain | Review Chain | 审查链 |
| findingMarker | FINDING | 问题 |
| evidence | Evidence | 证据 |
| diagnosis | Diagnosis | 诊断 |
| cognitiveLayers | Cognitive layers | 认知层 |
| causalPath | Causal path | 因果链 |
| upstreamChain | Upstream chain | 上游链路 |
| upstreamInput | upstream L1 direct input/caller proof | 上游 L1 直接输入/调用方证据 |
| upstreamContract | upstream L2 contract/spec/provider | 上游 L2 合同/规格/provider |
| upstreamOrigin | upstream L3 source intent/roadmap | 上游 L3 来源意图/roadmap |
| faultNode | Fault node | 错误节点 |
| whyWrong | why wrong | 错误原因 |
| downstreamChain | Downstream chain | 下游链路 |
| firstAffectedSeam | first affected seam | 首个受影响边界 |
| downstreamBehavior | downstream L2 behavior/artifact | 下游 L2 行为/产物 |
| downstreamReleaseRisk | downstream L3 release/maintenance risk | 下游 L3 发布/维护风险 |
| downstreamImpact | Downstream impact | 下游影响 |
| fixRoute | Fix route | 修复路线 |

```text
<reviewChain>
<findingMarker>: <severity + short name>
|-- <evidence>: <task / diff / PR / log / prompt / provider contract / missing evidence>
|-- <diagnosis>: <violated contract / smell / root cause>
|-- <cognitiveLayers>: <phenomenon -> essence -> philosophy -> integration -> output>
|-- <causalPath>: <upstream cause -> faulty node -> downstream consequence>
|-- <upstreamChain>: <walk upward from the fault node; include three concrete layers when available>
|   |-- <upstreamInput>: <direct caller / input / fixture / baseline / command proof>
|   |-- <upstreamContract>: <spec / API / schema / prompt / provider contract>
|   `-- <upstreamOrigin>: <user request / task / issue / roadmap / missing evidence or blocked>
|-- <faultNode>: <file / section / behavior>
|   |-- <whyWrong>: <violated contract or smell>
|   `-- <firstAffectedSeam>: <public seam / caller / artifact>
|-- <downstreamChain>: <walk downward from the fault node; include three concrete layers when available>
|   |-- <firstAffectedSeam>: <public seam / caller / artifact>
|   |-- <downstreamBehavior>: <runtime behavior / generated output / user-visible result>
|   `-- <downstreamReleaseRisk>: <release / main parity / sibling work / maintenance / missing evidence or blocked>
|-- <downstreamImpact>: <user / operator / release / maintenance>
`-- <fixRoute>: <cc-plan / cc-investigate / cc-do / cc-check / cc-act / stop>
```

If prompt text, agent instructions, model/provider parameters, or generated artifacts are part of the chain, name the exact prompt/provider contract or write `missing evidence / blocked`.

## Review Nodes

Before findings, mentally create ordered review nodes:

```text
R001 plan.strategy.outcome
  target: task.md
  method: goal tree
  check: outcome and scope consistency

R101 implementation.contract.public-seam
  target: changed code + tests
  method: contract fidelity
  check: public behavior matches task.md
```

Node rules:

- one node reviews one coherent question, artifact, or changed surface
- every selected method creates at least one node
- every changed file or user-facing surface is assigned to a node or explicitly skipped
- every node ends as `checked`, `skipped`, or `blocked`
- no finding limit exists while nodes remain unchecked
- prior clean conclusions can be reused only when Git proves the target and dependencies did not change

## Risk-Lane Review Swarm Profile

Use this profile when a broad implementation diff, PR landing review, or mixed review benefits from independent context. The profile is a default decomposition, not a requirement to manufacture findings.

| Lane | Reviewer question |
| --- | --- |
| intent-regression | Does the diff match the intended behavior without extra behavior drift, broken edge cases, fallback loss, or caller/callee contract drift? |
| security-privacy | Did the diff weaken auth, validation, secret handling, sensitive data boundaries, defaults, or trust of external input? |
| performance-reliability | Did the diff add duplicate work, hot-path cost, missing cleanup, retry storms, ordering races, or brittle failure handling? |
| contracts-coverage | Did the diff miss API/schema/type/config/flag alignment, migration fallout, regression tests, logs, metrics, assertions, or error paths? |
| hardening-specialists | Which security, observability, release-readiness, or test-strategy specialists are required by the touched surfaces? |

Small diffs may use one combined reviewer that covers all lanes. Large or multi-surface diffs should assign separate reviewers for the highest-risk lanes when the host supports subagents.

## Hardening Specialists

Use `hardening-specialists.md` when the review scope touches production
controls rather than ordinary code quality:

- security-hardening for auth, roles, secrets, untrusted input, file/network,
  web security, dependency, and sensitive logging risk.
- observability-hardening for opaque operations, missing correlation, logs,
  error classes, metrics, traces, user-visible status, and redaction risk.
- release-readiness-hardening for env validation, deploy gates, migrations,
  health/readiness, smoke tests, rollback, feature flags, and post-deploy checks.
- test-strategy-hardening for suite trust, flake, skip, slow tests, overmocking,
  missing contract/regression/e2e/visual/smoke coverage, and low-value tests.

Specialists do not change the output persistence model. They only select review
nodes and sharpen findings. Each selected specialist ends as checked, skipped,
or blocked in the normal review output.

## Aggregation

The main thread owns aggregation:

- merge duplicate findings under the clearest evidence
- reject style preferences, nits, and speculative concerns with no concrete impact
- downgrade low-confidence notes unless they point to critical impact
- convert intent-unclear claims into decision questions instead of findings
- order final findings by severity, confidence, and current-scope impact

Subagent output is evidence input, not verdict.

## Thinking Tools

### Goal Tree

Use when the plan has too many proposed actions and not enough outcome clarity.

```text
GOAL
├── necessary condition A
│   ├── measurable signal
│   └── blocked by
├── necessary condition B
└── NOT IN SCOPE
```

### Current Reality Tree

Use for bugs and recurring failures.

```text
SYMPTOM
├── direct cause
│   └── deeper cause
├── enabling condition
└── missing control
```

### Conflict Diagram

Use when two requirements appear incompatible.

```text
Objective
├── Need A -> Want X
└── Need B -> Want not-X
Assumption to break: ...
```

### Future Reality Tree

Use before recommending a non-trivial redesign.

```text
CHANGE
├── desired effect
├── possible negative branch
│   └── prevention
└── verification signal
```

### Logic Tree

Use for implementation reviews.

```text
Entry point
├── path A
│   ├── happy
│   ├── empty
│   └── error
└── path B
```

## Code Smell Taxonomy

Only report smells inside the current requirement blast radius or smells made worse by the current work.

| Smell | Review question | Preferred fix shape |
| --- | --- | --- |
| rigidity | Does a small change force unrelated edits? | move decision to one owner |
| duplication | Is the same logic repeated with small variations? | reuse existing helper or make one narrow helper |
| cycle | Do modules know each other's internals? | invert dependency or extract boundary |
| fragility | Can one change break unrelated behavior? | isolate side effects and add focused tests |
| obscurity | Is intent hidden behind clever names or control flow? | rename, split, or make data shape explicit |
| data-clump | Do fields always travel together? | group them into one object/value |
| unnecessary-complexity | Is abstraction solving a hypothetical future? | delete seam or collapse to direct code |

## Severity

- `critical`: ships wrong behavior, data/security risk, silent failure, broken root cause, or impossible verification.
- `important`: likely maintenance, test, UX, DX, performance, or operability problem in current scope.
- `advisory`: good improvement but not required for this change.

## Confidence

- `9-10`: directly verified in code, artifact, command output, UI run, or log.
- `7-8`: strong evidence from nearby patterns and diff.
- `5-6`: plausible but needs confirmation; mark as verify-first.
- `<5`: do not put in main findings unless critical impact.

## Decision Questions

Ask only when a finding requires user judgment. Do not stop the whole review at the first decision unless that answer blocks the next review node.

Plan decisions are written to `task.md`. Implementation repair choices stay in the response.
