---
name: req-plan
version: 2.0.0
description: Use when a requirement, roadmap item, or bug needs scope clarification, design decisions, and executable task breakdown before coding starts.
---

# Req-Plan

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，必要时写 migration note，然后检查 `CLAUDE.md`

## Role

`req-plan` 是 PDCA 里的 `Plan`。

它只负责把一个 roadmap item、一个 requirement，或一个 bug 机会，压成可执行的单次作战方案。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `assets/BRAINSTORM_TEMPLATE.md`
4. `assets/DESIGN_TEMPLATE.md`
5. `assets/TINY_DESIGN_TEMPLATE.md`
6. `assets/PLAN_REVIEW_TEMPLATE.md`
7. `references/planning-contract.md`

## Use This Skill When

- 新 requirement 还模糊
- bug 现象很多，但修复边界还没定
- 需求变更后需要重做设计与任务拆解
- 你不确定下一步要做什么

如果用户已经给了明确的任务清单和冻结方案，不要重开计划，去 `req-do`。

## Entry Gate

1. 先确认当前对象是一个 requirement，而不是整个项目路线图。
2. 如果来源于 `roadmap`，必须先定位对应的 `RM-ID`，读清 `ROADMAP.md` / `BACKLOG.md` 的版本、证据、约束、success signal、next decision。
3. 先读已有的上游方向输入与当前 requirement 目录现状。
4. 先做一次上下文扫描，不能跳过现有事实直接拆任务。
5. 先写不做什么，再开始写做什么。
6. 如果这是一个产品方向仍不稳的需求，先走 discovery，再谈实现。

## Context Sweep

进入 planning 之前，至少主动收这些上下文：

1. 当前对象对应的 `RM-ID`、roadmap version、roadmap skill version。
2. `ROADMAP.md` / `BACKLOG.md` 中该事项的阶段来源、证据、dependencies、success signal、kill signal、next decision。
3. 现有 requirement 目录：`BRAINSTORM.md`、`DESIGN.md`、`PLAN_REVIEW.md`、`TASKS.md`、`task-manifest.json`、`context-package.md`、`resume-index.md`。
4. `CLAUDE.md`、README、相关 docs / specs / ADR / 最近提交。
5. 当前代码、测试、发布、迁移、依赖的现实边界。

先把这些材料压成 `Context Snapshot` 和 `Source Handoff`，再决定走哪条轨道。

## Session Protocol

1. 先探索上下文：上游 roadmap、代码、文档、已有 requirement 目录、最近相关提交。
2. 先把上游输入压成 `Source Handoff`：
   - 来自哪个 `RM-ID`
   - 上游 roadmap version / skill version
   - 继承的 success signal、kill signal、constraints、non-goals、dependencies
   - 本轮 planning 是否推翻了上游假设
3. 先判断当前走哪条轨道：
   - `Discovery Track`：需求本身还不清楚，先问清用户、痛点、现状、证据、最小可行切口。
   - `Planning Track`：边界已清楚，直接沉淀目标、约束、非目标、方案。
4. 澄清时一次只问一个问题。不要把 4 个问题塞进一条消息里。
5. 先写问题、目标、约束、非目标、成功标准，再写方案。
6. 如果方向还不稳，必须给 2-3 个方案，带 trade-off 和推荐。
7. 在用户明确批准推荐方案前，不允许写 `TASKS.md`。
8. 批准方案后，先判断这次用 `full-design` 还是 `tiny-design`。
9. 先把批准后的唯一方案冻结进 `DESIGN.md`，并写清 requirement version / design version / source roadmap version。
10. `DESIGN.md` 写完必须先做与模式匹配的 review loop。
11. review loop 之后，必须再跑一遍 `Plan Robustness Review`，把结果写进 `PLAN_REVIEW.md`。
12. `context-package.md` 与 `task-manifest.json` 必须显式带上 source roadmap / design version，不能靠会话记忆恢复。
13. 只有 design + review 都通过 gate，才能拆任务顺序。
14. 计划完成后，下一步只能是 `req-do`。

## Discovery Track

当 requirement 仍像“想法”而不是“作战指令”时，先做 discovery。

优先围绕这些问题，一次只推进一个：

1. 这个变化到底服务谁？
2. 他们现在怎么解决这个问题，代价是什么？
3. 最强的需求证据是什么？是实际行为，不是想象中的兴趣。
4. 为什么现在要做？不做会损失什么？
5. 最小可行切口是什么？哪一小块先做就能验证方向？
6. 成功标准是什么？上线后怎么知道这次变更真的有效？

如果发现需求其实包含多个独立子系统，先拆 requirement，再只规划第一个子块。

## Design Modes

`req-plan` 永远保留 `DESIGN.md`，但允许两种密度：

