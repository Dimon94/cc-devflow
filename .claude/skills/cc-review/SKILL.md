---
name: cc-review
version: 2.13.0
description: >-
  Use when a plan, bug fix, PR, implementation diff, complexity hotspot, or
  structural maintainability hotspot needs findings, production hardening
  specialist review, or complexity report. Plan reviews write
  findings into task.md; implementation reviews ask the user to choose a repair
  option before fixing.
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
  - hardening specialist review
  - productionize app review
  - audit api admin feature flag review
  - security observability release test strategy review
  - 安全 可观测性 发布 测试策略 加固 review
  - 产品化 控制面 API 审计 管理 review
  - run cc-review
reads:
  - PLAYBOOK.md
  - references/review-methods.md
  - references/hardening-specialists.md
  - references/productization-surfaces.md
  - references/structural-quality.md
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
    when: plan or investigation contract review changes the task contract, or an eligible review escape must be recorded in `task.md#Failure Ledger`
effects:
  - optional deep review
  - read-only reviewer agent dispatch
  - finding aggregation
  - complexity hotspot review
  - complexity analysis report
  - structural code-quality review
  - hardening specialist review
  - productization surface review
  - reroute recommendation
entry_gate:
  - Classify the review target as plan, implementation, PR, or mixed.
  - Read only the task, PR, diff, code, tests, logs, screenshots, and docs needed to review the requested scope.
  - Use Git history and current diff as the only durable review memory; do not load or create process files.
  - For repeat reviews, use `git diff <old>...HEAD` or `scripts/collect-review-context.sh` to narrow the delta before re-reviewing.
  - Freeze the requested scope before finding smells; report only issues inside the change blast radius or clearly amplified by it.
  - When the scope includes loops, rendering, repeated scans, database/API iteration, large inputs, or performance-sensitive paths, select the built-in complexity facet and use the local scanner/reference copy only as leads.
  - When the scope touches auth, secrets, untrusted input, telemetry, long-running operations, release/deploy gates, or broad test-suite trust, load `references/hardening-specialists.md` and select only the relevant hardening specialists.
  - When the scope touches demo-to-product readiness, shared action layers, programmatic APIs, agent docs, audit trails, admin/manageability UI, feature flags, idempotency, or product control surfaces, load `references/productization-surfaces.md`.
  - When the user asks to analyze, scan, audit, review, or give a complexity report, produce the full complexity report automatically and state that no files were modified.
  - When the user asks to fix, optimize, apply, change, refactor, or reduce complexity, still run the review pass first; implementation findings require repair options and the shared user-choice protocol before editing.
  - When the scope asks for thermo-nuclear / harsh maintainability review, antislop cleanup, prototype-to-maintainable structure, or the diff grows busy files, vague utility buckets, ad-hoc branching, thin wrappers, weak type boundaries, shared CSS sprawl, unsafe persisted-state changes, or wrong-layer logic, select the structural quality facet.
  - When implementation review findings require a repair choice, use `../cc-dev/references/user-choice-output-protocol.md` instead of free-form prose.
  - Never emit a recommend-only repair line such as "choose A" or "选 A" unless the same pause point presents the full host-native choice UI or a fixed fallback block with 2-3 mutually exclusive options.
  - Subagents are optional read-only reviewers; their raw output stays in the conversation and is not saved to files.
exit_criteria:
  - Findings are listed first, ordered by severity and backed by concrete file/line, command, diff, UI, log, or missing-evidence proof.
  - Every finding has impact, recommendation, and route: cc-plan, cc-do, cc-check, cc-act, or stop.
  - Findings include an ASCII Branch Chain when they involve plan scope, root cause, implementation behavior, PR diff risk, or code smell propagation; each non-trivial chain records evidence, diagnosis, causal path, Phenomenal/Essential/Philosophical layers, and walks from the fault node up through three upstream layers and down through three downstream layers when available. Missing layers stay explicit as missing evidence or blocked instead of being collapsed. Tree connector characters stay ASCII while node text follows the configured output language.
  - Plan or investigation review findings are written into the relevant `task.md` section before exit.
  - Implementation review findings are returned with concrete repair options and a blocking user choice through `../cc-dev/references/user-choice-output-protocol.md`; the question must contain 2-3 mutually exclusive choices, and no repair happens until the user selects one.
  - Eligible review escape findings are written as structured `task.md#Failure Ledger` candidates with `Source=cc-review`, `Status=unreviewed`, and `Keep for postmortem=no`.
  - In-scope code smells are either findings, explicit defers, or clean with reason.
  - Selected review facets or changed surfaces are checked, skipped with reason, or blocked; no artificial finding cap was applied.
  - If the complexity facet is selected, findings include current pattern, estimated current complexity, recommended change, estimated complexity after, risk level, and tests or measurements needed.
  - If a complexity report is requested, the response includes scope analyzed, detected stack/test/build commands, top findings ranked by likely impact, patch status, files modified yes/no, and residual verification risk.
  - If the complexity facet recommends a repair, behavior preservation is proven through relevant tests, ordering/identity/cache/authorization checks, and benchmarks or measurements when the improvement is non-obvious or performance-critical.
  - If the structural quality facet is selected, findings include the current structure, missed code-judo simplification, branching or abstraction smell, canonical ownership boundary, recommended restructuring, behavior-preserving argument, and approval/blocking verdict.
  - If hardening specialists are selected, every selected specialist is checked, skipped with reason, or blocked, and findings include the violated security, observability, release, or test-strategy control plus evidence, proof path, and residual risk.
  - If the productization surface facet is selected, findings name the missing or duplicated action, API, agent, audit, admin, feature-flag, idempotency, or operator surface, with repo evidence, route, validation path, and residual risk.
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

