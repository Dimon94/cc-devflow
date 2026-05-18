---
name: cc-review
version: 2.4.0
description: Use when a plan, bug fix, PR, implementation diff, or complexity hotspot needs review findings. Plan reviews write findings into task.md; implementation reviews ask the user to choose a repair option before fixing.
triggers:
  - 深度 review 这个方案
  - review 这个复杂需求
  - review 这个 bug 修复
  - 做一次 cc-review
  - deep review this plan
  - review this implementation deeply
  - check code smells
  - review complexity hotspots
  - 复杂度专项 review
  - run cc-review
reads:
  - PLAYBOOK.md
  - references/review-methods.md
  - references/plan-review-branch.md
  - references/implementation-review-branch.md
  - references/e2e-and-plugin-verification.md
  - references/complexity-optimization-playbook.md
  - references/complexity-report-template.md
  - scripts/collect-review-context.sh
  - scripts/analyze_complexity.py
  - references/checklist-contract.md
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
  - complexity hotspot review
  - reroute recommendation
entry_gate:
  - Classify the review target as plan, implementation, PR, or mixed.
  - Read only the task, PR, diff, code, tests, logs, screenshots, and docs needed to review the requested scope.
  - Use Git history and current diff as the only durable review memory; do not load or create process files.
  - For repeat reviews, use `git diff <old>...HEAD` or `scripts/collect-review-context.sh` to narrow the delta before re-reviewing.
  - Freeze the requested scope before finding smells; report only issues inside the change blast radius or clearly amplified by it.
  - When the scope includes loops, rendering, repeated scans, database/API iteration, large inputs, or performance-sensitive paths, select the built-in complexity facet and use the local scanner/reference copy only as leads.
  - Subagents are optional read-only reviewers; their raw output stays in the conversation and is not saved to files.
exit_criteria:
  - Findings are listed first, ordered by severity and backed by concrete file/line, command, diff, UI, log, or missing-evidence proof.
  - Every finding has impact, recommendation, and route: cc-plan, cc-do, cc-check, cc-act, or stop.
  - Findings include an ASCII Branch Chain when they involve plan scope, root cause, implementation behavior, PR diff risk, or code smell propagation; tree connector characters stay ASCII while node text follows the configured output language.
  - Plan or investigation review findings are written into the relevant `task.md` section before exit.
  - Implementation review findings are returned with concrete repair options and a blocking user choice; no repair happens until the user selects an option.
  - In-scope code smells are either findings, explicit defers, or clean with reason.
  - Selected review facets or changed surfaces are checked, skipped with reason, or blocked; no artificial finding cap was applied.
  - If the complexity facet is selected, findings include current pattern, estimated current complexity, recommended change, estimated complexity after, risk level, and tests or measurements needed.
  - Subagent findings, when used, are accepted, merged, downgraded, or rejected by the main thread before final output.
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
  read_files: 30
  search_steps: 18
  shell_commands: 18
---

# CC-Review

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、公开分发配置和相关文档，然后检查 `CLAUDE.md`

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.

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
2. `references/checklist-contract.md`
3. Plan review: `references/plan-review-branch.md`
4. Implementation review: `references/implementation-review-branch.md`
5. UI/runtime/plugin review: `references/e2e-and-plugin-verification.md`
6. Complexity hotspot review: `references/complexity-optimization-playbook.md` and `references/complexity-report-template.md`

只按触发条件读取参考，不默认打开全部文件。

## Branch Classifier

| Branch | Signal | Review target |
| --- | --- | --- |
| `plan` | 用户说先 review 方案、只有 `task.md` / docs / issue | scope, contract, architecture, test strategy |
| `implementation` | 当前分支已有 code/test/docs diff | diff, behavior, tests, smells, regression risk |
| `PR` | 用户要求 review PR | PR diff, body accuracy, CI/test proof, merge risk |
| `mixed` | 方案和实现都变了 | plan contract first, then implementation conformance |

## Review Loop

每次 review 都保留深度流程，但不保留过程文件：

