# CC-Review Playbook

## State Machine

`cc-plan / cc-investigate / cc-do / PR -> cc-review -> cc-plan | cc-do | cc-check | cc-act | stop`

## Resource Resolution

`SKILL.md` 是入口路标，`PLAYBOOK.md` 和 `references/` 是按需加载资料。引用资源时一律从当前 `SKILL.md` 所在目录解析，不从 shell cwd 猜：

- `PLAYBOOK.md`
- `references/<name>.md`
- `scripts/<name>`

Source 安装时当前目录是 `.claude/skills/cc-review/`；Codex mirror 安装时当前目录是 `.codex/skills/cc-review/`。frontmatter `reads` 由 adapter 重写成目标平台路径，正文保持相对路径。

## Core Rules

1. 先判断 review 对象是计划、实现、PR，还是混合。
2. 只读当前范围需要的 `task.md`、PR 文本、diff、代码、测试、日志和运行证据。
3. 不读取、不生成、不维护过程文件。
4. Git history 是唯一持久 review 记忆；重复 review 时用 `git diff <old>...HEAD` 缩小范围。
5. 可用 subagent 时可以派发只读 reviewer；raw output 留在会话里，主线程验证后再进入最终 findings。
6. 按 `Review Node Selection` 和 `Facet Loading Contracts` 选择最小必要节点；不要把 specialty facet 当成默认体检。
7. 按 selected facet 或 changed surface 逐节点检查；每个节点 checked、skipped 或 blocked。
8. 不固定 finding 数量。证据决定输出。
9. 每条 finding 必须有 evidence、impact、recommendation 和 route。
10. 复杂度 report-only 请求默认输出完整报告并明确没有改文件；只有用户明确要求 fix / optimize / apply / refactor 时才进入修复选择。
11. 复杂度修复前必须确认数据规模、热路径、排序、重复键、identity、cache invalidation、权限、分页和错误语义；修复后先 narrow test，再 broad relevant test/build，必要时补 measurement。
12. 输出前聚合 raw findings：合并重复，降级弱证据，拒收 speculative / out-of-scope / stale findings。
13. 计划 review 的结果直接写回 `task.md`；执行 review 的结果通过共享 choice protocol 询问用户选择修复方案；只有流程、测试、设计或模型写法逃逸类 finding 追加到 `task.md#Failure Ledger`；只差验收，进 `cc-check`。

## Iron Law

```text
FIND THE REAL PROBLEM. DO NOT CREATE REVIEW ARTIFACTS.
```

Review 的价值在于问题质量，不在于过程记录数量。没有证据就不报；有证据就直接报。

## Branch Classifier

| Branch | Signal | Review target |
| --- | --- | --- |
| `plan` | 用户说先 review 方案、只有 `task.md` / docs / issue | scope, contract, architecture, test strategy |
| `implementation` | 当前分支已有 code / test / docs diff | diff, behavior, tests, smells, regression risk |
| `PR` | 用户要求 review PR | PR diff, body accuracy, CI/test proof, merge risk |
| `mixed` | 方案和实现都变了 | plan contract first, then implementation conformance |
| `report-only` | 用户要求 complexity / structural / hardening report，不要求改代码 | current evidence, ranked findings, files modified: no |

## Review Loop

每次 review 都保留深度流程，但不保留过程文件：

1. Classify：判断 `plan` / `implementation` / `PR` / `mixed` / `report-only`。
2. Scope Freeze：写清本次 review 的意图、blast radius、明确不审的历史债。
3. Delta：用 Git、PR diff、`task.md` 和当前命令输出确定相对上次或 base 的真实变化。
4. Facets：按风险选择 strategy / engineering / design / DX / TOC / contract / smell / structural-quality / productization-surface / complexity / test / runtime / docs。
5. Nodes：把每个 selected facet 或 changed surface 当成一个 review node，在 scratch reasoning 中逐个检查；每个 node 只能 `checked`、`skipped` 或 `blocked`。
6. Chain：对 plan / investigation / broad implementation / PR / smell finding 画 ASCII Branch Chain，按“现象接收 -> 本质诊断 -> 哲学沉思 -> 本质整合 -> 现象输出”记录三层认知、证据、诊断、因果链。
7. Findings：每个 finding 必须有 evidence、impact、recommendation、route；没有证据的怀疑只能是 residual risk 或 blocked evidence。
8. Aggregate：合并重复 finding，降级弱证据，拒收 out-of-scope、stale、speculative finding。
9. Escape：如果 finding 证明流程、测试、设计或模型写法逃逸，把它作为候选写入 `task.md#Failure Ledger`；普通 finding 不进入 ledger。
10. Exit：计划问题写 `task.md`；实现问题回对话给修复选项；只差验证进 `cc-check`。

渐进加载只控制读多少上下文，不允许把该审的节点省掉。

