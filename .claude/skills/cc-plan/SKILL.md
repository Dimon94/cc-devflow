---
name: cc-plan
version: 3.6.2
description: Use when a requirement, roadmap item, or bug needs scope clarification, design decisions, and executable task breakdown before coding starts.
triggers:
  - 帮我规划这个需求
  - 先别写代码先定方案
  - 这个 bug 边界不清
  - 拆一下任务
  - plan this requirement
  - scope this bug
  - turn this into tasks
reads:
  - PLAYBOOK.md
  - CHANGELOG.md
  - assets/DESIGN_TEMPLATE.md
  - assets/TINY_DESIGN_TEMPLATE.md
  - assets/TASKS_TEMPLATE.md
  - assets/TASK_MANIFEST_TEMPLATE.json
  - references/planning-contract.md
writes:
  - path: devflow/changes/<change-key>/planning/design.md
    durability: durable
    required: true
  - path: devflow/changes/<change-key>/planning/tasks.md
    durability: durable
    required: true
  - path: devflow/changes/<change-key>/planning/task-manifest.json
    durability: durable
    required: true
  - path: devflow/changes/<change-key>/change-meta.json
    durability: durable
    required: true
entry_gate:
  - Read roadmap handoff, current requirement files, code, docs, and tests before drafting design.
  - Load cc-devflow native language and decision sources (`devflow/specs/`, roadmap/backlog handoff, current or prior `planning/design.md` / `planning/analysis.md`, and `change-meta.json`) before naming concepts, modules, tests, or tasks.
  - Freeze problem, constraints, non-goals, and success criteria before proposing implementation tasks.
  - If the raw ask spans multiple independent subsystems, split it back into roadmap stages or separate REQ/FIX candidates before asking implementation details.
  - "For non-trivial designs, compare named option roles: minimal viable, ideal architecture, and optional hybrid. Do not default to smallest unless it best serves the goal."
  - Plan executable work as Red/Green/Refactor by default; identify the first failing test before any production implementation task, or write an explicit TDD exception with replacement evidence.
  - Assign a canonical change key before writing artifacts; feature work must use `REQ-<number>-<description>`, and bug-fix work must use `FIX-<number>-<description>`.
  - Do not generate planning/tasks.md, planning/task-manifest.json, or change-meta.json until the recommended design is approved.
exit_criteria:
  - planning/design.md captures the approved solution, boundaries, review conclusions, and execution edge cases.
  - planning/tasks.md, planning/task-manifest.json, and change-meta.json are explicit enough that cc-do can continue without chat memory.
  - The task breakdown preserves test-first execution; failing-test tasks precede implementation tasks, refactor checkpoints are visible, and any TDD exception is justified.
  - 'Only one next step remains: enter cc-do.'
reroutes:
  - when: The discussion is still about project direction or stage order instead of one requirement.
    target: roadmap
  - when: The plan is already approved and tasks are already frozen.
    target: cc-do
recovery_modes:
  - name: re-open-design
    when: Execution feedback, review findings, or user correction invalidates the current design contract.
    action: Return to planning/design.md, reopen the approved decision explicitly, and regenerate tasks only after the design is stable again.
tool_budget:
  read_files: 10
  search_steps: 6
  shell_commands: 5
---

# CC-Plan

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，必要时写 migration note，然后检查 `CLAUDE.md`

## Role

`cc-plan` 是 PDCA 里的 `Plan`。

它的目标不是制造一串 planning 文档，而是把 requirement 压成最少但足够强的交付物，让 `cc-do` 不需要临场补脑。

## Runtime Output Policy

写入任何 durable Markdown 或 JSON metadata 前，先运行 `cc-devflow config resolve --format policy`。

