---
name: cc-review
version: 2.2.0
description: Use when a plan, bug fix, PR, or implementation diff needs review findings. Plan reviews write findings into task.md; implementation reviews ask the user to choose a repair option before fixing.
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
  - references/review-methods.md
  - references/plan-review-branch.md
  - references/implementation-review-branch.md
  - references/e2e-and-plugin-verification.md
writes:
  - path: current response
    durability: ephemeral
    required: true
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: false
    when: plan or investigation contract review changes the task contract
effects:
  - optional deep review
  - read-only reviewer agent dispatch
  - finding aggregation
  - reroute recommendation
entry_gate:
  - Classify the review target as plan, implementation, PR, or mixed.
  - Read only the task, PR, diff, code, tests, logs, screenshots, and docs needed to review the requested scope.
  - Use Git history and current diff as the only durable review memory; do not load or create process files.
  - Freeze the requested scope before finding smells; report only issues inside the change blast radius or clearly amplified by it.
  - Subagents are optional read-only reviewers; their raw output stays in the conversation and is not saved to files.
exit_criteria:
  - Findings are listed first, ordered by severity and backed by concrete file/line, command, diff, UI, log, or missing-evidence proof.
  - Every finding has impact, recommendation, and route: cc-plan, cc-do, cc-check, cc-act, or stop.
  - Plan or investigation review findings are written into the relevant `task.md` section before exit.
  - Implementation review findings are returned with concrete repair options and a blocking user choice; no repair happens until the user selects an option.
  - In-scope code smells are either findings, explicit defers, or clean with reason.
  - If no issues are found, the answer says so and names residual test or evidence risk.
  - No process file was created.
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

`cc-review` 是可选的深度审查节点。它只做一件事：找出当前范围内真实存在的问题，并把问题放到正确出口。

它不写 review 过程产物，不维护 review 状态机。计划 review 的事实写回 `task.md`；执行 review 的事实先进入当前回复，等用户选择修复方案后再修。PR review 只回对话或 GitHub review。

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

## Exit Contract

- Plan / investigation review: directly update `devflow/changes/<change-key>/task.md` with the review findings, decision options, blocked assumptions, and required task changes. Final response only summarizes what was written and the next route.
- Implementation review: do not edit code during the review pass. Return findings plus repair options, ask the user which option to apply, and stop. After the user chooses, apply the selected repair directly and verify it.
- PR review: return findings in the response or GitHub review only; do not write local files.
- Clean review: say `No findings`, name residual verification risk, and route to `cc-check` or `stop`.

## Finding Rules

每条 finding 必须包含：

- severity: `critical` / `important` / `advisory`
- scope: 为什么属于当前请求范围
- evidence: 文件行、diff、命令输出、浏览器动作、日志、截图或明确缺失的证据
- impact: 它会导致什么错误、回归、维护成本或用户问题
- recommendation: 最小修复动作
- route: `cc-plan` / `cc-do` / `cc-check` / `cc-act` / `stop`

代码坏味道包括 rigidity、duplication、cycle、fragility、obscurity、data-clump、unnecessary complexity。范围内发现就报；不在范围内只作为 defer 或不提。

## Subagents

可以使用只读 reviewer subagent，但输出只在主线程汇总，不写文件。主线程必须验证、去重、降级或拒收 subagent finding。

## Output

按 review 类型输出：

### Plan / Investigation Review

先写 `task.md`，再简短回复：

1. Findings written: `task.md` path and sections changed.
2. Required task changes: task IDs or contract sections updated.
3. Route: `cc-plan` / `cc-investigate` / `cc-do` / `stop`.

### Implementation Review

只在对话里组织结果并询问用户：

1. Findings: severity, file/line, evidence, impact, fix.
2. Repair options: smallest safe fix, broader cleanup, defer with risk.
3. Recommendation: one option and why.
4. User choice needed: ask which option to apply.

没有问题时直接说 `No findings`，并说明还没验证的风险。
