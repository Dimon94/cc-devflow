---
name: cc-pr-review
version: 1.7.1
description: Use in a separate session to review one remote GitHub PR before landing, including PR-scoped complexity, hardening, and productization risk. It reports findings from PR truth and current diff without writing process files.
triggers:
  - review 这个 PR
  - 单独会话 review PR
  - review remote PR
  - pre-landing PR review
  - PR 复杂度专项 review
  - PR hardening review
  - PR production readiness review
reads:
  - ../cc-review/SKILL.md
  - ../cc-check/SKILL.md
  - ../cc-review/references/hardening-specialists.md
  - ../cc-review/references/productization-surfaces.md
  - GitHub pull request
  - devflow/changes/<change-key>/task.md
  - devflow/changes/<change-key>/handoff/pr-brief.md
  - references/checklist-contract.md
  - references/complexity-optimization-playbook.md
  - references/complexity-report-template.md
  - scripts/analyze_complexity.py
writes:
  - path: GitHub pull request comments or review
    durability: remote
    required: false
    when: remote review feedback is posted
effects:
  - remote PR review
  - finding triage
  - PR-scoped complexity hotspot review
  - PR-scoped hardening specialist review
  - PR-scoped productization surface review
  - fix or landing recommendation
entry_gate:
  - Freeze PR title, body, commits, head branch, base branch, checks, linked issues, and current diff from GitHub.
  - Read local `task.md` and `pr-brief.md` when the PR links to a change key.
  - When the PR diff touches loops, rendering, repeated scans, database/API iteration, large-input paths, or performance-sensitive code, select the built-in complexity facet and treat scanner output only as leads.
  - When the PR diff touches auth, secrets, untrusted input, telemetry, long-running work, release/deploy gates, broad test-suite trust, or product control surfaces, select the relevant hardening or productization facets from `cc-review` references.
  - Do not merge, push main, or write local process files.
exit_criteria:
  - Review result is approved-for-landing, changes-requested, needs-clarification, or blocked.
  - Findings cite concrete PR diff, command output, checks, local task facts, or missing evidence.
  - Non-trivial findings include an ASCII Branch Chain that records evidence, diagnosis, Phenomenal/Essential/Philosophical layers, causal path, at least three upstream layers from PR source to contract/input proof, at least three downstream layers from first affected seam to landing/release risk, changed node, and route; tree connector characters stay ASCII while node text follows the configured output language.
  - Complexity findings include current pattern, estimated current complexity, recommended change, estimated complexity after, risk level, and tests or measurements needed.
  - Selected hardening specialists end as checked, skipped with reason, or blocked with missing evidence; findings name reviewed surface, risk gate, proof path, and residual risk.
  - Selected productization findings name the missing or duplicated product control surface, affected workflow, smallest product contract or fix, validation path, and residual risk.
  - Required fixes route back to cc-dev or cc-do; clean PRs route to cc-pr-land.
  - No local process file is created.
reroutes:
  - when: Required fixes are inside the PR implementation scope.
    target: cc-dev
  - when: The PR is clean and ready to land.
    target: cc-pr-land
  - when: The review needs deeper local diff review.
    target: cc-review
tool_budget:
  read_files: 14
  search_steps: 8
  shell_commands: 14
---

# CC-PR-Review

## Read First

1. `references/checklist-contract.md`
2. Complexity hotspot review, when selected: `references/complexity-optimization-playbook.md` and `references/complexity-report-template.md`
3. Hardening and productization facets, when selected: `../cc-review/references/hardening-specialists.md` and `../cc-review/references/productization-surfaces.md`

Review remote PR reality. Do not merge.

Build the review from:

- live PR metadata
- true PR commits
- latest checks
- PR diff
- `task.md` and `handoff/pr-brief.md` when available

Complexity hotspot review is built in. It must not call or depend on an external `complexity-optimizer` skill. Use only the local `scripts/analyze_complexity.py` and local complexity references copied into this skill directory.

Use the complexity facet when PR changes touch nested scans, repeated membership/search, sort-in-loop, pairwise comparisons, render recomputation, N+1 database/API loops, large input paths, or performance-sensitive shared utilities. Scanner output is only a lead; accepted findings must cite the PR diff or checked-out file lines and explain behavior-equivalence risk.

Hardening and productization facets are also built in through `cc-review`
references. They are PR-scoped lenses, not quotas. Select only the surfaces
present in the PR diff, linked task, or PR body:

- `security-hardening`: auth, roles, sessions, API keys, secrets, untrusted
  input, uploads/downloads, SSRF/network egress, webhooks, CORS/CSRF, rate
  limits, sensitive logging, or dependency risk.
- `observability-hardening`: opaque failures, long-running work, queues/jobs,
  provider calls, deploy/boot failures, structured logs, request IDs, traces,
  metrics, dashboards, alerting, or user-visible status.
- `release-readiness-hardening`: env/runtime config, migrations, deploy path,
  health/readiness, smoke tests, rollback, feature flags, staging/production
  proof, or post-deploy monitoring.
- `test-strategy-hardening`: broad suite trust, flaky/skipped/slow tests,
  missing contract/regression tests, overmocking, low-value snapshots, missing
  e2e/visual/smoke coverage, or weak proof value.
- Productization surface: shared action layer, programmatic API, agent docs,
  audit trail, admin/manageability UI, feature flags, idempotency, or operator
  paths.

For every selected facet, close it as `checked`, `skipped:<reason>`, or
`blocked:<missing evidence>`. A finding must name the reviewed surface, violated
control or missing product surface, risk gate, proof path, smallest safe fix,
route, and residual risk. Do not say the PR is secure, observable, ready to
ship, or productized; say which PR surfaces were reviewed and what remains
uncertain.

