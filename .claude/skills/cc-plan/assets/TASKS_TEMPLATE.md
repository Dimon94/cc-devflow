# task.md

## Plan Meta

- CC-Plan skill version:
- Work branch:
- Output language:
- Source roadmap item:

## Contract Summary

Change:
Mode: plan
Profile: tiny-design | full-design
Approval:

Goal:
-

Do Not Do:
-

Source Handoff:
- Roadmap / issue / user source:
- Repo evidence read:
- Existing leverage:
- Canonical language:

Product / Creative Discovery:
- Worth doing because:
- Desired product shape:
- Narrowest wedge:
- 10x / better version:
- Do-nothing consequence:
- Product confirmation rounds:

Socratic Dialogue:
- Requirement release: pending | approved
- Technical release: pending | approved
- Repo-answered questions:
- User-answered rounds:
- Dialogue Checkpoints:
  - CP-001:
    - Round range:
    - Next question:
    - Decisions made:
    - Rejected options and reasons:
    - Remaining open questions:
    - Evidence read:
    - Hidden assumptions / review findings so far:
    - Release status:
- 3 hidden assumptions challenged:
  1.
  2.
  3.
- Overengineering challenge:
- Adversarial review findings:
- Explicit release phrase:

Requirement Reality:
- User / operator:
- Status quo workaround:
- Most painful failure:
- Smallest success signal:
- Non-goals:

Decision Questions:
| ID | Decision | Evidence | Choice | Impact |
|----|----------|----------|--------|--------|
| D1 |  |  |  |  |

Planning Flow:
| Round | Status | Evidence / decision | Opens task? |
|-------|--------|---------------------|-------------|
| Product / Creative Discovery | confirmed |  |  |
| Requirement Reality | confirmed |  |  |
| System Shape | confirmed |  |  |
| Interface / Data Contract | confirmed |  |  |
| Abstraction Boundary | confirmed |  |  |
| Execution Architecture | confirmed |  |  |
| Task Contract | confirmed |  |  |
| Second-Move Review | confirmed |  |  |
| Final Approval | confirmed |  | yes |

Second-Move Review:
- First good move:
- Simpler move:
- Better architecture:
- Selected move:
- Rejected tradeoff:

Approved Direction:
-

User Stories:
| ID | Actor | Story | Acceptance | Edge / recovery |
|----|-------|-------|------------|-----------------|
| US-001 |  |  |  |  |

Engineering Review Gate:
- Existing leverage map:
- Scope challenge:
- Interface depth:
- Test seam:
- Mock boundary:
- Feedback loop:

ASCII Branch Chain Analysis:
Language rule: keep connector tokens ASCII; write node labels and evidence text in `Output language`.

Label table:
| Semantic slot | en | zh-CN |
| --- | --- | --- |
| requirementChain | Requirement Impact Chain | 需求影响链 |
| requirementMarker | REQ | 需求 |
| upstreamSource | Upstream source | 上游来源 |
| currentCodePath | Current code path | 当前代码路径 |
| caller | caller | 调用方 |
| dataOrState | data or state | 数据或状态 |
| deepestAffectedLayer | deepest affected layer | 最深影响层 |
| requiredChange | Required change | 必要变更 |
| verificationSeam | Verification seam | 验证缝隙 |
| businessChain | Business Impact Chain | 业务影响链 |
| outcomeMarker | OUTCOME | 结果 |
| directBehaviorImpact | Direct behavior impact | 直接行为影响 |
| downstreamImpact | Downstream impact | 下游影响 |
| riskBranch | Risk branch | 风险分支 |
| nonGoalBranch | Non-goal branch | 非目标分支 |