1. Target: plan, implementation, PR, mixed, complexity hotspot/report, structural quality hotspot, hardening specialist review, or productization surface review.
2. Findings: ordered by severity with file/line, evidence, impact, fix, and route.
3. Branch Chain: included for each non-trivial finding with evidence, diagnosis, causal path, Phenomenal/Essential/Philosophical layers, and fault-centered upstream/downstream walks of up to three concrete layers each; explicitly skipped only for trivial findings.
4. Repair options: required for implementation findings before editing.
5. Residual risk: test, runtime, docs, or evidence gaps.
6. Route: `cc-plan`, `cc-do`, `cc-check`, `cc-act`, or `stop`.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.

## Role

`cc-review` 是可选的深度审查节点。它只做一件事：找出当前范围内真实存在的问题，并把问题放到正确出口。

它不写 review 过程产物，不维护 review 状态机。计划 review 的事实写回 `task.md`；执行 review 的事实先进入当前回复，等用户选择修复方案后再修。PR review 只回对话或 GitHub review。只有符合 Review Escape Ledger 规则的逃逸类 finding 才能追加到 `task.md#Failure Ledger`。

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
6. Structural quality / code-judo review: `references/structural-quality.md`
7. Productization surface review: `references/productization-surfaces.md`
8. Complexity hotspot / report review: `references/complexity-optimization-playbook.md` and `references/complexity-report-template.md`
9. Hardening specialist review: `references/hardening-specialists.md`

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
4. Facets：按风险选择 strategy / engineering / design / DX / TOC / contract / smell / structural-quality / productization-surface / complexity / test / runtime / docs。
5. Nodes：把每个 selected facet 或 changed surface 当成一个 review node，在 scratch reasoning 中逐个检查；每个 node 只能 checked、skipped、blocked。
6. Chain：对 plan / investigation / broad implementation / PR / smell finding 画 ASCII Branch Chain，按“现象接收 -> 本质诊断 -> 哲学沉思 -> 本质整合 -> 现象输出”记录三层认知、证据、诊断、因果链；以错误节点为中心，向上追直接输入/调用方、合同/规格或 provider、来源意图/roadmap 三层，向下追首个受影响边界、行为或产物、发布或维护风险三层；某层确无证据时显式写 missing evidence / blocked，不允许压缩成一条泛泛结论。
7. Findings：每个 finding 必须有 evidence、impact、recommendation、route；没有证据的怀疑只能是 residual risk 或 blocked evidence。
8. Aggregate：合并重复 finding，降级弱证据，拒收 out-of-scope、stale、speculative finding。
9. Escape：如果 finding 证明流程、测试、设计或模型写法逃逸，把它作为候选写入 `task.md#Failure Ledger`；普通 finding 不进入 ledger。
10. Exit：计划问题写 `task.md`；实现问题回对话给修复选项；只差验证进 `cc-check`。

渐进加载只控制读多少上下文，不允许把该审的节点省掉。

## Exit Contract

- Plan / investigation review: directly update `devflow/changes/<change-key>/task.md` with the review findings, decision options, blocked assumptions, and required task changes. Final response only summarizes what was written and the next route.
- Implementation review: do not edit code during the review pass. Return findings plus repair options, use the shared choice protocol to ask which option to apply, and stop. After the user chooses, apply the selected repair directly and verify it.
- PR review: return findings in the response or GitHub review only; do not write local files.
- Clean review: say `No findings`, name residual verification risk, and route to `cc-check` or `stop`.

## Review Escape Ledger

`task.md#Failure Ledger` 不是 review finding 垃圾箱。`cc-review` 只有在 finding 证明问题本该被更早防线挡住时，才追加 ledger 候选：

- `process-escape`: planning, execution, verification, Git, release, or handoff workflow should have caught it before review.
- `test-escape`: test strategy, public seam, fixture, mock boundary, or regression loop should have caught it before review.
- `design-escape`: task contract, architecture boundary, state ownership, API shape, or abstraction choice should have made the issue hard to write.
- `model-pattern-escape`: a repeatable and preventable model-writing habit appears during review, regardless of severity.

