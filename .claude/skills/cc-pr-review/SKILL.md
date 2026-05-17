---
name: cc-pr-review
version: 1.2.0
description: Use in a separate session to review one remote GitHub PR before landing. It reports findings from PR truth and current diff without writing process files.
triggers:
  - review 这个 PR
  - 单独会话 review PR
  - review remote PR
  - pre-landing PR review
reads:
  - ../cc-review/SKILL.md
  - ../cc-check/SKILL.md
  - GitHub pull request
  - devflow/changes/<change-key>/task.md
  - devflow/changes/<change-key>/handoff/pr-brief.md
  - references/checklist-contract.md
writes:
  - path: GitHub pull request comments or review
    durability: remote
    required: false
    when: remote review feedback is posted
effects:
  - remote PR review
  - finding triage
  - fix or landing recommendation
entry_gate:
  - Freeze PR title, body, commits, head branch, base branch, checks, linked issues, and current diff from GitHub.
  - Read local `task.md` and `pr-brief.md` when the PR links to a change key.
  - Do not merge, push main, or write local process files.
exit_criteria:
  - Review result is approved-for-landing, changes-requested, needs-clarification, or blocked.
  - Findings cite concrete PR diff, command output, checks, local task facts, or missing evidence.
  - Non-trivial findings include an ASCII Branch Chain that traces PR source, changed node, upstream contract, downstream landing risk, and route; tree connector characters stay ASCII while node text follows the configured output language.
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
  read_files: 10
  search_steps: 6
  shell_commands: 12
---

# CC-PR-Review

## Read First

1. `references/checklist-contract.md`

Review remote PR reality. Do not merge.

Build the review from:

- live PR metadata
- true PR commits
- latest checks
- PR diff
- `task.md` and `handoff/pr-brief.md` when available

Output findings in the response or GitHub review only. Do not write local process files.

For each non-trivial finding, include:

Language rule: keep `|--`, `` `-- ``, `|`, spaces, and punctuation ASCII; write labels, explanations, findings, and evidence summaries in the PR/task/handoff output language, falling back to the current conversation language when unavailable. Use the Label table as the shared source for chain titles, node labels, and placeholder text.

Label table:

| Semantic slot | en | zh-CN |
| --- | --- | --- |
| prReviewChain | PR Review Chain | PR 审查链 |
| findingMarker | FINDING | 问题 |
| prSource | PR source | PR 来源 |
| changedNode | Changed node | 变更节点 |
| upstreamContract | upstream contract | 上游合同 |
| firstAffectedSeam | first affected seam | 首个受影响边界 |
| downstreamLandingRisk | Downstream landing risk | 下游合并风险 |
| route | Route | 路线 |

```text
<prReviewChain>
<findingMarker>: <severity + short name>
|-- <prSource>: <PR number / commit / diff hunk / check>
|-- <changedNode>: <file / behavior / artifact>
|   |-- <upstreamContract>: <task / spec / prompt / provider / API>
|   `-- <firstAffectedSeam>: <runtime / user / operator / package>
|-- <downstreamLandingRisk>: <merge / release / main parity / sibling work>
`-- <route>: <cc-dev / cc-do / cc-review / cc-pr-land / stop>
```


## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.
