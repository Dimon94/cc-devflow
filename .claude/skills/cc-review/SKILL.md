---
name: cc-review
version: 2.10.2
description: >-
  Use when a plan, bug fix, PR, implementation diff, complexity hotspot, or
  structural maintainability hotspot needs review findings or a complexity
  report. Plan reviews write findings into task.md; implementation reviews ask
  the user to choose a repair option before fixing.
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
  - complexity optimizer
  - complexity analysis report
  - full complexity report
  - scan complexity hotspots
  - inefficient loops
  - N+1 queries
  - reduce O(n^2)
  - thermo-nuclear code quality review
  - thermonuclear review
  - harsh maintainability review
  - code-judo review
  - 结构质量 review
  - 极严代码质量 review
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
  - ../cc-dev/references/user-choice-output-protocol.md
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
  - complexity analysis report
  - structural code-quality review
  - reroute recommendation
entry_gate:
  - Classify the review target as plan, implementation, PR, or mixed.
  - Read only the task, PR, diff, code, tests, logs, screenshots, and docs needed to review the requested scope.
  - Use Git history and current diff as the only durable review memory; do not load or create process files.
  - For repeat reviews, use `git diff <old>...HEAD` or `scripts/collect-review-context.sh` to narrow the delta before re-reviewing.
  - Freeze the requested scope before finding smells; report only issues inside the change blast radius or clearly amplified by it.
  - When the scope includes loops, rendering, repeated scans, database/API iteration, large inputs, or performance-sensitive paths, select the built-in complexity facet and use the local scanner/reference copy only as leads.
  - When the user asks to analyze, scan, audit, review, or give a complexity report, produce the full complexity report automatically and state that no files were modified.
  - When the user asks to fix, optimize, apply, change, refactor, or reduce complexity, still run the review pass first; implementation findings require repair options and the shared user-choice protocol before editing.
  - When the scope asks for thermo-nuclear / harsh maintainability review, or the diff grows busy files, adds ad-hoc branching, introduces thin wrappers, weakens type boundaries, or moves logic away from its canonical layer, select the structural quality facet.
  - When implementation review findings require a repair choice, use `../cc-dev/references/user-choice-output-protocol.md` instead of free-form prose.
  - Never emit a recommend-only repair line such as "choose A" or "选 A" unless the same pause point presents the full host-native choice UI or a fixed fallback block with 2-3 mutually exclusive options.
  - Subagents are optional read-only reviewers; their raw output stays in the conversation and is not saved to files.
exit_criteria:
  - Findings are listed first, ordered by severity and backed by concrete file/line, command, diff, UI, log, or missing-evidence proof.
  - Every finding has impact, recommendation, and route: cc-plan, cc-do, cc-check, cc-act, or stop.
  - Findings include an ASCII Branch Chain when they involve plan scope, root cause, implementation behavior, PR diff risk, or code smell propagation; each non-trivial chain records evidence, diagnosis, causal path, Phenomenal/Essential/Philosophical layers, and walks from the fault node up through three upstream layers and down through three downstream layers when available. Missing layers stay explicit as missing evidence or blocked instead of being collapsed. Tree connector characters stay ASCII while node text follows the configured output language.
  - Plan or investigation review findings are written into the relevant `task.md` section before exit.
  - Implementation review findings are returned with concrete repair options and a blocking user choice through `../cc-dev/references/user-choice-output-protocol.md`; the question must contain 2-3 mutually exclusive choices, and no repair happens until the user selects one.
  - In-scope code smells are either findings, explicit defers, or clean with reason.
  - Selected review facets or changed surfaces are checked, skipped with reason, or blocked; no artificial finding cap was applied.
  - If the complexity facet is selected, findings include current pattern, estimated current complexity, recommended change, estimated complexity after, risk level, and tests or measurements needed.
  - If a complexity report is requested, the response includes scope analyzed, detected stack/test/build commands, top findings ranked by likely impact, patch status, files modified yes/no, and residual verification risk.
  - If the complexity facet recommends a repair, behavior preservation is proven through relevant tests, ordering/identity/cache/authorization checks, and benchmarks or measurements when the improvement is non-obvious or performance-critical.
  - If the structural quality facet is selected, findings include the current structure, missed code-judo simplification, branching or abstraction smell, canonical ownership boundary, recommended restructuring, behavior-preserving argument, and approval/blocking verdict.
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