- `Output language` 是机器约束，`planning/design.md`、`planning/tasks.md` 和 `change-meta.json` 必须记录并遵守它。
- `agent_preferences` 是用户偏好建议，只影响表达方式和结构选择，不覆盖本 Skill 的工作流边界。
- 如果配置解析失败，先修配置或向用户说明阻塞，不要用默认语言继续生成正式文档。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `assets/DESIGN_TEMPLATE.md`
4. `assets/TINY_DESIGN_TEMPLATE.md`
5. `assets/TASKS_TEMPLATE.md`
6. `assets/TASK_MANIFEST_TEMPLATE.json`
7. `references/planning-contract.md`

## Use This Skill When

- 新 requirement 还模糊
- bug 现象很多，但修复边界还没定
- 需求变更后需要重做设计与任务拆解
- 你不确定下一步要做什么

如果方案已经冻结、任务已经清楚，不要重开 planning，直接去 `cc-do`。

## Quick Start

先判断这次 planning 属于哪一种，而不是一上来就写满版设计：

| 现实状态 | 先走什么路径 |
| --- | --- |
| 需求还模糊，边界和成功标准都不稳 | `clarify-first`，先补 `planning/design.md` 的问题定义与约束 |
| 变更很小，但仍需要冻结做法和任务 | `tiny-design` |
| 跨模块、高风险、会逼执行者二次设计 | `full-design` |

先给出默认 planning 形态，再解释为什么不是另外两种。`cc-plan` 的第一件事不是产出文档，而是压平 planning 密度。

`tiny-design` 只是短设计，不是免设计。再小的变更也必须在 `planning/design.md` 里写清边界、验证和用户批准状态，不能用“太简单”跳过设计 gate。

## Harness Contract

- Allowed actions: clarify scope, compare designs, split over-broad asks into separate planning candidates, freeze decisions, and write only `planning/design.md`, `planning/tasks.md`, `planning/task-manifest.json`, and `change-meta.json`.
- Forbidden actions: writing production code, splitting planning into new side documents, or emitting tasks before approval.
- Required evidence: design choices, task boundaries, and verification commands must point back to repo facts or explicit user approval.
- Reroute rule: if the problem expands to project strategy go back to `roadmap`; if the plan is already frozen move straight to `cc-do`.

## Change Key Contract

`<change-key>` 不是自由 slug。它必须先表达变更类型，再表达编号，最后才是描述：

- 需求 / 功能 / 规格变更：`REQ-<number>-<description>`
- 缺陷 / 回归 / 修复变更：`FIX-<number>-<description>`

描述部分使用 kebab-case，可以保留中文词组，但不允许丢掉大写 `REQ` / `FIX` 前缀。不要再创建 `req-123-...`、`bug-123-...`、纯描述目录或没有编号的目录。旧的小写目录只能作为历史兼容读取目标，不作为新 planning 输出。

## Autoplan Principles

这些规则属于 `cc-plan` 的原生决策口径，不允许拆成额外文档：

1. Choose completeness：如果完整方案只多花少量 agent 时间，就不要留下 happy-path 计划。
2. Boil lakes：同一 blast radius 内、少于 1 天 agent 工作量的边界问题，应纳入当前计划；跨系统迁移才 defer。
3. Pragmatic：两个方案都能达成目标时，选更小、更直白、更可验证的方案。
4. DRY：已有流程、脚本、spec、运行时能复用时，不准设计平行系统。
5. Explicit over clever：十行人人看懂的实现路径胜过二百行抽象。
6. Bias toward action：把不确定性压成明确 gate、风险和后续入口，不让计划停在空泛讨论。

自动决策也要留痕：机械选择写进 `planning/design.md` 的 decision log；taste decision 或用户原始方向被挑战时，必须明确标成 `taste decision` / `user challenge`，由用户最后拍板。

## Output Model

`cc-plan` 只允许产出 4 个主文件，默认采用“少文档、强文档”的输出模型：

1. `planning/design.md`
   - 吸收原来的 clarification / brainstorm / review 结论
   - 记录 source handoff、问题定义、备选方案、批准方案、设计决策、review gate、执行边界
