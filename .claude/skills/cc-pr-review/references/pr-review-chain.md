# PR Review Chain

Use this reference for every non-trivial `cc-pr-review` finding. Output stays in
the current response or GitHub review; do not write local process files.

## Chain Rules

For each non-trivial finding, include evidence, diagnosis,
Phenomenal/Essential/Philosophical layers, causal path, at least three upstream
layers, and at least three downstream layers. Do not fabricate missing context;
mark the exact layer as `missing evidence` and choose `blocked`,
`needs-clarification`, or a repair route when the missing layer affects the
verdict.

Cognitive layers:

- 现象层：症状的表面涟漪，问题的直观呈现
- 本质层：系统的深层肌理，根因的隐秘逻辑
- 哲学层:设计的永恒真理,架构的本质美学
- 思维路径：现象接收 -> 本质诊断 -> 哲学沉思 -> 本质整合 -> 现象输出

English fallback:

- Phenomenal layer: surface symptoms, visible PR risk, failing trace, missing
  check, or direct behavior.
- Essential layer: system structure, root cause, violated invariant, contract
  drift, or hidden coupling.
- Philosophical layer: design principle, architecture truth, and why the
  recommended shape is correct.
- Thought path: phenomenon received -> essence diagnosed -> philosophy
  considered -> essence integrated -> phenomenon output.

Language rule: keep `|--`, `` `-- ``, `|`, spaces, and punctuation ASCII; write
labels, explanations, findings, and evidence summaries in the PR/task/handoff
output language, falling back to the current conversation language.

## Label Table

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