## Default Output

Match the review branch:

1. Target: plan, implementation, PR, mixed, complexity hotspot/report, or structural quality hotspot.
2. Findings: ordered by severity with file/line, evidence, impact, fix, and route.
3. Branch Chain: included for each non-trivial finding with evidence, diagnosis, causal path, Phenomenal/Essential/Philosophical layers, and fault-centered upstream/downstream walks of up to three concrete layers each; explicitly skipped only for trivial findings.
4. Repair options: required for implementation findings before editing.
5. Residual risk: test, runtime, docs, or evidence gaps.
6. Route: `cc-plan`, `cc-do`, `cc-check`, `cc-act`, or `stop`.

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
6. Complexity hotspot / report review: `references/complexity-optimization-playbook.md` and `references/complexity-report-template.md`

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
4. Facets：按风险选择 strategy / engineering / design / DX / TOC / contract / smell / structural-quality / complexity / test / runtime / docs。
5. Nodes：把每个 selected facet 或 changed surface 当成一个 review node，在 scratch reasoning 中逐个检查；每个 node 只能 checked、skipped、blocked。
6. Chain：对 plan / investigation / broad implementation / PR / smell finding 画 ASCII Branch Chain，按“现象接收 -> 本质诊断 -> 哲学沉思 -> 本质整合 -> 现象输出”记录三层认知、证据、诊断、因果链；以错误节点为中心，向上追直接输入/调用方、合同/规格或 provider、来源意图/roadmap 三层，向下追首个受影响边界、行为或产物、发布或维护风险三层；某层确无证据时显式写 missing evidence / blocked，不允许压缩成一条泛泛结论。
7. Findings：每个 finding 必须有 evidence、impact、recommendation、route；没有证据的怀疑只能是 residual risk 或 blocked evidence。
8. Aggregate：合并重复 finding，降级弱证据，拒收 out-of-scope、stale、speculative finding。
9. Exit：计划问题写 `task.md`；实现问题回对话给修复选项；只差验证进 `cc-check`。

渐进加载只控制读多少上下文，不允许把该审的节点省掉。

## Exit Contract

- Plan / investigation review: directly update `devflow/changes/<change-key>/task.md` with the review findings, decision options, blocked assumptions, and required task changes. Final response only summarizes what was written and the next route.
- Implementation review: do not edit code during the review pass. Return findings plus repair options, use the shared choice protocol to ask which option to apply, and stop. After the user chooses, apply the selected repair directly and verify it.
- PR review: return findings in the response or GitHub review only; do not write local files.
- Clean review: say `No findings`, name residual verification risk, and route to `cc-check` or `stop`.

## Risk Lanes

复杂实现、跨模块 diff、PR landing 前复审、或 mixed review 默认考虑六条风险 lane。小 diff 可以由一个 combined pass 覆盖，但必须说明 skip reason。

1. Intent / regression: diff 是否兑现意图，是否引入范围外行为、fallback 退化、caller/callee contract 漂移。
2. Security / privacy: auth、输入验证、注入、secret、敏感数据、默认权限、外部输入信任边界。
3. Performance / reliability: 热路径重复 I/O、启动/渲染/请求成本、cleanup 泄漏、retry storm、排序/竞态、失败处理。
4. Complexity / hotspots: 嵌套扫描、重复 membership/search、循环内排序、pairwise comparison、render path 重算、N+1 query/API、可避免 O(n^2) 或 O(n*m)。
5. Contracts / coverage: API/schema/type/config/flag、迁移 fallout、回归测试、日志、metrics、assertion、error path。
6. Structural quality / code-judo: 是否能通过重新归位所有权、删除特殊分支、收紧类型边界、复用 canonical helper、拆分超大文件、合并重复路径或原子化更新，让行为不变但结构明显更简单。

