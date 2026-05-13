---
name: cc-review
version: 2.0.1
description: Use when a complex requirement, bug fix, plan, or implementation diff needs optional deep multi-round review beyond cc-check. Builds a review plan from prior records and current git/artifact delta, dispatches independent read-only reviewer agents when available, applies a risk-lane review swarm profile for broad implementation diffs, records node results, identifies in-scope code smells, queues user decisions, and reroutes to cc-plan, cc-do, or cc-check.
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
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - scripts/collect-review-context.sh
writes:
  - path: devflow/changes/<change-key>/review/review-ledger.jsonl
    durability: durable
    required: true
  - path: devflow/changes/<change-key>/review/review-findings.json
    durability: durable
    required: false
    when: actionable findings need machine consumption
  - path: devflow/changes/<change-key>/review/review-agent-results.jsonl
    durability: durable
    required: false
    when: subagent reviewers are used
effects:
  - optional deep review
  - read-only reviewer agent dispatch
  - risk-lane finding aggregation
  - durable findings
  - reroute recommendation
entry_gate:
  - Read planning/design.md or planning/analysis.md when the work is still plan-stage.
  - Read the current diff, task manifest, change metadata, and latest verification evidence when the work is execution-stage.
  - Read prior `review-ledger.jsonl`, optional `review-findings.json`, optional `review-agent-results.jsonl`, and legacy `cc-review-*` files when present.
  - Use git diff or scripts/collect-review-context.sh to identify content changed since the last review before deciding what to re-review.
  - Classify the review branch as plan, implementation, or mixed before loading detailed references.
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require review` before recording review lifecycle events; unsupported or old CLIs are blockers.
  - Start the durable review with the resolved CLI's `review start` before producing findings; encode selected nodes, skipped nodes, risk lanes, scope, base SHA, and head SHA in the first ledger event.
  - Decide whether nodes need independent reviewer agents before starting node execution; record the decision in the `review-started` event and optional `review-agent-results.jsonl`.
  - For broad implementation or mixed reviews, decide whether the risk-lane review swarm profile is required; record used, skipped, or unavailable lanes in `review-ledger.jsonl`.
  - Freeze the requested scope before finding smells; only report smells inside the requirement blast radius or clearly amplified by the current work.
exit_criteria:
  - review-ledger.jsonl records selected tools, review nodes, skipped nodes with reasons, review order, and final route through CLI events.
  - review-ledger.jsonl appends one record per reviewed node with status, evidence refs, findings, and follow-up route.
  - review-agent-results.jsonl records read-only reviewer outputs when subagents are used, or the review ledger records why agents were unavailable or unnecessary.
  - review-findings.json exists only when later agents need structured findings; human Markdown is rendered on demand with resolved CLI `review render`.
  - Plan-stage reviews record every selected strategy/design/engineering/DX facet as checked, skipped, or blocked.
  - Implementation-stage reviews include diff evidence, code-smell evidence, test and E2E/plugin verification evidence for every selected changed surface.
  - Every in-scope code smell has a concrete recommendation or an explicit skip/defer rationale.
  - No artificial finding cap was applied; review stops only when planned nodes are checked, skipped with reason, or blocked.
  - Main thread validates subagent findings before promoting them to final findings; no subagent output is trusted blindly.
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
    action: Return to the latest `review-started` event, keep only review nodes that are in scope, and continue node-by-node instead of collapsing to a short finding list.
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

- `Output language` 是机器约束，`review/review-ledger.jsonl`、`review/review-findings.json` 和 on-demand rendered Markdown 中新增的人类可读摘要必须记录并遵守它。
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

- Allowed actions: read artifacts, inspect code and diff, run safe read-only or verification commands, dispatch read-only reviewer subagents when available, use Browser/Computer Use for behavior proof, write review reports.
- Forbidden actions: silently rewriting the plan, silently editing production code, turning optional review into mandatory ship gate, reviewing unrelated historical debt, or stopping after a small fixed number of findings while planned nodes remain unchecked.
- Required evidence: every finding must cite plan text, code path, diff line, command output, browser action, UI state, log line, or explicit missing evidence.
- Reroute rule: plan contract defects return to `cc-plan`; implementation defects return to `cc-do`; clean deep review proceeds to `cc-check`.

## Independent Reviewer Dispatch

触发 `cc-review` 本身就构成用户对只读 reviewer subAgent 的授权。不要再要求用户补一句“请开启子智能体”。

主线程负责：制定 Review 计划、拆分节点、分配 reviewer、合并 findings、验证证据、去重、决定 quick fix / decision queue / reroute。

只读 reviewer 负责：在独立上下文里审指定节点，不编辑文件，不修改计划，不直接决定最终结论。

### Dispatch Rules

- ClaudeCode 环境：使用可用的 `Task` / subAgent 机制创建只读 reviewer。
- Codex App / Codex 工具环境：优先使用内置 `explorer` 子智能体；如果只有 `default`，prompt 必须写明只读审查、禁止编辑。
- 暴露 `spawn_agent` 的 Codex 环境：使用 `spawn_agent(agent_type="explorer", fork_context=false, ...)`。只有在用户明确要求继承完整上下文时才 `fork_context=true`。
- 不依赖 repo-local 自定义 agent 名称完成核心流程；自定义 agent 只能作为增强。
- 如果当前运行时没有 subagent 工具，或工具调用被上层策略禁止，主线程按同一节点计划串行执行，并在报告里写 `Agents used: no (subagent tool unavailable)`。
- subagent 只拿自己的 review packet，不拿主线程完整聊天历史；这样保持独立性。
- 每个 subagent 必须输出 JSONL findings；没有发现时输出 `NO FINDINGS`。
- 主线程必须验证 subagent finding 的路径、证据、scope 和置信度，不能因为 reviewer 说了就接受。

### Risk-Lane Review Swarm Profile

复杂实现、跨模块 diff、PR landing 前复审、或用户要求 parallel / swarm review 时，优先把实现节点拆成四类只读风险 lane。小 diff 可以由一个 combined reviewer 覆盖全部 lane，但计划里必须写明。

1. Intent and regression reviewer: 检查 diff 是否兑现意图、是否引入范围外行为漂移、边界和 fallback 是否坏掉、caller/callee 合同是否漂移。
2. Security and privacy reviewer: 检查 authn/authz、输入验证、注入风险、secret/token/sensitive data 暴露、默认权限扩大、信任未验证数据。
3. Performance and reliability reviewer: 检查热路径重复 I/O、启动/渲染/请求成本、cleanup 泄漏、retry storm、订阅漂移、排序/竞态/失败处理。
4. Contracts and coverage reviewer: 检查 API/schema/type/config/flag 不匹配、迁移/兼容 fallout、回归测试缺口、日志/metrics/assertion/error-path 缺失。

这些 lane 是审查视角，不是 finding 配额。主线程必须把 raw findings 合并后再输出：重复项合并，弱证据或 speculative claim 降级或拒收，和冻结意图冲突的 finding 转成 decision question 或 reject。

### Dispatch Heuristics

- Plan review:
  - Strategy reviewer: outcome, scope, goal tree, do-nothing risk.
  - Engineering reviewer: architecture, data flow, state, testability, rollback.
  - Design reviewer: user-visible flows, states, accessibility, visual/interaction risk.
  - DX reviewer: CLI/API/docs/operator journey, errors, examples.
  - TOC reviewer: current reality tree, conflict diagram, future reality tree for complex bugs.
- Implementation review:
  - Contract reviewer: diff vs plan/investigation contract.
  - Smell reviewer: rigidity, duplication, cycle, fragility, obscurity, data-clump, unnecessary complexity; may load `cc-simplify`.
  - Test reviewer: public seam, regression quality, fixture honesty, coverage gaps.
  - Runtime reviewer: Browser/Computer Use/CLI/log proof for UI or behavior surfaces.
  - Risk-lane reviewers: intent/regression, security/privacy, performance/reliability, contracts/coverage when a broad diff benefits from parallel independent context.

Large or multi-surface reviews should use at least two independent reviewers when the host supports it. Small reviews should use at least one combined read-only reviewer unless the plan explicitly records why subagent dispatch is unnecessary.

### Reviewer Packet

Each reviewer receives:

```text
You are a read-only cc-review reviewer. Do not edit files.
Repo root: <path>
Review mode: plan | implementation | mixed
Node ids: <R001,R002>
Scope: <requirement blast radius>
Current delta: <base/reviewed sha -> head sha + changed files>
Required artifacts: <paths>
Reference to use: <review-methods / plan / implementation / e2e / cc-simplify>
Output: JSONL findings or NO FINDINGS.
Finding schema:
{"nodeId":"R001","severity":"critical|important|advisory","confidence":8,"path":"file","line":12,"smell":"rigidity|duplication|cycle|fragility|obscurity|data-clump|unnecessary-complexity|none","summary":"...","evidence":"...","recommendation":"...","route":"cc-plan|cc-do|cc-check|cc-act|no-op","fingerprint":"...","reviewer":"strategy|engineering|design|dx|toc|contract|smell|test|runtime|intent-regression|security-privacy|performance-reliability|contracts-coverage"}
```

Low-confidence notes below `5` stay out of final findings unless they point to critical impact. Put those in report notes as leads, not findings.

## Stateful Review Loop

Every run follows this loop:

1. Collect prior review state:
   - previous `review-ledger.jsonl`
   - previous `review-findings.json`
   - previous `review-agent-results.jsonl`
   - legacy `cc-review-plan.md` / `cc-review-report.md` / `cc-review-ledger.jsonl` / `cc-review-findings.json` only as fallback
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
4. Decide reviewer dispatch:
   - which nodes need independent subagent review
   - which nodes stay in main thread
   - why any eligible reviewer was skipped
5. Run resolved CLI `review start` before findings:
   - selected node ids
   - skipped nodes and reasons
   - review mode and scope
   - risk lanes
   - base/head SHA
6. Traverse nodes one by one:
   - review the node
   - run the smallest useful check for that node
   - collect subagent JSONL output when assigned
   - validate and deduplicate reviewer findings
   - append one ledger record
   - mark the node `checked`, `skipped`, or `blocked`
7. Summarize:
   - quick mechanical fixes
   - user-decision queue
   - reroute list
   - final next skill

When re-reviewing the same file or plan, do not restart from zero. Compare current content with the last reviewed content or SHA, then re-review changed nodes and any dependent nodes made stale by that delta.

## Output Contract

Use CLI records as the default durable output:

1. `bash "$DEVFLOW" review start --change <id> --change-key <key> --mode <plan|implementation|mixed> --scope <scope> --base-sha <sha> --head-sha <sha> --selected-node <node> --skipped-node <node:reason> --risk-lane <lane>`
2. `bash "$DEVFLOW" review record-node --review-id <id> --node-id <node> --target <artifact> --status checked|skipped|blocked --evidence-ref <ref> --finding <id> --next <skill>`
3. `bash "$DEVFLOW" review add-finding --review-id <id> --finding-id <id> --severity <level> --confidence <1-10> --display-tier <blocking|warning> --path <path> --evidence <evidence> --recommendation <text> --route <skill>`
4. `bash "$DEVFLOW" review close --review-id <id> --status clean|findings|blocked --blocking-count <n> --warning-count <n> --next <skill>`
5. `bash "$DEVFLOW" review render --review-id <id> --output <path>` only when a human Markdown report is explicitly needed.

Append one JSON line to `review/review-ledger.jsonl` per review event. A reviewed node event looks like:

```json
{"nodeId":"R001","status":"checked","target":"planning/design.md","tool":"engineering","headSha":"...","evidence":["..."],"findings":["F001"],"next":"cc-plan"}
```

Write `review/review-findings.json` only when findings need machine consumption by later agents.

Write `review/review-agent-results.jsonl` when subagents are used. It contains raw reviewer findings plus reviewer identity. The ledger or rendered report must say which raw findings were accepted, merged, downgraded, or rejected.

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