Broad scan command:

```bash
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format markdown
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format json
```

Each accepted complexity finding additionally includes:

- current pattern
- estimated current complexity
- recommended change
- estimated complexity after
- behavior-equivalence argument
- risk level
- tests, benchmarks, or manual checks needed

Output findings in the response or GitHub review only. Do not write local process files.

For each non-trivial finding, include evidence, diagnosis, Phenomenal/Essential/Philosophical layers, causal path, at least three upstream layers, and at least three downstream layers. Do not fabricate missing context; mark the exact layer as missing evidence and choose `blocked`, `needs-clarification`, or a repair route when the missing layer affects the verdict.

Cognitive layers are mandatory for non-trivial findings:

- 现象层：症状的表面涟漪，问题的直观呈现
- 本质层：系统的深层肌理，根因的隐秘逻辑
- 哲学层:设计的永恒真理,架构的本质美学
- 思维路径：现象接收 → 本质诊断 → 哲学沉思 → 本质整合 → 现象输出

- Phenomenal layer: surface symptoms, visible PR risk, failing trace, missing check, or direct behavior.
- Essential layer: system structure, root cause, violated invariant, contract drift, or hidden coupling.
- Philosophical layer: design principle, architecture truth, and why the recommended shape is correct.
- Thought path: phenomenon received -> essence diagnosed -> philosophy considered -> essence integrated -> phenomenon output.

Language rule: keep `|--`, `` `-- ``, `|`, spaces, and punctuation ASCII; write labels, explanations, findings, and evidence summaries in the PR/task/handoff output language, falling back to the current conversation language when unavailable. Use the Label table as the shared source for chain titles, node labels, and placeholder text.

Label table:

| Semantic slot | en | zh-CN |
| --- | --- | --- |
| prReviewChain | PR Review Chain | PR 审查链 |
| findingMarker | FINDING | 问题 |
| evidence | Evidence | 证据 |
| diagnosis | Diagnosis | 诊断 |
| cognitiveLayers | Cognitive layers | 认知层 |
| phenomenalLayer | Phenomenal layer | 现象层 |
| essentialLayer | Essential layer | 本质层 |
| philosophicalLayer | Philosophical layer | 哲学层 |
| thoughtPath | Thought path | 思维路径 |
| causalPath | Causal path | 因果链 |
| upstreamChain | Upstream chain | 上游链路 |
| prSource | PR source | PR 来源 |
| upstreamTask | upstream L2 task/spec | 上游 L2 任务/规格 |
| upstreamProof | upstream L3 baseline/check/caller proof | 上游 L3 基线/检查/调用方证据 |
| changedNode | Changed node | 变更节点 |
| upstreamContract | upstream contract | 上游合同 |
| downstreamChain | Downstream chain | 下游链路 |
| firstAffectedSeam | first affected seam | 首个受影响边界 |
| downstreamBehavior | downstream L2 behavior/artifact | 下游 L2 行为/产物 |
| downstreamLandingRisk | Downstream landing risk | 下游合并风险 |
| downstreamReleaseRisk | downstream L3 release/main parity risk | 下游 L3 发布/main parity 风险 |
| route | Route | 路线 |

```text
<prReviewChain>
<findingMarker>: <severity + short name>
|-- <evidence>: <PR number / commit / diff hunk / check / task fact / missing evidence>
|-- <diagnosis>: <violated PR contract / behavior regression / smell / root cause>
|-- <cognitiveLayers>: <phenomenon -> essence -> philosophy -> integration -> output>
|   |-- <phenomenalLayer>: <surface symptom / visible PR risk / failing or missing proof>
|   |-- <essentialLayer>: <system structure / root cause / violated invariant>
|   |-- <philosophicalLayer>: <design principle / architectural truth / why this shape is right>
|   `-- <thoughtPath>: <phenomenon received -> essence diagnosed -> philosophy considered -> essence integrated -> phenomenon output>
|-- <causalPath>: <PR source -> changed node -> downstream landing consequence>
|-- <upstreamChain>: <must include at least three concrete layers>
|   |-- <prSource>: <PR number / commit / diff hunk / check>
|   |-- <upstreamTask>: <linked task / issue / spec / PR body claim>
|   `-- <upstreamProof>: <base behavior / caller contract / CI check / local command proof>
|-- <changedNode>: <file / behavior / artifact>
|   |-- <upstreamContract>: <task / spec / prompt / provider / API>
|   `-- <firstAffectedSeam>: <runtime / user / operator / package>
|-- <downstreamChain>: <must include at least three concrete layers>
|   |-- <firstAffectedSeam>: <runtime / user / operator / package>
|   |-- <downstreamBehavior>: <runtime behavior / generated artifact / user-visible result>
|   `-- <downstreamReleaseRisk>: <merge / release / main parity / sibling work>
|-- <downstreamLandingRisk>: <merge / release / main parity / sibling work summary>
`-- <route>: <cc-dev / cc-do / cc-review / cc-pr-land / stop>
```


## Default Output

Return PR review results in this shape:

1. Verdict: `approved-for-landing`, `changes-requested`, `needs-clarification`, or `blocked`.
2. Evidence: PR diff, checks, task facts, command output, or missing proof.
3. Findings: ordered by severity, each with file/line or PR hunk plus evidence, diagnosis, cognitive layers, causal path, three upstream layers, and three downstream layers when non-trivial.
4. Complexity: checked, skipped with reason, or findings.
5. Hardening/productization: selected facets checked, skipped with reason, blocked with missing evidence, or findings.
6. Route: `cc-pr-land`, `cc-dev`, `cc-review`, or `stop`.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.