这些是审查视角，不是 finding 配额。

## Structural Quality / Code-Judo Review

结构质量专项是 `cc-review` 的内置能力。它吸收 thermo-nuclear code
quality review 的强标准，但必须服从 `cc-review` 的证据、范围、路由和
choice protocol；它不是单独的报告格式，也不是低价值 nit 配额。

基线要求：

- 对当前分支做实现质量和可维护性审计，不只确认行为是否能跑通。
- 重新思考结构、抽象、模块边界、分支增长和可读性，在不改变行为的前提下寻找更简单的形状。
- 主动寻找 code-judo move：让整类 helper、mode、状态、条件链或层级消失，而不是把复杂度搬家。
- 保持严格但证据优先；重构建议必须说明行为等价依据和需要补的测试或测量。

核心问题：

- 是否存在 code-judo move：保持行为不变，却删除整类分支、helper、mode、状态或层级？
- 能否换一个状态模型、dispatcher、policy object 或 ownership boundary，让特殊情况融进常规路径？
- 这个 diff 是让局部架构更直接，还是把工作代码塞进更纠缠的路径？
- 新增条件分支是否是缺失模型、缺失 policy、缺失 dispatcher、缺失 canonical helper 的症状？
- 抽象是否真的降低认知负担，还是只是 thin wrapper、identity wrapper、pass-through helper？
- 类型边界是否更清晰，还是用 `any`、`unknown`、cast、可选参数、silent fallback 掩盖不变量？
- 逻辑是否在 canonical layer，还是 feature-specific 细节泄漏进 shared path？
- 文件是否由本次 diff 从 1000 行以下推到 1000 行以上，或继续扩大已难扫描的大文件？
- 重复条件、复制 helper、临时 flag、nullable mode 是否说明概念没有建模？
- 独立异步工作是否被无理由串行化，相关状态更新是否可能半完成？

激进 flag 的情况：

- 明明可以删掉复杂度，却只把复杂度搬到另一个函数、hook、class 或 wrapper。
- refactor 只是移动代码，没有减少读者必须同时持有的概念数量。
- 在繁忙流程中追加 one-off boolean、nullable mode、feature check、临时分支或边缘 case。
- PR 把文件推过 1000 行，且没有强结构理由证明该文件仍然清晰。
- 复制现有 helper、绕开 canonical utility，或把概念放进错误 package / service / module。
- 使用 magical/generic 机制隐藏简单数据形状，让调用方更难看见真实 contract。
- 用 cast、optional、fallback 抹平边界不清，而不是把模型或输入 contract 显式化。
- narrow edge case 被塞进已经拥挤的函数中，导致主路径更难扫描。
- refactor 通过测试但没有减少模块化、可读性或所有权风险。

优先 remedy：

- 删除无收益的中间层，而不是给它改名。
- 改状态模型，让特殊分支消失，而不是把 if/else 集中到另一个地方。
- 把 feature logic 收回拥有该概念的 canonical 模块，shared path 只暴露稳定 contract。
- 用 typed model、显式 dispatcher、policy object 或 state machine 取代重复条件链。
- 抽出纯 helper / focused module / subcomponent，前提是它减少重复或缩小文件扫描面。
- 复用已有 canonical helper，删除近似重复实现。
- 分离 orchestration 与 business logic；独立工作可并行时，保持依赖关系显式。
- 把相关更新做成更原子的流，避免调用方观察到半完成状态。

结构质量 finding 额外字段：

