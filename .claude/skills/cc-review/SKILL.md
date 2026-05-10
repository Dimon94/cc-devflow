---
name: cc-review
version: 1.1.0
description: Use when a complex requirement, bug fix, plan, or implementation diff needs optional deep multi-round review beyond cc-check. First builds a review plan from previous review records and current git/artifact delta, then traverses unreviewed plan-stage or implementation-stage nodes one by one, records each node result, identifies in-scope code smells, queues user decisions, and writes durable findings before rerouting to cc-plan, cc-do, or cc-check.
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
  - scripts/collect-review-context.sh
writes:
  - path: devflow/changes/<change-key>/review/cc-review-plan.md
    durability: durable
    required: true
  - path: devflow/changes/<change-key>/review/cc-review-report.md
    durability: durable
    required: true
  - path: devflow/changes/<change-key>/review/cc-review-ledger.jsonl
    durability: durable
    required: true
  - path: devflow/changes/<change-key>/review/cc-review-findings.json
    durability: durable
    required: false
effects:
  - optional deep review
  - durable findings
  - reroute recommendation
entry_gate:
  - Read planning/design.md or planning/analysis.md when the work is still plan-stage.
  - Read the current diff, task manifest, change metadata, and latest verification evidence when the work is execution-stage.
  - Read prior cc-review-plan.md, cc-review-report.md, cc-review-ledger.jsonl, and cc-review-findings.json when present.
  - Use git diff or scripts/collect-review-context.sh to identify content changed since the last review before deciding what to re-review.
  - Classify the review branch as plan, implementation, or mixed before loading detailed references.
  - Write or refresh cc-review-plan.md before producing findings.
  - Freeze the requested scope before finding smells; only report smells inside the requirement blast radius or clearly amplified by the current work.
exit_criteria:
  - cc-review-plan.md records selected tools, review nodes, skipped nodes with reasons, and checkpoint order.
  - cc-review-ledger.jsonl appends one record per reviewed node with status, evidence, findings, and follow-up route.
  - cc-review-report.md records branch classification, scope, prior-review delta, methods used, node coverage, findings, user decisions needed, quick fixes, and next route.
  - Plan-stage reviews record every selected strategy/design/engineering/DX facet as checked, skipped, or blocked.
  - Implementation-stage reviews include diff evidence, code-smell evidence, test and E2E/plugin verification evidence for every selected changed surface.
  - Every in-scope code smell has a concrete recommendation or an explicit skip/defer rationale.
  - No artificial finding cap was applied; review stops only when planned nodes are checked, skipped with reason, or blocked.
  - The next action is exactly one of cc-plan, cc-do, cc-check, cc-act, or no-op.
reroutes:
  - when: Plan assumptions, scope, architecture, design, or DX contracts are wrong or incomplete.
    target: cc-plan
  - when: Implementation findings require code, test, docs, or UI behavior changes.
    target: cc-do
  - when: Deep review is clean and only fresh evidence verification remains.
    target: cc-check
recovery_modes:
  - name: branch-reclassification
    when: The review started on the wrong branch type or new evidence shows both plan and implementation need review.
    action: Stop the current pass, restate the correct branch classification, load the matching reference, and restart from the scope freeze.
  - name: progressive-disclosure-reset
    when: The review is drowning in unrelated methods or external review templates.
    action: Return to cc-review-plan.md, keep only review nodes that are in scope, and continue node-by-node instead of collapsing to a short finding list.
tool_budget:
  read_files: 24
  search_steps: 16
  shell_commands: 16
---

# CC-Review

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、公开分发配置和相关文档，然后检查 `CLAUDE.md`

## Role

`cc-review` 是可选的深度 Review 节点。

它不替代 `cc-check`。`cc-check` 负责流程式证据验收和 pass/fail/blocked 裁决；`cc-review` 负责在复杂需求、复杂 bug、架构风险、UI/DX 风险、代码坏味道出现时做更深的多轮审查。