1. Classify：判断 plan / implementation / PR / mixed。
2. Scope Freeze：写清本次 review 的意图、blast radius、明确不审的历史债。
3. Delta：用 Git、PR diff、`task.md` 和当前命令输出确定相对上次或 base 的真实变化。
4. Facets：按风险选择 strategy / engineering / design / DX / TOC / contract / smell / complexity / test / runtime / docs。
5. Nodes：把每个 selected facet 或 changed surface 当成一个 review node，在 scratch reasoning 中逐个检查；每个 node 只能 checked、skipped、blocked。
6. Chain：对 plan / investigation / broad implementation / PR / smell finding 画 ASCII Branch Chain，向上追来源，向下追影响面。
7. Findings：每个 finding 必须有 evidence、impact、recommendation、route；没有证据的怀疑只能是 residual risk 或 blocked evidence。
8. Aggregate：合并重复 finding，降级弱证据，拒收 out-of-scope、stale、speculative finding。
9. Exit：计划问题写 `task.md`；实现问题回对话给修复选项；只差验证进 `cc-check`。

渐进加载只控制读多少上下文，不允许把该审的节点省掉。

## Exit Contract

- Plan / investigation review: directly update `devflow/changes/<change-key>/task.md` with the review findings, decision options, blocked assumptions, and required task changes. Final response only summarizes what was written and the next route.
- Implementation review: do not edit code during the review pass. Return findings plus repair options, ask the user which option to apply, and stop. After the user chooses, apply the selected repair directly and verify it.
- PR review: return findings in the response or GitHub review only; do not write local files.
- Clean review: say `No findings`, name residual verification risk, and route to `cc-check` or `stop`.

## Risk Lanes

复杂实现、跨模块 diff、PR landing 前复审、或 mixed review 默认考虑五条风险 lane。小 diff 可以由一个 combined pass 覆盖，但必须说明 skip reason。

1. Intent / regression: diff 是否兑现意图，是否引入范围外行为、fallback 退化、caller/callee contract 漂移。
2. Security / privacy: auth、输入验证、注入、secret、敏感数据、默认权限、外部输入信任边界。
3. Performance / reliability: 热路径重复 I/O、启动/渲染/请求成本、cleanup 泄漏、retry storm、排序/竞态、失败处理。
4. Complexity / hotspots: 嵌套扫描、重复 membership/search、循环内排序、pairwise comparison、render path 重算、N+1 query/API、可避免 O(n^2) 或 O(n*m)。
5. Contracts / coverage: API/schema/type/config/flag、迁移 fallout、回归测试、日志、metrics、assertion、error path。

这些是审查视角，不是 finding 配额。

## Complexity Hotspot Review

复杂度专项是 `cc-review` 的内置能力，不依赖外部 `complexity-optimizer` skill。需要时只使用当前 skill 目录中的：

- `scripts/analyze_complexity.py`
- `references/complexity-optimization-playbook.md`
- `references/complexity-report-template.md`

默认原则：

- 先理解并保护当前行为；没有行为证据，不把优化建议伪装成安全修复。
- Scanner 只产生 leads，不是 finding。每个候选点都必须回读周边代码、调用方、测试、输入规模和排序/重复/权限语义。
- report-only review 不改文件；implementation review 发现复杂度问题时，只给修复选项并路由 `cc-do`。
- plan / investigation review 发现未来复杂度风险时，写入 `task.md` 的 contract、tasks、open questions 或 test strategy。

扫描入口：

```bash
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format markdown
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format json
```

优先检查：

- nested lookup loops: 是否能用 Map/Set/index/grouping 把 O(a*b) 降到 O(a+b)。
- membership/search in loop: equality、hashability、key normalization、ordering 是否保持。
- sort in loop: 中间排序状态是否可观察，comparator 是否依赖 loop-local state。
- pairwise comparisons: 是否能用 sort+two pointers、sweep line、bucket 或 union-find。
- render recomputation: derived data、filter/sort/group、callback/object props 是否导致重复渲染或重复计算。
- N+1 database/API: bulk fetch、join/preload/dataloader/batch endpoint 是否保持 tenant、permission、soft-delete、pagination、sorting、error behavior。

复杂度 finding 额外字段：

- current pattern
- estimated current complexity
- recommended change
- estimated complexity after
- behavior-equivalence argument
- risk level
- tests, benchmarks, or manual checks needed

## Finding Rules

每条 finding 必须包含：