- `tiny-design`：超小需求的冻结设计卡片
- `full-design`：需要完整架构说明的正式设计

优先使用 `tiny-design`，但只有同时满足这些条件才成立：

1. 变更集中在单一功能点，而不是多子系统协同。
2. 触达文件很少，通常 1-3 个，且边界直观。
3. 不涉及 schema、migration、异步流程、权限、安全、发布编排。
4. 不引入新的公共 contract，或 contract 变化非常局部。
5. 风险低，失败面小，执行者不需要读长篇设计也能准确落地。

出现以下任一情况，直接升级到 `full-design`：

1. 需要跨模块协调或多阶段落地。
2. 有数据模型、接口契约、状态机、迁移、兼容性风险。
3. 有安全、权限、计费、同步一致性、回滚策略等高代价约束。
4. 任务拆解前如果不先讲清数据流和边界，执行者大概率会二次设计。

`tiny-design` 的目标不是跳过设计，而是把设计压缩成一张冻结卡片。

## Approval Gates

1. `BRAINSTORM.md` 必须记录开放问题、备选方案、推荐方案。
2. 没有 `Context Snapshot` 与 `Source Handoff`，不准推荐方案。
3. 推荐方案没有得到用户明确批准前，`DESIGN.md` 只能是草案，不能继续拆 `TASKS.md`。
4. `DESIGN.md` 必须写明当前是 `tiny-design` 还是 `full-design`，并带版本链。
5. `DESIGN.md` 必须先过 review loop，再进入 `PLAN_REVIEW.md`。
6. `PLAN_REVIEW.md` 必须显式写出 taste decisions 和 user challenges。
7. 只有设计与 review 一起被批准后，才能生成 `TASKS.md` 和 `task-manifest.json`。
8. 没有版本与来源元数据，不准宣称可以 handoff 给 `req-do`。

## Plan Robustness Review

`req-plan` 学习 `gstack /autoplan` 的方法，不把 review 当成一句“看起来没问题”，而是当成顺序化的拷打流程。

### Sequential Phases

这些 review phase 必须严格串行执行：

1. `Scope Review`
   - 问题定义、范围边界、blast radius、非目标是否自洽。
2. `Design Review`（仅 UI / interaction / user-facing flow 明显时）
   - 用户看到的行为、交互决策、设计模糊点是否清楚。
3. `Engineering Review`
   - 数据流、模块边界、失败路径、验证方案是否站得住。
4. `DX Review`（仅 API / CLI / internal tooling / developer-facing surface 明显时）
   - 命名、默认值、接入路径、错误信息、time-to-hello-world 是否合理。
5. `Cross-Phase Summary`
   - 跨 phase 重复出现的问题，视为高置信风险，不是偶然意见。

### 6 Decision Principles

review 中的中间决策默认按这 6 条原则处理：

1. `Choose completeness`
2. `Boil lakes`
3. `Pragmatic`
4. `DRY`
5. `Explicit over clever`
6. `Bias toward action`

### Decision Classification

每个非平凡决策都要分类：

- `Mechanical`
- `Taste`
- `User Challenge`

`User Challenge` 不能被静默自动决定，必须在 final gate 里显式交给用户。

### Decision Audit Trail

每个重要决策都要写入 `PLAN_REVIEW.md`，至少记录：

- Phase
- Decision
- Classification
- Principle
- Rationale
- Rejected alternatives

### Final Gate

`PLAN_REVIEW.md` 在进入 `TASKS.md` 前，必须把下面三类东西讲清楚：

1. Auto-decided items
2. Taste decisions
3. User challenges

## Spec Review Loop

写完 `DESIGN.md` 后，至少完成与模式匹配的 review loop。

`full-design` 至少完成这 5 个检查：

1. Placeholder scan：不能有 TBD、TODO、`[NEEDS CLARIFICATION]` 之类的逃避词。
2. Consistency scan：目标、方案、任务、验证口径不能互相打架。
3. Scope scan：有没有偷偷长成另一个 requirement。
4. Ambiguity scan：实现者会不会看完还得靠猜。
5. Feasibility scan：方案和现有代码/依赖/时间约束是否真的接得上。

`tiny-design` 也必须完成这 5 项，但允许用更短的文字回答：

1. 这次到底改什么，不改什么。
2. 会碰哪些文件或 contract。
3. 怎么验证。
4. 最大风险是什么。
5. 哪些决策在 `req-do` 不准重想。

对于 `full-design` 或任何边界不稳的 requirement，优先再做一次独立 reviewer 复审，确认没有遗漏的风险和歧义。
`PLAN_REVIEW.md` 负责把这些 reviewer 结论按 phase 收敛成最终 gate。

另外加做这 3 个 handoff 检查：

