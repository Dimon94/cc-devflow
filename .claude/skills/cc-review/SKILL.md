---
name: cc-review
version: 1.0.0
description: Use when a complex requirement, bug fix, plan, or implementation diff needs an optional deep multi-round review beyond cc-check. Routes plan-stage material through strategy/design/engineering/DX review methods, routes execution-stage code through diff/code-quality/E2E review, identifies in-scope code smells, and writes durable cc-review findings before rerouting to cc-plan, cc-do, or cc-check.
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
  - path: devflow/changes/<change-key>/review/cc-review-report.md
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
  - Classify the review branch as plan, implementation, or mixed before loading detailed references.
  - Freeze the requested scope before finding smells; only report smells inside the requirement blast radius or clearly amplified by the current work.
exit_criteria:
  - cc-review-report.md records branch classification, scope, methods used, findings, user decisions needed, and next route.
  - Plan-stage reviews record strategy/design/engineering/DX facets only when applicable.
  - Implementation-stage reviews include diff evidence, code-smell evidence, test and E2E/plugin verification evidence when applicable.
  - Every in-scope code smell has a concrete recommendation or an explicit skip/defer rationale.
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
    action: Return to SKILL.md, reload only the branch-specific reference and review-methods.md, then continue with the smallest applicable checklist.
tool_budget:
  read_files: 12
  search_steps: 8
  shell_commands: 10
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

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/review-methods.md`
4. Branch-specific reference:
   - plan-stage: `references/plan-review-branch.md`
   - implementation-stage: `references/implementation-review-branch.md`
   - UI/runtime/plugin evidence: `references/e2e-and-plugin-verification.md`

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
- Forbidden actions: silently rewriting the plan, silently editing production code, turning optional review into mandatory ship gate, or reviewing unrelated historical debt.
- Required evidence: every finding must cite plan text, code path, diff line, command output, browser action, UI state, log line, or explicit missing evidence.
- Reroute rule: plan contract defects return to `cc-plan`; implementation defects return to `cc-do`; clean deep review proceeds to `cc-check`.

## Output Contract

Write `review/cc-review-report.md` with:

1. Review branch classification and scope.
2. Source artifacts read.
3. Review methods used and methods intentionally skipped.
4. Findings by severity, each with evidence, smell category when relevant, recommendation, and route.
5. E2E / Browser / Computer Use evidence when applicable.
6. Decision questions still needing user input.
7. Final next action.

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

## Progressive Disclosure

Do not load every reference by default.

1. Always read `review-methods.md`.
2. Read `plan-review-branch.md` only for plan or mixed reviews.
3. Read `implementation-review-branch.md` only for implementation or mixed reviews.
4. Read `e2e-and-plugin-verification.md` only when UI, browser behavior, desktop app behavior, CLI runtime, or Codex plugin chain evidence is relevant.

## Exit Rule

`cc-review` is complete only when the next route is unambiguous:

- `cc-plan`: revise design, scope, root cause, UI/DX contract, or task split.
- `cc-do`: fix implementation, tests, docs, UI behavior, logs, or review findings.
- `cc-check`: deep review is clean enough for evidence verification.
- `cc-act`: only when a fresh `cc-check` pass already exists.
- `no-op`: review found no relevant issue and no downstream action is needed.