```text
<requirementChain>
<requirementMarker>: <user-visible change>
|-- <upstreamSource>: <roadmap / issue / user request / existing task>
|-- <currentCodePath>: <entry>
|   |-- <caller>: <file / command / UI / API>
|   |-- <dataOrState>: <field / config / artifact>
|   `-- <deepestAffectedLayer>: <module / prompt / provider contract / storage>
|-- <requiredChange>: <smallest behavior delta>
`-- <verificationSeam>: <public test / command / artifact>

<businessChain>
<outcomeMarker>: <operator / user value>
|-- <directBehaviorImpact>: <what changes for user>
|-- <downstreamImpact>: <consumers / docs / examples / release>
|-- <riskBranch>: <regression / migration / support / cost>
`-- <nonGoalBranch>: <explicitly not changed>
```

Acceptance:
-

Verification:
-

Risk / Escalate If:
-

## Failure Ledger

Use this section only for real execution failures, reroutes, disproven assumptions, stale validation, wrong-file touches, repeated tool failures, user-corrected misses, or eligible `cc-review` escape findings. Eligible review escapes are limited to process, test, design, and model-pattern escapes. Do not prefill speculative risks.

| ID | Source | Trigger | Escape class | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |
|----|--------|---------|--------------|---------|----------|---------------|--------|------------------|--------|---------------------|
| FL-001 |  |  | process-escape / test-escape / design-escape / model-pattern-escape |  |  |  |  |  | unreviewed / confirmed-lesson / noise / unresolved-risk | no |

## Execution Protocol

ClaudeCode / Codex 执行本计划时，必须把 `task.md` 当成唯一任务合同。

- CLI resolver: all workflow commands must run through `.claude/skills/cc-dev/scripts/resolve-cc-devflow.sh` or `.codex/skills/cc-dev/scripts/resolve-cc-devflow.sh`; if it cannot prove `next-change-key`, stop blocked.
- Task selection: use `scripts/select-ready-tasks.sh --tasks devflow/changes/<change-key>/task.md`.
- Completion: after Red/Green/Refactor evidence and review pass, run `scripts/mark-task-complete.sh --tasks devflow/changes/<change-key>/task.md --task <task-id>`.
- Stage commit rule: when PDCA or IDCA finishes in the current environment, commit the completed stage to Git.
- Runtime file ban: do not generate process files beyond this `task.md`.

```bash
DEVFLOW=".claude/skills/cc-dev/scripts/resolve-cc-devflow.sh"
if [[ ! -f "$DEVFLOW" && -f ".codex/skills/cc-dev/scripts/resolve-cc-devflow.sh" ]]; then
  DEVFLOW=".codex/skills/cc-dev/scripts/resolve-cc-devflow.sh"
fi
bash "$DEVFLOW" require next-change-key
SCRIPT_ROOT=".claude/skills/cc-do/scripts"
if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then
  SCRIPT_ROOT=".codex/skills/cc-do/scripts"
fi
bash "$SCRIPT_ROOT/select-ready-tasks.sh" --tasks devflow/changes/<change-key>/task.md
bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/<change-key>/task.md --task <task-id>
```

## Task Contract Matrix

| Task | User / edge story | Interface / method | File owner / responsibility | Do not re-decide | Verification evidence |
|------|-------------------|--------------------|-----------------------------|------------------|-----------------------|
| T001 | US-001 / US-EDGE-001 |  | tests own behavior proof | public seam | failing output |

## Phase 1: Foundation

- [ ] T001 [TEST] Write the first failing test (dependsOn:none) `path/to/test`
  Goal: 证明当前行为还没实现，必须先看到失败。
  Contract: user story `US-001`; method/interface `<public seam>`; input/output `<contract>`.
  Do not re-decide: target behavior, public seam, allowed mock boundary.
  TDD phase: red
  Files: `path/to/test`
  Read first: `task.md`
  Verification: `npm test -- path/to/test`
  Evidence: failing output
  Completion: after failing evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/<change-key>/task.md --task T001`.
  Public verification path: 从公共入口或用户可见路径读回结果。
  Ready when: 没有上游依赖，且测试路径已经确定。

- [ ] T002 [IMPL] Make the first test pass (dependsOn:T001) `path/to/file`
  Goal: 用最小实现让 T001 转绿。
  Contract: user story `US-001`; method/interface `<method or operation>`; input/output `<contract>`.
  Do not re-decide: file ownership, method shape, error shape, Green minimality boundary.
  TDD phase: green
  Files: `path/to/file`
  Read first: `task.md`, `path/to/test`
  Verification: `npm test -- path/to/test`
  Evidence: passing output + Git diff
  Completion: after green evidence exists, run `bash "$SCRIPT_ROOT/mark-task-complete.sh" --tasks devflow/changes/<change-key>/task.md --task T002`.
  Public verification path: same as T001.
  Ready when: T001 has failing evidence.