2. `planning/tasks.md`
   - 只保留可执行任务和执行 handoff
   - 顶部写清 frozen decisions、read first、commands to trust、TDD plan、并行边界
3. `planning/task-manifest.json`
   - 从 `planning/tasks.md` 编译出的机器真相源
   - 只服务执行与调度，不再承担人类阅读的叙事职责
4. `change-meta.json`
   - 绑定 roadmap item、primary capability、secondary capabilities、expected spec delta、spec sync status
   - 作为 `cc-do`、`cc-check`、`cc-act` 的 capability 机器真相源

以下文件不再是 `cc-plan` 的默认交付物：

- `CLARIFICATION_REPORT.md`
- `BRAINSTORM.md`
- `PLAN_REVIEW.md`
- `context-package.md`
- `handoff/resume-index.md`

这些信息如果仍然需要，必须并入 `planning/design.md` 或 `planning/tasks.md`，而不是再拆新文件。

## Entry Gate

1. 先确认当前对象是一个 requirement，而不是整个项目路线图。
2. 如果来源于 `roadmap`，必须先定位对应的 `RM-ID`，读清 `devflow/ROADMAP.md` / `devflow/BACKLOG.md` 的版本、证据、约束、success signal、next decision、primary capability、expected spec delta。
3. 如果原始需求包含多个可独立交付的子系统，先拆成独立 `RM` 或 `REQ/FIX` 候选；不要在一个 `cc-plan` 里继续追问实现细节。
4. 先读当前 change 目录现状。旧目录里如果还有 `BRAINSTORM.md` / `PLAN_REVIEW.md` / `context-package.md`，把有效信息吸收进新的 `planning/design.md`，不要继续增殖。
5. 先看代码、文档、测试和最近提交，再谈拆任务。
6. 先读 cc-devflow 原生项目语言和决策上下文：`devflow/specs/INDEX.md`、相关 capability specs、roadmap/backlog handoff、当前或历史 `planning/design.md` / `planning/analysis.md`、`change-meta.json`；不存在时静默跳过，但发现术语冲突必须写成 blocked question 或 user challenge。
7. 先写不做什么，再写做什么。

## Context Sweep

进入 planning 前，至少主动收这些事实：

1. 当前对象对应的 `RM-ID`、roadmap version、roadmap skill version
2. `devflow/ROADMAP.md` / `devflow/BACKLOG.md` 中该事项的阶段来源、证据、dependencies、success signal、kill signal、next decision、capability links
3. `devflow/specs/INDEX.md` 与相关 capability specs
4. 项目语言 / 决策上下文：`devflow/specs/INDEX.md`、相关 capability specs、roadmap/backlog handoff、当前或历史 `planning/design.md` / `planning/analysis.md`、`change-meta.json`
5. 当前 change 目录已有的 `planning/design.md`、`planning/tasks.md`、`planning/task-manifest.json`、`change-meta.json` 与历史 planning 文档
6. `CLAUDE.md`、README、相关 docs / specs / 最近提交
7. 当前代码、测试、发布、迁移、依赖的现实边界
8. 测试框架真相源：优先读 `CLAUDE.md` / project docs 的测试约定，再用配置文件和目录结构补证。
9. 如果有 UI scope，读取现有设计系统、组件、页面状态和交互模式。
10. 如果是 API / CLI / SDK / developer-facing / operator-facing scope，读取 README、docs、package metadata、安装/运行/调试入口和当前 first-success path。

先把这些材料压成 `Source Handoff`，再决定 discovery 还是 planning。

## Discovery Questions

澄清的核心不是多问，而是逼近真实问题。澄清时优先用这些问题压缩范围：

