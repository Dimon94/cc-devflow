---
name: cc-review
version: 2.1.0
description: Use when a plan, bug fix, PR, or implementation diff needs review findings. It finds concrete problems and routes them; it does not write review ledgers, findings JSON, reports, or other process files.
triggers:
  - 深度 review 这个方案
  - review 这个复杂需求
  - review 这个 bug 修复
  - 做一次 cc-review
  - deep review this plan
  - review this implementation deeply
  - check code smells
  - run cc-review
reads:
  - PLAYBOOK.md
  - CHANGELOG.md
  - references/review-methods.md
  - references/plan-review-branch.md
  - references/implementation-review-branch.md
  - references/e2e-and-plugin-verification.md
writes:
  - path: current response
    durability: ephemeral
    required: true
  - path: devflow/changes/<change-key>/handoff/pr-brief.md
    durability: durable
    required: false
    when: review findings must be reflected in PR text
  - path: devflow/postmortems/incidents/<date>-<change-key>.md
    durability: durable
    required: false
    when: review exposes a recurring failure worth preserving
effects:
  - optional deep review
  - read-only reviewer agent dispatch
  - finding aggregation
  - reroute recommendation
entry_gate:
  - Classify the review target as plan, implementation, PR, or mixed.
  - Read only the task, PR, diff, code, tests, logs, screenshots, and docs needed to review the requested scope.
  - Use Git history and current diff as the only durable review memory; do not load or create review process files.
  - Freeze the requested scope before finding smells; report only issues inside the change blast radius or clearly amplified by it.
  - Subagents are optional read-only reviewers; their raw output stays in the conversation and is not saved to files.
exit_criteria:
  - Findings are listed first, ordered by severity and backed by concrete file/line, command, diff, UI, log, or missing-evidence proof.
  - Every finding has impact, recommendation, and route: cc-plan, cc-do, cc-check, cc-act, or no-op.
  - In-scope code smells are either findings, explicit defers, or no-op with reason.
  - If no issues are found, the answer says so and names residual test or evidence risk.
  - No review ledger, findings JSON, report Markdown, or agent-results file was created.
reroutes:
  - when: Plan assumptions, scope, architecture, design, or DX contracts are wrong or incomplete.
    target: cc-plan
  - when: Implementation findings require code, test, docs, UI behavior, logs, or PR text changes.
    target: cc-do
  - when: Deep review is clean and only fresh evidence verification remains.
    target: cc-check
recovery_modes:
  - name: scope-reset
    when: The review starts drifting into unrelated historical debt.
    action: Return to the current diff, task.md, or PR scope and discard out-of-scope notes.
tool_budget:
  read_files: 24
  search_steps: 16
  shell_commands: 16
---

# CC-Review

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、公开分发配置和相关文档，然后检查 `CLAUDE.md`

## Role

`cc-review` 是可选的深度审查节点。它只做一件事：找出当前范围内真实存在的问题。

它不写过程文件，不维护 review 状态机，不生成 JSON/JSONL/Markdown 报告。需要保留的事实进入 Git commit、PR 文件，或者在复发/事故场景进入尸检 incident。

## Iron Law

```text
FIND THE REAL PROBLEM. DO NOT CREATE REVIEW ARTIFACTS.
```

Review 的价值在于问题质量，不在于过程记录数量。没有证据就不报；有证据就直接报。

## Read First

1. `references/review-methods.md`
2. Plan review: `references/plan-review-branch.md`
3. Implementation review: `references/implementation-review-branch.md`
4. UI/runtime/plugin review: `references/e2e-and-plugin-verification.md`

只按触发条件读取参考，不默认打开全部文件。

## Branch Classifier

| Branch | Signal | Review target |
| --- | --- | --- |
| `plan` | 用户说先 review 方案、只有 `task.md` / docs / issue | scope, contract, architecture, test strategy |
| `implementation` | 当前分支已有 code/test/docs diff | diff, behavior, tests, smells, regression risk |
| `PR` | 用户要求 review PR | PR diff, body accuracy, CI/test proof, merge risk |
| `mixed` | 方案和实现都变了 | plan contract first, then implementation conformance |

## Finding Rules

每条 finding 必须包含：

- severity: `critical` / `important` / `advisory`
- scope: 为什么属于当前请求范围
- evidence: 文件行、diff、命令输出、浏览器动作、日志、截图或明确缺失的证据
- impact: 它会导致什么错误、回归、维护成本或用户问题
- recommendation: 最小修复动作
- route: `cc-plan` / `cc-do` / `cc-check` / `cc-act` / `no-op`

代码坏味道包括 rigidity、duplication、cycle、fragility、obscurity、data-clump、unnecessary complexity。范围内发现就报；不在范围内只作为 defer 或不提。

## Subagents

可以使用只读 reviewer subagent，但输出只在主线程汇总，不写文件。主线程必须验证、去重、降级或拒收 subagent finding。

## Output

默认输出结构：

1. Findings first, ordered by severity.
2. Open questions only when they block the next route.
3. Residual risk / test gaps.
4. Next route.

没有问题时直接说 `No findings`，并说明还没验证的风险。