1. Source alignment：设计是否仍然对齐上游 roadmap 的用户、约束、success signal、non-goals。
2. Version trace：`BRAINSTORM.md`、`DESIGN.md`、`PLAN_REVIEW.md`、`context-package.md`、`task-manifest.json` 是否写清当前版本和来源版本。
3. Recovery check：`req-do` 在不继承当前会话的情况下，是否能仅靠文档恢复工作。

## Output

- `CLARIFICATION_REPORT.md`（需要时）
- `BRAINSTORM.md`
- `DESIGN.md`
- `PLAN_REVIEW.md`
- `TASKS.md`
- `task-manifest.json`
- `context-package.md`
- `resume-index.md`

## Versioning

`req-plan` 自身使用 semver：

- `patch`：措辞、模板字段说明、非契约性澄清
- `minor`：新增兼容字段、handoff 约定、review / context 规则增强
- `major`：改变 planning 产物契约、设计模式、handoff 预期

每次修改都必须：

1. 更新本文件 frontmatter 的 `version`
2. 更新 `CHANGELOG.md`
3. 如果会影响已有 requirement 目录使用方式，在 `CHANGELOG.md` 写清 migration note

## Good Output

- `CLARIFICATION_REPORT.md` 记录当前只剩哪些问题还没被回答，下一问是什么
- `BRAINSTORM.md` 讲清问题、边界、成功标准、不做项、候选方案与推荐，并保留 source handoff
- `DESIGN.md` 讲清设计模式、决定后的唯一方案、冻结决策、风险与 review 结果，并保留版本链
- `PLAN_REVIEW.md` 讲清 sequential review、decision audit、taste decisions、user challenges、final gate，并记录 source alignment
- `TASKS.md` 只保留可以直接执行的任务
- `task-manifest.json` 是 Do 阶段的真相源，要写清 `dependsOn`、并行资格、触点、验证命令，以及继承了哪版 roadmap / design
- `context-package.md` 要让 subagent 在不继承主会话上下文的前提下也能直接开工

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 模板：`assets/BRAINSTORM_TEMPLATE.md`
- 模板：`assets/DESIGN_TEMPLATE.md`
- 模板：`assets/TINY_DESIGN_TEMPLATE.md`
- 模板：`assets/PLAN_REVIEW_TEMPLATE.md`
- 模板：`assets/TASKS_TEMPLATE.md`
- 模板：`assets/TASK_MANIFEST_TEMPLATE.json`
- 模板：`assets/CONTEXT_PACKAGE_TEMPLATE.md`
- 模板：`assets/RESUME_INDEX_TEMPLATE.md`
- 模板：`assets/CLARIFICATION_REPORT_TEMPLATE.md`
- 任务解析：`scripts/parse-task-dependencies.js`
- 澄清问题：`scripts/generate-clarification-questions.sh`
- 澄清报告：`scripts/generate-clarification-report.sh`
- 范围检查：`scripts/validate-scope.sh`
- 版本递增：`scripts/bump-skill-version.sh`
- 范围规则：`references/planning-contract.md`

## Working Rules

1. 先定义结果，再定义任务。
2. 任务必须可执行，不能靠临场灵感补完。
3. 默认显式读文件，不靠自动上下文注入。
4. `TASKS.md` 与 `task-manifest.json` 必须能表达依赖和并行边界。
5. roadmap 传下来的约束、证据、非目标，不准在这里悄悄蒸发。
6. 项目中长期方向属于 `roadmap`，不在这里重开。
7. 不允许 placeholder 计划。
8. 不要把 discovery 问题批量抛给用户，一次推进一个最关键的问题。
9. 不要让 `TASKS.md` 先于设计批准出现。
10. `tiny-design` 只能压缩表达，不能压缩思考。
11. `PLAN_REVIEW.md` 不允许写成“reviewed, looks good”这种空话。
12. 版本、来源、冻结决策必须可追溯，不能靠人脑记忆。

## Exit Criteria

- 范围边界清楚
- 上游 roadmap handoff 已被显式装箱
- 成功标准可验证
- 推荐方案已被批准
- 设计模式已选定且合理
- 与设计模式匹配的 review loop 已完成
- `PLAN_REVIEW.md` 的 final gate 已完成
- 任务顺序没有歧义
- 下一步唯一答案是 `req-do`

## Do Not

- 不在这里写生产代码
- 任务少而硬，胜过任务多而虚
- 不把项目规划和 requirement 规划混成一锅
- 不拿“后面再想”伪装成计划
- 不要在设计没批准时抢跑到实现任务
- 不要把“问了一堆问题”误当成“做完了 discovery”
- 不要把 `tiny-design` 当成“不写设计”的借口
- 不要把 robustness review 压缩成一句结论
- 不要把上游 roadmap 的证据和约束在 handoff 时丢掉

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 计划契约：`references/planning-contract.md`