1. Demand reality：这个 requirement 具体让谁的工作变好，当前没有它会卡在哪里？
2. Status quo：用户现在怎么绕过这个问题，现有 repo 里哪些代码已经解决了一半？
3. Desperate specificity：哪一个失败场景最痛，必须在本轮变绿？
4. Narrowest wedge：最小可交付边界是什么，哪些同 blast radius 问题必须顺手解决？
5. Observation：有没有日志、测试、真实流程、最近提交能证明这个问题存在？
6. Future fit：这个方案 6 个月后是否仍然是正确边界，还是会制造第二套系统？
7. Language fit：这次使用的核心名词是否已经是项目里的 canonical term，还是在创造第二套语言？
8. Interface fit：调用方真正需要的最小公共接口是什么，哪些复杂度应该被藏在模块内部？

一次只问一个关键未知点。能从代码、文档、测试、git 历史里确认的问题，不问用户。

## Grilling Protocol

`cc-plan` 可以吸收 brainstorm / grilling 的结论，但不再产出独立 `BRAINSTORM.md`。深挖问题时遵守这些规则：

1. 沿决策树一枝一枝走。每次只解决一个会改变设计或任务切分的关键分支。
2. 每个问题必须附带推荐答案、证据来源、以及如果用户反对会影响哪些下游决策。
3. 能从代码、docs、tests、git history、capability spec、roadmap handoff 或历史 design/analysis 得到答案时，先查证，不问用户。
4. 用户或文档里的模糊词必须被压成 canonical term；如果和 `devflow/specs/`、roadmap/backlog 或历史 design/analysis 冲突，立即标成 `language conflict`。
5. 具体场景优先于抽象概念。每个关键边界至少用一个真实 codepath、user flow、operator flow 或 failure path 压测。
6. 只有满足 hard to reverse、surprising without context、real trade-off 三个条件的决策，才建议沉淀为 capability spec delta 或 roadmap/backlog decision note；否则留在本次 design decision log。

## Session Protocol

1. 先探索上下文，再写结论。
2. 澄清时一次只问一个关键问题，不做问题轰炸。
3. 先写问题、目标、约束、非目标、成功标准，再写方案。
4. 如果方向仍不稳，给 2-3 个方案，带 trade-off 和推荐，但这些内容都写进 `planning/design.md`。
   - `full-design` 的方案必须至少包含 `minimal viable` 和 `ideal architecture` 两个角色。
   - 两个角色权重相等；小方案不是默认答案，理想架构也不是默认过度设计。
   - 只有一个方案成立时，必须写清其它方案为何被排除。
5. 推荐方案没有得到用户明确批准前，不允许生成 `planning/tasks.md`。
6. 批准后先判断这次用 `tiny-design` 还是 `full-design`。
7. 把批准后的唯一方案冻结进 `planning/design.md`。
8. 在 `planning/design.md` 内完成 review loop 与 final gate，不再额外拆出 `PLAN_REVIEW.md`。
9. 只有 design gate 真正通过，才能写 `planning/tasks.md`、`planning/task-manifest.json` 和 `change-meta.json`。
10. 计划完成后，下一步唯一答案是 `cc-do`。

## Engineering Review Gate

冻结设计前，必须在 `planning/design.md` 内完成一次轻量工程审查：