普通 finding / ordinary findings、风格建议、一次性小 bug、没有复发防线的实现疏漏、advisory risk、speculative risk do not enter `task.md#Failure Ledger`。这些继续留在 review 输出、GitHub review、task contract update 或 repair choice。

每条 review escape candidate 必须写成结构化 ledger 行：

```markdown
| FL-### | cc-review | <trigger> | process-escape / test-escape / design-escape / model-pattern-escape | <symptom> | <evidence> | <attempted fix or N/A> | <result> | <repeatable prevention rule> | unreviewed | no |
```

`cc-review` 不把候选提前升级为 postmortem 结论；`cc-check` 负责分类，`cc-act` 只压缩 confirmed + keep=yes 的 ledger 事实。

## Risk Lanes

复杂实现、跨模块 diff、PR landing 前复审、或 mixed review 默认考虑七条风险 lane。小 diff 可以由一个 combined pass 覆盖，但必须说明 skip reason。

1. Intent / regression: diff 是否兑现意图，是否引入范围外行为、fallback 退化、caller/callee contract 漂移。
2. Security / privacy: auth、输入验证、注入、secret、敏感数据、默认权限、外部输入信任边界。
3. Performance / reliability: 热路径重复 I/O、启动/渲染/请求成本、cleanup 泄漏、retry storm、排序/竞态、失败处理。
4. Complexity / hotspots: 嵌套扫描、重复 membership/search、循环内排序、pairwise comparison、render path 重算、N+1 query/API、可避免 O(n^2) 或 O(n*m)。
5. Contracts / coverage: API/schema/type/config/flag、迁移 fallout、回归测试、日志、metrics、assertion、error path。
6. Productization surface: shared action layer、API/agent surface、audit trail、admin/manageability、feature flags、idempotency、operator path 是否形成产品控制面，而不是 demo-only 路径。
7. Structural quality / code-judo: 是否能通过薄入口、小文件、feature-owned 模块、纯领域逻辑、集中契约、兼容迁移、真实视口 QA、重新归位所有权、删除特殊分支、收紧类型边界、复用 canonical helper、拆分超大文件、合并重复路径或原子化更新，让行为不变但结构明显更简单。

这些是审查视角，不是 finding 配额。

## Hardening Specialist Review

Hardening specialists are conditional lenses, not parallel workflow skills. Load
`references/hardening-specialists.md` for selected security, observability,
release-readiness, or test-strategy risk. Selected specialists must end as
checked, skipped with reason, or blocked; findings must name the violated
control, evidence, proof path, and residual risk.

## Productization Surface Review

Productization surfaces are conditional lenses, not implementation workflows.
Load `references/productization-surfaces.md` when a demo or working app needs
shared actions, programmatic API, agent docs, audit trail, admin/manageability,
feature flags, idempotency, or operator paths reviewed. Findings route missing
services to `cc-plan` unless the fix is already scoped and implementation-ready.

## Structural Quality / Code-Judo Review

结构质量专项是 `cc-review` 的内置能力。加载
`references/structural-quality.md`，按证据审查薄入口、小文件、feature-owned
模块、纯领域逻辑、集中契约、兼容迁移、真实视口 QA、ownership、分支增长、薄抽象、
类型边界、文件膨胀和 code-judo 简化机会；它不是单独报告格式，也不是 nit 配额。
结构 finding 必须包含 current structure、missed simplification、ownership
boundary、recommended restructuring、behavior-equivalence argument 和 approval
verdict。

## Complexity Hotspot Review

复杂度专项是 `cc-review` 的内置能力，不依赖外部 skill。需要时只使用本 skill 的
scanner 和两份 reference；scanner 只产生 leads，每个 finding 仍要回读代码、
调用方、测试、输入规模和排序/重复/权限语义。

```bash
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format markdown
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format json
```

Load `references/complexity-optimization-playbook.md` for transformation checks
and `references/complexity-report-template.md` for report shape. Analyze / scan /
audit / report requests produce a full report and no file edits. Fix / optimize /
refactor requests still review first, then use repair options before code changes.
Complexity findings must preserve ordering, duplicates, identity, cache
invalidation, authorization, pagination, rate limits, retry, and error behavior;
non-obvious or hot-path changes need tests plus measurement.

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
- Productization fields when selected: missing or duplicated product control surface, affected workflow, API/agent/audit/admin/flag/operator impact, smallest product contract or fix, validation path, and residual risk.

代码坏味道包括 rigidity、duplication、cycle、fragility、obscurity、data-clump、unnecessary complexity。范围内发现就报；不在范围内只作为 defer 或不提。

## ASCII Branch Chain Shape

Use `references/review-methods.md` as the label table and template source.
Tree connector tokens stay ASCII; labels and explanations follow the configured
output language. Non-trivial chains keep Phenomenal / Essential / Philosophical
layers and the fixed thought path, then walk from the fault node up to three
upstream layers and down to three downstream layers. Plan / investigation chains
go into `task.md`; implementation / PR chains stay in the response or GitHub
review.

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