- current structure
- missed code-judo simplification
- branching / abstraction / type-boundary smell
- canonical ownership boundary
- recommended restructuring
- behavior-equivalence argument
- approval verdict: approve, block, or defer with explicit risk

结构质量 finding 优先级：

1. 结构回归、错误层级、canonical ownership 被破坏。
2. 明显错过的 code-judo 简化路径。
3. spaghetti / branching complexity 增长。
4. 边界、抽象、类型 contract 让系统更难推理。
5. 文件规模和拆分问题。
6. 模块化、抽象收益、可读性和维护性问题。

不要用命名、注释、格式等低价值 nit 淹没真正的结构问题。

## Complexity Hotspot Review

复杂度专项是 `cc-review` 的内置能力，不依赖外部 `complexity-optimizer` skill。需要时只使用当前 skill 目录中的：

- `scripts/analyze_complexity.py`
- `references/complexity-optimization-playbook.md`
- `references/complexity-report-template.md`

默认原则：

- 先理解并保护当前行为；没有行为证据，不把优化建议伪装成安全修复。
- Scanner 只产生 leads，不是 finding。每个候选点都必须回读周边代码、调用方、测试、输入规模和排序/重复/权限语义。
- 用户只要求 analyze / scan / audit / review / report 时，默认输出完整复杂度报告，不改文件。
- 用户明确要求 implement / fix / optimize / apply / change / refactor / reduce complexity 时，先完成 review，再通过修复选项和 shared choice protocol 进入修复。
- report-only review 不改文件；implementation review 发现复杂度问题时，只给修复选项并路由 `cc-do`。
- plan / investigation review 发现未来复杂度风险时，写入 `task.md` 的 contract、tasks、open questions 或 test strategy。

基线建立：

- 识别语言、框架、测试命令、build/type/lint 命令和 performance-sensitive paths。
- 扫描仓库时先运行本 skill 的 `scripts/analyze_complexity.py`；如果 scanner 没有发现问题，仍要人工检查已知 hot path、render path、数据库/API 循环和 framework lifecycle。
- 修改前先读取现有测试；没有测试且语义不清时，只能给 report / repair option，不能假设行为。

默认复杂度报告字段：

- Scope analyzed and detected stack/test/build commands.
- Top findings ranked by likely impact.
- File and line for each finding.
- Current pattern and why it may be costly.
- Estimated current complexity.
- Recommended change.
- Estimated complexity after the change.
- Behavior-equivalence argument.
- Risk level.
- Tests, benchmarks, or manual checks needed.
- Patch status and clear files-modified yes/no statement.

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

优化安全清单：

- 数据规模是否足够大，当前路径是否足够热，值得引入索引、缓存、批量化或 memoization。
- 输出排序、重复键处理、first/last/all match 语义、key normalization 是否保持。
- object identity、mutability、reference sharing 是否属于可观察行为。
- cache 是否有有效 invalidation 策略，memo dependencies 是否覆盖所有语义输入。
- deduplication 是否会错误合并 display label 相同但业务身份不同的记录。
- 数据库/API batching 是否保持 tenant、permission、soft-delete、pagination、sorting、missing-record、rate-limit、retry 和 error behavior。
- 修改后先跑 narrow test，再跑 broad relevant test/build/type/lint；非显然或性能关键优化需要 benchmark / measurement。

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
- Cognitive Layers: 现象层记录症状的表面涟漪和问题的直观呈现；本质层记录系统的深层肌理和根因的隐秘逻辑；哲学层记录设计的永恒真理和架构的本质美学。思维路径固定为：现象接收 -> 本质诊断 -> 哲学沉思 -> 本质整合 -> 现象输出。
- ASCII Branch Chain: 用 ASCII 分叉树展示 evidence -> diagnosis -> cognitive layers -> causal path -> upstream chain -> faulty node -> downstream chain -> fix route；链路必须以 faulty node 为中心，向上找最多三层具体来源（直接输入/调用方 -> 合同/规格/provider -> 来源意图/roadmap），向下找最多三层具体影响（首个边界 -> 行为/产物 -> 发布/维护风险）。如某层在当前证据中不存在或不可证明，必须保留该层并标为 missing evidence / blocked；若涉及提示词或 provider contract，必须追到精确 prompt/provider 位置，不允许补故事。
- Complexity fields when selected: current pattern, estimated current complexity, recommended change, estimated complexity after, behavior-equivalence argument, risk level, and tests / benchmarks / manual checks needed.
- Structural quality fields when selected: current structure, missed code-judo simplification, structural smell, canonical ownership boundary, recommended restructuring, behavior-equivalence argument, approval verdict.