1. Existing leverage map：每个子问题先映射到现有代码、脚本、spec、模板或测试，避免重复造轮子。
2. Scope challenge：超过 8 个文件、2 个新 service/class、或跨模块连锁时，必须解释为什么不是过度设计。
3. Implementation surface map：先锁定每个会新增或修改的文件、职责、归属理由、耦合风险，再拆任务。
4. Option role check：非 trivial 方案必须比较 `minimal viable`、`ideal architecture`，必要时加 `hybrid`，并写清为什么推荐方案服务当前目标。
5. Domain language check：核心名词、文件命名、测试名、任务标题必须对齐 `devflow/specs/`、roadmap handoff 或历史 design/analysis；没有来源时写 assumption，不要临时发明第二套语言。
6. Interface depth check：新增或改动模块 / API / CLI / SDK 时，先说明调用方、公共操作、隐藏复杂度、易用错点；必要时做两种以上接口形态比较，优先小接口深模块。
7. Implementation decision horizon：提前写出 foundation、core logic、integration、polish/tests 阶段实现者会撞到的决策，能现在冻结就不要留给 `cc-do` 临场猜。
8. Architecture diagram：跨模块或状态流变更要写 ASCII 数据流 / 依赖图。
9. Error & Rescue map：`full-design` 必须按 codepath 写清 failure、rescue、user sees、test evidence；不适用时写 N/A 理由。
10. Code quality scan：指出 DRY、命名、错误处理、三层以上分支、隐藏耦合风险。
11. Test diagram：列出新增 code path、user flow、错误路径、边界状态，并标注 first failing test、unit / e2e / eval。
12. Test seam check：每条 Red 任务必须说明通过哪个公共接口、调用方流程或用户可见路径证明行为；如果只能测私有函数、内部调用次数或临时结构，先改设计或写 blocked question。
13. Mock boundary check：只允许 mock 系统边界，如外部 API、时间、随机性、文件系统、必要数据库边界；不 mock 自己控制的内部模块。
14. Feedback loop check：为每条行为选定最短可信反馈循环，优先顺序是自动测试、curl/HTTP、CLI+fixture、浏览器脚本、trace replay、throwaway harness、property/fuzz、differential loop、HITL script。
15. Test framework source：先记录测试框架来自 `CLAUDE.md` / docs / config / directory 的哪条证据；不能靠猜。
16. UI state coverage：有 UI / interaction scope 时，写 loading / empty / error / success / partial 状态表和 design completeness score。
17. DX / operator coverage：developer-facing / operator-facing scope 必须写 target persona、time to first value、magic moment、install / run / debug / upgrade 风险。
18. Performance and distribution：涉及批量、I/O、发布物、CLI、包、容器时，必须写清性能和分发边界。
19. NOT in scope：所有被考虑但 defer 的内容要写理由，不能消失在聊天里。
20. Review calibration：只有会导致 `cc-do` 建错、卡住、越界、漏测的问题才是 blocking；措辞偏好和非阻塞建议不能伪装成 gate failure。

如果任一项无法从当前证据完成，写 `assumption` 或 `blocked question`，不要伪装成已经审过。

## Test-First Planning

`cc-plan` 生成具体计划时默认采用测试先行纪律。不能让计划是“先实现再补测”，然后把 TDD 压力留给 `cc-do` 临场修正。

1. 先定位测试框架真相源：
   - 优先读取 `CLAUDE.md` / project docs 中的 testing 约定。
   - 如果没有，按配置文件和目录结构识别：`vitest` / `jest` / `pytest` / `go test` / `cargo test` / `rspec` / `playwright` / `cypress` 等。
   - 如果仍然没有框架，写成 `test framework unknown`，并把验证计划降级为 exploratory spike 或 manual evidence，不准假装已有自动测试路径。
2. 先冻结测试 seam 和行为断言：
   - Red 必须通过公共接口、调用方流程、CLI/API/UI 路径或其它真实边界证明行为缺失。
   - 测试名、断言和 fixture 必须描述用户 / 调用方关心的行为，不描述内部实现步骤。
   - 如果正确 seam 不存在，计划先写 exploratory spike 或架构 follow-up，不准用脆弱单元测试冒充回归保护。
3. 每个可观察行为变更默认拆成 `Red -> Green -> Refactor`：
   - Red：先写 `[TEST]` 任务，目标是用最小失败测试证明目标行为缺失。
   - Green：再写 `[IMPL]` 任务，只做让对应红灯转绿的最小生产实现。
   - Refactor：最后写 `[REFACTOR]` 或在实现任务中明确 refactor checkpoint，说明何时清理重复、命名、结构和坏味道。
