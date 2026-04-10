# Req-Plan Playbook

## Core Rules

1. 先读上游 handoff，再写 planning 结论。
2. 没有证据时写 assumption，不准冒充事实。
3. 一次只推进一个关键未知点。
4. `task-manifest.json` 和 `context-package.md` 必须能脱离当前会话独立恢复工作。
5. 版本、来源、冻结决策必须可追踪。

## Required Outputs

- `CLARIFICATION_REPORT.md`（需要时）
- `BRAINSTORM.md`
- `DESIGN.md`（`tiny-design` 或 `full-design`）
- `PLAN_REVIEW.md`
- `TASKS.md`
- `task-manifest.json`
- `context-package.md`
- `resume-index.md`

## Local Kit

- 模板全部在 `assets/`
- 任务结构解析在 `scripts/parse-task-dependencies.js`
- 澄清问题与澄清报告在 `scripts/generate-clarification-questions.sh`、`scripts/generate-clarification-report.sh`
- 计划边界和 placeholder 红线见 `references/planning-contract.md`
- 变更版本时同步 `CHANGELOG.md`，必要时用 `scripts/bump-skill-version.sh`

## Context Sweep

进入 req-plan 前，至少摸清：

1. 当前对象对应的 `RM-ID`、roadmap version、roadmap skill version
2. `ROADMAP.md` / `BACKLOG.md` 中该事项的 success signal、kill signal、constraints、dependencies、next decision
3. 现有 requirement 目录产物和最后一次冻结状态
4. 相关 docs / specs / ADR / 最近相关提交
5. 代码、测试、发布、迁移、依赖的现实边界

先压成 `Context Snapshot` 和 `Source Handoff`，再决定 discovery 还是 planning。

## Planning Standard

1. 先写问题、目标、约束、非目标。
2. 如果存在多个合理方向，必须列 2-3 个方案并明确推荐。
3. 推荐方案获批后，必须先判断这次 requirement 用 `tiny-design` 还是 `full-design`。
4. 没有用户对推荐方案的明确批准，不得生成 `TASKS.md`。
5. `TASKS.md` 之前，必须先完成 `PLAN_REVIEW.md` 的 robustness gate。
6. `TASKS.md` 中每个任务都要写清：
   - 目标
   - dependsOn / 是否允许并行
   - 涉及文件
   - 必读上下文
   - 验证方式
   - 完成证据
7. `task-manifest.json` 必须是 `req-do` 的真相源，而不是装饰文件。
8. `context-package.md` 必须足够让 subagent 在不继承当前会话的前提下开工。
9. `BRAINSTORM.md`、`DESIGN.md`、`PLAN_REVIEW.md`、`context-package.md`、`task-manifest.json` 都必须带上来源版本链。

## Interaction Contract

1. 一次只问一个澄清问题。
2. 先解决最影响方向判断的问题，再问边缘细节。
3. 如果问题本身已经足够清楚，就不要为了“显得认真”继续盘问。
4. 如果发现需求超出单次 requirement 可承载范围，先拆子需求，再只规划第一块。

## Discovery Heuristics

遇到方向不稳的需求，优先补齐这些事实：

1. 谁会被这次变更直接影响。
2. 现在的替代方案是什么。
3. 最强的需求证据是什么。
4. 为什么现在必须做。
5. 最小可行切口是什么。
6. 如何用上线后的可观察信号判断成功。

## Approval Flow

1. 先写 `Context Snapshot` 和 `Source Handoff`。
2. `BRAINSTORM.md` 再记录备选方案和推荐。
3. 用户批准推荐方案后，先确定设计模式，再写入正式 `DESIGN.md`。
4. `DESIGN.md` 必须显式标记 `tiny-design` 或 `full-design`，并记录 design version。
5. `DESIGN.md` 完成后，先跑 review loop，再进入 `PLAN_REVIEW.md`。
6. `PLAN_REVIEW.md` 通过 final gate 后，再把设计与 review 一起交给用户确认。
7. 用户确认设计与 review 后，再拆 `TASKS.md` 与 `task-manifest.json`。

## Design Mode Switch

满足以下条件时，优先用 `tiny-design`：

1. 单一功能点，小范围修改。
2. 通常只触达 1-3 个文件。
3. 不涉及 migration、复杂状态流、权限/安全、高代价回滚。
4. 执行者看完一张冻结卡片就能准确落地。

否则用 `full-design`。

如果你发现自己在 `tiny-design` 里已经开始解释：

- 多模块数据流
- 多阶段 rollout
- 兼容性策略
- 复杂风险矩阵

说明该升级回 `full-design` 了。

## Spec Review Loop

`DESIGN.md` 必须按模式做 review。

`tiny-design` 检查：

1. 目标与非目标是否一句话就能分清。
2. 触达文件和冻结决策是否完整。
3. 验证方式是否够具体。
4. 风险是否真实，而不是写“低风险”敷衍。
5. `req-do` 是否还会被迫重新设计。

`full-design` 至少自检以下 5 项：

1. Placeholder：是否还有 TBD、TODO、空表格、空字段。
2. Consistency：目标、方案、文件计划、验证策略是否互相一致。
3. Scope：是否塞进了与 requirement 无关的重构或未来愿景。
4. Ambiguity：有没有实现者会理解成两种意思的句子。
5. Feasibility：依赖、约束、文件边界、验证方式是否真的落地。

`full-design` 或边界仍不稳的 `tiny-design` 应再做一次独立 reviewer 复审；如果 reviewer 提出问题，先修 `DESIGN.md`，再进入任务拆解。

## Handoff Contract

从 `roadmap` 进入 `req-plan` 时，至少继承并显式记录：

1. `RM-ID`
2. roadmap version / roadmap skill version
3. source stage / why now
4. success signal / kill signal
5. dependencies / non-goals
6. 当前最强证据与仍待验证的 assumption

如果 planning 推翻了其中任一项，必须在文档里写明“为什么推翻”。

## Robustness Review Flow

学习 `gstack /autoplan` 的做法，`req-plan` 必须在任务拆解前跑一遍顺序化 robustness review。

### Sequential Phases

1. `Scope Review`
2. `Design Review`：仅在 UI / interaction 明显时启用
3. `Engineering Review`
4. `DX Review`：仅在 API / CLI / developer-facing surface 明显时启用
5. `Cross-Phase Summary`

### Auto-Decision Principles

review 中的中间选择默认按这 6 条原则决策：

1. Completeness
2. Boil lakes
3. Pragmatic
4. DRY
5. Explicit over clever
6. Bias toward action

### Decision Classification

每个重要决策都标记为：

- `Mechanical`
- `Taste`
- `User Challenge`

其中 `User Challenge` 永远不能被静默自动决定，必须在 final gate 摊给用户。

### Required Artifact

`PLAN_REVIEW.md` 至少要有：

1. Phase summaries
2. Decision Audit Trail
3. Pre-gate verification checklist
4. Final approval gate summary

## Placeholder Ban

这些词一出现，说明计划失败：

- TODO later
- implement later
- add validation
- handle edge cases
- write tests for the above
- similar to task N

## Exit Rule

只有当 `req-do` 不需要临场补脑也能直接执行时，计划才算合格。
如果执行者看完计划还需要猜用户真正批准了哪套方案，说明计划仍未完成。
如果执行者还得自己决定“这次到底碰哪些文件、为什么这么改”，说明 `DESIGN.md` 仍然不够。
如果执行者看不到这份计划经过了哪些 review phase 拷打，说明健壮性证据还不够。
如果执行者看不出这份计划继承自哪版 roadmap、哪次批准，说明 handoff 仍未完成。