- severity: `critical` / `important` / `advisory`
- scope: 为什么属于当前请求范围
- evidence: 文件行、diff、命令输出、浏览器动作、日志、截图或明确缺失的证据
- impact: 它会导致什么错误、回归、维护成本或用户问题
- recommendation: 最小修复动作
- route: `cc-plan` / `cc-do` / `cc-check` / `cc-act` / `stop`
- ASCII Branch Chain: 用 ASCII 分叉树展示 source -> faulty node -> downstream impact -> fix route；若涉及提示词或 provider contract，必须追到精确 prompt/provider 位置

代码坏味道包括 rigidity、duplication、cycle、fragility、obscurity、data-clump、unnecessary complexity。范围内发现就报；不在范围内只作为 defer 或不提。

## ASCII Branch Chain Shape

Review 输出中的链路树必须使用 ASCII 连接符，不用 Unicode tree glyphs。

Language rule:

- Tree structure tokens must stay ASCII: `|--`, `` `-- ``, `|`, spaces, and plain punctuation.
- Node labels, explanations, finding summaries, and route descriptions must follow the configured output language.
- Language source order: `task.md` `Output language`, PR/task/handoff language fields, then current conversation language.
- If no language source is available, record the assumption before the tree.
- Do not hard-code English labels such as `Review Chain` when the configured output language is not English.
- Use the Label table as the shared source for chain titles, node labels, and placeholder text.

Label table:

| Semantic slot | en | zh-CN |
| --- | --- | --- |
| reviewChain | Review Chain | 审查链 |
| findingMarker | FINDING | 问题 |
| source | Source | 来源 |
| faultNode | Fault node | 错误节点 |
| whyWrong | why wrong | 错误原因 |
| firstAffectedSeam | first affected seam | 首个受影响边界 |
| downstreamImpact | Downstream impact | 下游影响 |
| fixRoute | Fix route | 修复路线 |

```text
<reviewChain>
<findingMarker>: <severity + short name>
|-- <source>: <task / diff / PR / log / prompt / provider contract>
|-- <faultNode>: <file / section / behavior>
|   |-- <whyWrong>: <violated contract or smell>
|   `-- <firstAffectedSeam>: <public seam / caller / artifact>
|-- <downstreamImpact>: <user / operator / release / maintenance>
`-- <fixRoute>: <cc-plan / cc-investigate / cc-do / cc-check / cc-act / stop>
```

Plan / investigation review 的树写进 `task.md` 对应 finding 或 review gate。Implementation / PR review 的树写在当前回复或 GitHub review；不要为了树图创建本地 review 过程文件。

## Subagents

可以使用只读 reviewer subagent，但输出只在主线程汇总，不写文件。主线程必须验证、去重、降级或拒收 subagent finding。

Subagent 只拿自己的 review packet：scope、delta、node/facet、需要读取的文件、输出格式。不要把完整聊天历史当作 reviewer 上下文。没有 subagent 工具时，主线程按同样 node/facet 串行检查，并在输出中说明 fallback。

## Decision Questions

只有 finding 需要用户判断时才提问。不要在第一个问题处打断整个 review，除非答案会阻塞下一个 node。

格式：

```text
D<N> - <decision title>
Evidence: <file/line/diff/log/UI action>
Risk: <what breaks if ignored>
Recommendation: <recommended option and why>
Options:
A) <smallest safe fix> - impact
B) <broader cleanup> - impact
C) <defer> - risk
```

Plan / investigation review 的 decision question 写进 `task.md`。Implementation review 的 repair options 留在当前回复，等待用户选择。

## Output

按 review 类型输出：

### Plan / Investigation Review

先写 `task.md`，再简短回复：

1. Findings written: `task.md` path and sections changed.
2. ASCII Branch Chains written: task sections updated with source -> fault -> impact -> route trees.
3. Required task changes: task IDs or contract sections updated.
4. Route: `cc-plan` / `cc-investigate` / `cc-do` / `stop`.

### Implementation Review

只在对话里组织结果并询问用户：

1. Findings: severity, file/line, evidence, impact, fix.
2. ASCII Branch Chain: one tree per non-trivial finding or smell propagation.
3. Repair options: smallest safe fix, broader cleanup, defer with risk.
4. Recommendation: one option and why.
5. User choice needed: ask which option to apply.

没有问题时直接说 `No findings`，并说明还没验证的风险。