4. 禁止水平切片：不能先写一批测试、再写一批实现。计划必须按 tracer bullet 垂直切片排列：一个行为红灯 -> 最小实现转绿 -> 必要重构，然后再进入下一个行为。
5. `planning/tasks.md` 不能把测试和实现塞进同一个 task。一个 task 同时写“实现并测试”就是计划失败。
6. `planning/tasks.md` 的每个 `[TEST]` task 必须写清 test seam、behavior asserted、allowed mocks、feedback loop type、implementation-detail risk。
7. `planning/task-manifest.json` 必须让 `cc-do` 看出每个任务的 `tddPhase`、依赖、测试质量边界和证据：`red` 任务产出 failing output，`green` 任务产出 passing output，`refactor` 任务产出重跑后的 green evidence。
8. Test diagram 要同时覆盖 code paths 和 user flows。每条路径标注 `unit` / `integration` / `e2e` / `eval`，并给现有测试质量分级：`strong`、`happy-path-only`、`smoke-only`、`missing`。
9. 回归测试是硬门槛。只要计划修改既有行为且现有测试没有覆盖，就必须把 regression test 写进 `planning/tasks.md`，不能 defer，不能问用户要不要跳过。
10. 只有纯文档、纯配置、纯生成文件、throwaway prototype 可以例外。例外必须写进 `planning/design.md` 和 `planning/tasks.md` 的 `TDD exceptions`，包含原因、风险、替代验证命令和后续补证入口。
11. 并行只允许发生在已经满足上游 Red/Green 依赖之后。两个 `[P]` 任务如果共享同一个红灯或同一组 touched files，就不能并行。
12. 如果当前需求找不到第一条失败测试，先把它写成 blocked question 或 exploratory spike，不准伪装成可执行实现任务。

## Design Modes

`cc-plan` 永远保留 `planning/design.md`，但允许两种密度：

- `tiny-design`：超小需求的冻结设计卡片
- `full-design`：需要完整架构说明的正式设计

优先使用 `tiny-design`，但只有同时满足这些条件才成立：

1. 变更集中在单一功能点
2. 触达文件通常只有 1-3 个
3. 不涉及 migration、复杂状态流、权限、安全、回滚编排
4. 执行者看完一张冻结卡片就能准确落地

`tiny-design` 仍然必须有用户批准、implementation surface、第一条验证证据和升级到 `full-design` 的触发条件。它消除的是冗长文档，不是消除设计。

出现以下任一情况，直接升级到 `full-design`：

1. 需要跨模块协调或多阶段落地
2. 有数据模型、接口契约、状态机、迁移或兼容性风险
3. 有安全、权限、计费、同步一致性等高代价约束
4. 如果不先讲清边界，执行者会被迫二次设计

## Review Loop

`planning/design.md` 内至少完成这些 review 结论：

1. Placeholder scan：不能留下 TBD / TODO / 之后再补
2. Consistency scan：目标、方案、任务、验证口径不能互相打架
3. Scope scan：不能偷偷长成另一个 requirement
4. Ambiguity scan：实现者看完不能还靠猜
5. Feasibility scan：方案要接得上现有代码、依赖和时间边界
6. Source alignment：仍然对齐上游 roadmap 的 success signal、constraints、non-goals
7. Engineering scan：完成 existing leverage、scope challenge、implementation surface、test diagram、failure modes、NOT in scope
8. Decision horizon scan：foundation / core / integration / polish/tests 的实现决策是否已经冻结或明确 blocked。
9. Error & rescue scan：`full-design` 是否写清 failure -> rescue -> user sees -> test evidence。
10. Test framework / regression scan：测试框架来源、覆盖质量、回归测试是否明确。
11. Test seam / mock boundary scan：Red 任务是否通过公共 seam 证明行为，mock 是否只发生在系统边界，反馈循环是否可重复。
12. Domain language scan：核心名词、测试名、文件职责是否沿用项目语言；冲突是否写成 blocked question / user challenge。
13. Interface depth scan：新增接口是否足够小、隐藏复杂度是否足够深、调用方是否容易正确使用且不容易误用。
14. Tracer bullet scan：任务是否按一个行为一条 Red/Green/Refactor 链组织，而不是按测试层、服务层、UI 层水平堆叠。
15. Review calibration：只把会导致实现错误、执行卡住、范围越界、验证缺失的问题标成 blocking；非阻塞建议必须降级为 advisory
16. Final gate：明确 auto-decided items、taste decisions、user challenges 和最终 recommendation