## Runtime Output Policy

写入任何 durable Markdown 或 JSON metadata 前，先运行 `cc-devflow config resolve --format policy`。

- `Output language` 是机器约束，`review/cc-review-report.md` 和 `review/cc-review-findings.json` 中新增的人类可读摘要必须记录并遵守它。
- `agent_preferences` 是用户偏好建议，只影响表达方式和结构选择，不覆盖本 Skill 的 Review 边界。
- 如果配置解析失败，先修配置或向用户说明阻塞，不要用默认语言继续生成正式文档。

## Iron Law

```text
REVIEW THE RIGHT THING AT THE RIGHT STAGE.
```

计划还没进入实现时，Review 计划。代码已经改了时，Review diff 和运行效果。两者都有时，先 Review 计划合同，再 Review 实现是否兑现合同。

深度 Review 不能靠“最多列 3 个问题”收尾。必须先制定 Review 计划，再逐节点检查、逐节点记录。问题数量由证据决定，不由输出习惯决定。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/review-methods.md`
4. Branch-specific reference:
   - plan-stage: `references/plan-review-branch.md`
   - implementation-stage: `references/implementation-review-branch.md`
   - UI/runtime/plugin evidence: `references/e2e-and-plugin-verification.md`
5. When prior review state may exist, run or inspect `scripts/collect-review-context.sh`

## Use This Skill When

- 复杂需求或复杂 bug 需要比 `cc-check` 更深的 Review。
- `cc-plan` 已有方案，但你怀疑范围、根因、架构、测试或 DX 没压实。
- `cc-do` 已经实现，但你要在进入 `cc-check` 前找设计坏味道、代码坏味道和端到端落地风险。
- 需要检查僵化、冗余、循环依赖、脆弱性、晦涩性、数据泥团、不必要复杂。
- UI 或 Codex 插件链路需要用浏览器、电脑操作、日志和点击验证证明实际效果。

不要把每个小改动都送进 `cc-review`。简单、低风险、证据充分的变更直接走 `cc-check`。

## Branch Classifier

先分类，再加载详细方法：

| Branch | Signal | Load |
| --- | --- | --- |
| `plan` | 用户说“先别写代码”、只有 `planning/design.md` / `planning/analysis.md`，或没有实现 diff | `plan-review-branch.md` |
| `implementation` | 当前分支已有代码 diff、review comment、UI 改动、测试改动或用户说“Review 代码” | `implementation-review-branch.md` |
| `mixed` | 计划和实现都存在，且实现可能偏离计划 | 先 plan，再 implementation |

如果分类不清，先读 change artifacts 和 diff。仍然不清时，用一个 Decision Question 问用户，不要猜。

## Harness Contract

- Allowed actions: read artifacts, inspect code and diff, run safe read-only or verification commands, use Browser/Computer Use for behavior proof, write review reports.
- Forbidden actions: silently rewriting the plan, silently editing production code, turning optional review into mandatory ship gate, reviewing unrelated historical debt, or stopping after a small fixed number of findings while planned nodes remain unchecked.
- Required evidence: every finding must cite plan text, code path, diff line, command output, browser action, UI state, log line, or explicit missing evidence.
- Reroute rule: plan contract defects return to `cc-plan`; implementation defects return to `cc-do`; clean deep review proceeds to `cc-check`.

## Stateful Review Loop

Every run follows this loop:

1. Collect prior review state:
   - previous `cc-review-plan.md`
   - previous `cc-review-report.md`
   - previous `cc-review-ledger.jsonl`
   - previous `cc-review-findings.json`
2. Collect current delta:
   - `git diff <last-reviewed-sha>...HEAD` when a reviewed SHA exists
   - otherwise `git diff <base>...HEAD`
   - changed planning artifacts, changed code, changed tests, changed docs, changed runtime/UI surfaces
3. Select review tools:
   - strategy / CEO-style outcome review
   - engineering review
   - design review
   - DX/operator review
   - TOC root-cause review
   - code-smell / simplification review
   - E2E / Browser / Computer Use / logs review
4. Write `cc-review-plan.md` before findings:
   - node id
   - target artifact or code surface
   - tool/reference to load
   - reason selected
   - check command or evidence source
   - status: `pending`
5. Traverse nodes one by one:
   - review the node
   - run the smallest useful check for that node
   - append one ledger record
   - mark the node `checked`, `skipped`, or `blocked`
6. Summarize:
   - quick mechanical fixes
   - user-decision queue
   - reroute list
   - final next skill

When re-reviewing the same file or plan, do not restart from zero. Compare current content with the last reviewed content or SHA, then re-review changed nodes and any dependent nodes made stale by that delta.

## Output Contract

Write `review/cc-review-plan.md` before the review pass with:

1. Branch classification and review scope.
2. Prior review records found.
3. Current git/artifact delta.
4. Selected tools and skipped tools with reasons.
5. Ordered review nodes and per-node check plan.

Write `review/cc-review-report.md` with:

1. Review branch classification and scope.
2. Source artifacts read and prior review records used.
3. Current delta against previous review or base.
4. Review methods used and methods intentionally skipped.
5. Node coverage table.
6. Findings by severity, each with evidence, smell category when relevant, recommendation, and route.
7. Quick mechanical fixes that can be handled by `cc-do`.
8. Decision questions still needing user input.
9. E2E / Browser / Computer Use evidence when applicable.
10. Final next action.

Append one JSON line to `review/cc-review-ledger.jsonl` per reviewed node:

```json
{"nodeId":"R001","status":"checked","target":"planning/design.md","tool":"engineering","headSha":"...","evidence":["..."],"findings":["F001"],"next":"cc-plan"}
```

Write `review/cc-review-findings.json` when findings need machine consumption by later agents.

## Finding Rules

Each finding must include:

- severity: `critical` / `important` / `advisory`
- confidence: 1-10
- scope: why this is inside the current requirement blast radius
- evidence: concrete path, line, artifact, command, browser action, or log
- smell: one of `rigidity`, `duplication`, `cycle`, `fragility`, `obscurity`, `data-clump`, `unnecessary-complexity`, or `none`
- recommendation: exact next move
- route: `cc-plan`, `cc-do`, `cc-check`, `cc-act`, or `no-op`

Bad smells inside the requested scope are never hidden. Every in-scope smell must produce either a decision question, a routed fix recommendation, or an explicit defer/skip rationale. Ask whether to optimize when the smell is real and the fix is not a purely mechanical local cleanup.

Decision questions are collected after the full independent node pass unless the answer blocks the next node. Present the full decision queue first, then ask the user to confirm decisions one by one. Do not start non-mechanical fixes until those decisions are answered.

## Progressive Disclosure

Progressive disclosure controls context size, not review depth. Do not load every reference by default, but do build the full review plan first.

1. Always read `review-methods.md`.
2. Read `plan-review-branch.md` only for plan or mixed reviews.
3. Read `implementation-review-branch.md` only for implementation or mixed reviews.
4. Read `e2e-and-plugin-verification.md` only when UI, browser behavior, desktop app behavior, CLI runtime, or Codex plugin chain evidence is relevant.
5. Read `cc-simplify` only when the review plan selects code-smell, duplication, simplification, or architecture-cleanup nodes.

## Exit Rule

`cc-review` is complete only when the next route is unambiguous:

- `cc-plan`: revise design, scope, root cause, UI/DX contract, or task split.
- `cc-do`: fix implementation, tests, docs, UI behavior, logs, or review findings.
- `cc-check`: deep review is clean enough for evidence verification.
- `cc-act`: only when a fresh `cc-check` pass already exists.
- `no-op`: review found no relevant issue and no downstream action is needed.