代码坏味道包括 rigidity、duplication、cycle、fragility、obscurity、data-clump、unnecessary complexity。范围内发现就报；不在范围内只作为 defer 或不提。

## ASCII Branch Chain Shape

Review 输出中的链路树必须使用 ASCII 连接符，不用 Unicode tree glyphs。

## Cognitive Layers

非 trivial finding 必须保留三层认知结构：

- 现象层：症状的表面涟漪，问题的直观呈现
- 本质层：系统的深层肌理，根因的隐秘逻辑
- 哲学层:设计的永恒真理,架构的本质美学

思维路径：现象接收 → 本质诊断 → 哲学沉思 → 本质整合 → 现象输出

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
| evidence | Evidence | 证据 |
| diagnosis | Diagnosis | 诊断 |
| cognitiveLayers | Cognitive layers | 认知层 |
| phenomenalLayer | Phenomenal layer | 现象层 |
| essentialLayer | Essential layer | 本质层 |
| philosophicalLayer | Philosophical layer | 哲学层 |
| thoughtPath | Thought path | 思维路径 |
| causalPath | Causal path | 因果链 |
| upstreamChain | Upstream chain | 上游链路 |
| upstreamInput | upstream L1 direct input/caller proof | 上游 L1 直接输入/调用方证据 |
| upstreamContract | upstream L2 contract/spec/provider | 上游 L2 合同/规格/provider |
| upstreamOrigin | upstream L3 source intent/roadmap | 上游 L3 来源意图/roadmap |
| source | Source | 来源 |
| faultNode | Fault node | 错误节点 |
| whyWrong | why wrong | 错误原因 |
| downstreamChain | Downstream chain | 下游链路 |
| firstAffectedSeam | first affected seam | 首个受影响边界 |
| downstreamBehavior | downstream L2 behavior/artifact | 下游 L2 行为/产物 |
| downstreamReleaseRisk | downstream L3 release/maintenance risk | 下游 L3 发布/维护风险 |
| downstreamImpact | Downstream impact | 下游影响 |
| fixRoute | Fix route | 修复路线 |