## Exit Contract

- Plan / investigation review: directly update `devflow/changes/<change-key>/task.md` with review findings, decision options, blocked assumptions, and required task changes. Final response only summarizes what was written and the next route.
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

## Review Node Selection

从四个信号选节点：branch 类型、changed surfaces、用户显式要求、缺失证据。不要默认跑完整体检；只有 broad diff、PR landing、mixed review 或多表面风险明确时，才加载 `references/review-methods.md` 的 risk-lane swarm profile。

每个 selected node 必须对应一个具体问题、文件表面、公共合同或风险面，并以 `checked`、`skipped: <reason>` 或 `blocked: <missing evidence>` 结束。小 diff 可以用一个 combined node 覆盖 intent/regression、security/privacy、performance/reliability、contracts/coverage，但必须说明哪些 facet 未触发。

## Facet Loading Contracts

Facet 是按需镜头，不是并行工作流，也不是 finding 配额：

| Trigger | Load | Output obligation |
| --- | --- | --- |
| broad implementation, PR landing, mixed risk | `references/review-methods.md` | selected lanes checked / skipped / blocked |
| security, observability, release, test-suite trust | `references/hardening-specialists.md` | violated control, proof path, risk gate, residual risk |
| demo-to-product, API/agent/audit/admin/flag/operator surface | `references/productization-surfaces.md` | missing product control surface, smallest product contract or route |
| maintainability, code-judo, slop, file/ownership/type/style sprawl | `references/structural-quality.md` | structure, missed simplification, boundary, behavior-equivalence, approval verdict |
| complexity scan/report/fix request or hot-path risk | `references/complexity-optimization-playbook.md`, `references/complexity-report-template.md` | confirmed complexity finding, behavior preservation, tests or measurement |

复杂度 scanner 只产生 leads；每个 finding 仍要回读代码、调用方、测试、输入规模和排序/重复/权限语义。

```bash
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format markdown
python3 <active-skill-dir>/scripts/analyze_complexity.py <repo> --format json
```

Load `references/complexity-optimization-playbook.md` for transformation checks and `references/complexity-report-template.md` for report shape. Analyze / scan / audit / report requests produce a full report and no file edits. Fix / optimize / refactor requests still review first, then use repair options before code changes. Complexity findings must preserve ordering, duplicates, identity, cache invalidation, authorization, pagination, rate limits, retry, and error behavior; non-obvious or hot-path changes need tests plus measurement.

## Review Standard

`cc-review` 的主问题只有五个：

1. Review 对象和真实意图是什么？
2. 当前 scope 内哪些节点已经 checked / skipped / blocked？
3. 哪些 finding 有证据、影响、最小修复和路线？
4. 哪些 specialty facet 被触发，哪些没有触发，原因是什么？
5. 下一步为什么是 `cc-plan` / `cc-do` / `cc-check` / `cc-act` / `stop`？

专项问题只在对应 facet 被选中时回答；不要把 complexity、hardening、productization、structural-quality 的完整清单塞进每次 review。

## Decision Rule

计划 review 发现的范围、架构、用户可见行为、公共 API、测试策略问题，必须直接写进 `task.md` 的合同、任务或开放问题里。执行 review 发现的问题必须给出修复选项，并按 `../cc-dev/references/user-choice-output-protocol.md` 询问用户是否修复以及选择哪种方案；用户选择后再直接修改代码并验证。review 证明流程、测试、设计或模型写法逃逸时，额外写入 `task.md#Failure Ledger`，默认 `Status=unreviewed`、`Keep for postmortem=no`。

## Finding Rules

每条 finding 的共同最小字段：

- severity: `critical` / `important` / `advisory`
- scope: 为什么属于当前请求范围
- evidence: 文件行、diff、命令输出、浏览器动作、日志、截图或明确缺失的证据
- impact: 它会导致什么错误、回归、维护成本或用户问题
- recommendation: 最小修复动作
- route: `cc-plan` / `cc-do` / `cc-check` / `cc-act` / `stop`

Non-trivial finding 或 smell propagation 需要 ASCII Branch Chain；模板和认知层规则来自 `references/review-methods.md`。Specialty fields 只在对应 facet 被选中时加载对应 reference，不在主流程重复维护。

代码坏味道包括 rigidity、duplication、cycle、fragility、obscurity、data-clump、unnecessary complexity。范围内发现就报；不在范围内只作为 defer 或不提。

## ASCII Branch Chain Shape

Use `references/review-methods.md` as the label table and template source. Tree connector tokens stay ASCII; labels and explanations follow the configured output language. Non-trivial chains keep Phenomenal / Essential / Philosophical layers and the fixed thought path, then walk from the fault node up to three upstream layers and down to three downstream layers. Plan / investigation chains go into `task.md`; implementation / PR chains stay in the response or GitHub review.

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