如果有 UI / interaction 明显范围，在 `planning/design.md` 里补 design completeness score 和状态覆盖表。
如果有 API / CLI / developer-facing / operator-facing scope，在 `planning/design.md` 里补 target persona、time to first value、magic moment 和 DX / operator review 结论。

## Good Output

- `planning/design.md` 一份就讲清：为什么做、做什么、不做什么、备选方案、批准方案、设计模式、风险、review gate、执行边界
- `planning/design.md` 必须使用项目 canonical language，记录相关 capability spec / roadmap decision 冲突，并说明新增接口如何保持小接口深模块
- `planning/tasks.md` 只保留能直接执行的任务和 handoff，不再承载重复背景介绍；行为变更默认拆成 tracer bullet 形式的 `[TEST] -> [IMPL] -> [REFACTOR]`，且 Red task 明确公共 seam、行为断言、mock 边界和反馈循环
- `planning/task-manifest.json` 是 `cc-do` 的真相源，要写清 `dependsOn`、`tddPhase`、`verticalSlice`、test seam、allowed mocks、feedback loop、并行资格、触点、验证命令，以及继承了哪版 roadmap / design / spec
- `change-meta.json` 是 capability 真相源，要写清这次 change 准备如何改变长期 spec
- 看完第一屏，执行者就知道这次属于 `tiny-design` 还是 `full-design`，以及为什么

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 模板：`assets/DESIGN_TEMPLATE.md`
- 模板：`assets/TINY_DESIGN_TEMPLATE.md`
- 模板：`assets/TASKS_TEMPLATE.md`
- 模板：`assets/TASK_MANIFEST_TEMPLATE.json`
- 任务解析：`scripts/parse-task-dependencies.js`
- 范围检查：`scripts/validate-scope.sh`
- 版本递增：`scripts/bump-skill-version.sh`
- 计划契约：`references/planning-contract.md`

## Working Rules

1. 没有证据时写 assumption，不准冒充事实。
2. 一次只推进一个关键未知点。
3. 旧文档里的有效信息要吸收，不要复制粘贴出新文件。
4. `planning/design.md` 和 `planning/tasks.md` 必须足够让 `cc-do` 在不继承当前会话的前提下继续工作。
5. 版本、来源、冻结决策必须可追踪。
6. 任务少而硬，胜过任务多而虚。
7. 具体计划默认测试先行；没有 Red/Green/Refactor 或 TDD exception，就不能进入 `cc-do`。
8. 任务必须是端到端可验证的垂直切片；除非是纯重构，否则不要按“先改模型、再改服务、最后改 UI”的水平层次拆。
9. 任务一旦超过 2-5 分钟粒度就继续拆，直到可以稳定交给执行者。
10. 三层以上判断说明设计还没压平，应回到 `planning/design.md` 继续简化。
11. `tiny-design` 不得被当成“免审批”；只要要写任务，就必须先有已批准的设计卡片。

## Exit Criteria

- 范围边界清楚
- 上游 roadmap handoff 已被显式装进 `planning/design.md`
- 成功标准可验证
- 推荐方案已被批准
- review gate 已在 `planning/design.md` 里闭合
- 任务顺序没有歧义
- 测试先行顺序没有歧义，TDD exception 已显式写清
- `cc-do` 不需要再靠会话记忆恢复背景

## Do Not

- 不在这里写生产代码
- 不把 clarification / brainstorm / review 各拆一份文档
- 不把“问了一堆问题”误当成“完成 discovery”
- 不拿“后面再想”伪装成计划
- 不把“先实现再补测试”伪装成可执行计划
- 不把项目路线图和 requirement 计划混成一锅
- 不在设计没批准前抢跑到实现任务

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 计划契约：`references/planning-contract.md`