```text
<reviewChain>
<findingMarker>: <severity + short name>
|-- <evidence>: <file line / diff hunk / PR / log / prompt / command output / missing evidence>
|-- <diagnosis>: <violated contract / smell / root cause>
|-- <cognitiveLayers>: <phenomenon -> essence -> philosophy -> integration -> output>
|   |-- <phenomenalLayer>: <surface symptom / visible failure / reproducible trace>
|   |-- <essentialLayer>: <system structure / root cause / violated invariant>
|   |-- <philosophicalLayer>: <design principle / architectural truth / why this shape is right>
|   `-- <thoughtPath>: <phenomenon received -> essence diagnosed -> philosophy considered -> essence integrated -> phenomenon output>
|-- <causalPath>: <upstream cause -> faulty node -> downstream consequence>
|-- <upstreamChain>: <walk upward from the fault node; include three concrete layers when available>
|   |-- <upstreamInput>: <direct caller / input / fixture / baseline / command proof>
|   |-- <upstreamContract>: <spec / API / schema / prompt / provider contract>
|   `-- <upstreamOrigin>: <user request / task / issue / roadmap / missing evidence or blocked>
|-- <faultNode>: <file / section / behavior>
|   |-- <whyWrong>: <violated contract or smell>
|   `-- <firstAffectedSeam>: <public seam / caller / artifact>
|-- <downstreamChain>: <walk downward from the fault node; include three concrete layers when available>
|   |-- <firstAffectedSeam>: <public seam / caller / artifact>
|   |-- <downstreamBehavior>: <runtime behavior / generated output / user-visible result>
|   `-- <downstreamReleaseRisk>: <release / main parity / sibling work / maintenance / missing evidence or blocked>
|-- <downstreamImpact>: <user / operator / release / maintenance summary>
`-- <fixRoute>: <cc-plan / cc-investigate / cc-do / cc-check / cc-act / stop>
```

Plan / investigation review 的树写进 `task.md` 对应 finding 或 review gate。Implementation / PR review 的树写在当前回复或 GitHub review；不要为了树图创建本地 review 过程文件。

## Subagents

可以使用只读 reviewer subagent，但输出只在主线程汇总，不写文件。主线程必须验证、去重、降级或拒收 subagent finding。

Subagent 只拿自己的 review packet：scope、delta、node/facet、需要读取的文件、输出格式。不要把完整聊天历史当作 reviewer 上下文。没有 subagent 工具时，主线程按同样 node/facet 串行检查，并在输出中说明 fallback。

## Decision Questions

只有 finding 需要用户判断时才提问。不要在第一个问题处打断整个 review，除非答案会阻塞下一个 node。
需要用户选择时，先按 `../cc-dev/references/user-choice-output-protocol.md` 使用 Codex `request_user_input`、Claude Code 结构化输入或固定 A/B/C fallback。不要把普通 Markdown 伪装成宿主原生选择器。
只写推荐项不是选择题。任何 "选 A"、"choose A"、"推荐修法" 都必须附带同一 pause point 的完整 A/B/C 选项；否则就是 protocol failure，必须改成 host-native choice UI 或 fallback block 后再停。

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

Plan / investigation review 的 decision question 写进 `task.md`。Implementation review 的 repair options 通过共享 choice protocol 等待用户选择。

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
3. Repair options: 2-3 mutually exclusive choices: smallest safe fix, broader cleanup when real, and defer with risk.
4. Recommendation: name the recommended choice only after the choices exist.
5. User choice needed: ask which option to apply through the shared choice protocol; do not stop at a single "choose A" line.

没有问题时直接说 `No findings`，并说明还没验证的风险。

### Complexity Report

用户要求复杂度 analysis / scan / audit / review / report 时，默认在当前回复输出完整报告：

1. Summary: scope analyzed, detected stack/test/build commands, highest-impact hotspot, patch status, files modified yes/no.
2. Findings: ranked by likely impact, with file/line, current pattern, current complexity, recommended change, complexity after, behavior-equivalence argument, risk, and tests/measurements.
3. Changes made: `none` unless the user explicitly requested implementation and selected a repair option.
4. Verification: commands run, benchmark/measurement status, residual risk.

## Approval Bar

不要因为行为正确就 approve。结构质量专项开启时，approval 还必须满足：

- 没有清晰的结构回归。
- 没有明显可行的 code-judo 简化路径被错过。
- 没有无理由把文件推过 1000 行，或让超大文件继续膨胀。
- 没有把特殊分支、feature check 或临时 mode 散落进 shared flow。
- 没有 hacky / magical abstraction 让简单数据形状变得间接。
- 没有 thin wrapper、重复 helper、cast-heavy contract 或不必要 optionality 模糊真实不变量。
- 没有把逻辑放到错误层，或绕开已有 canonical helper。
- 没有可见的、明显有收益的拆分机会被放过。

这些条件默认按 blocker 处理，除非作者给出强证据证明当前结构更简单、更局部、更容易维护。若只剩命名、注释、格式等低价值 nit，不要用 thermo-nuclear 口吻放大。
