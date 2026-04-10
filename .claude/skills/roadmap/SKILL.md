---
name: roadmap
version: 2.0.0
description: Use when defining, resetting, or narrowing project direction, stage order, or backlog priority before a concrete requirement enters the PDCA loop.
---

# Roadmap

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，必要时写 migration note，然后检查 `CLAUDE.md`

## Role

`roadmap` 只负责一件事：决定项目接下来 1-3 个阶段该打哪几仗。

它先尽可能收集真实上下文，再逼出真实用户、真实痛点、真实紧迫性，最后把这些现实压成一条能落地、能进入 `req-plan` 的主线。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `assets/ROADMAP_TEMPLATE.md`
4. `assets/BACKLOG_TEMPLATE.md`
5. `references/roadmap-dialogue.md`

## Use This Skill When

- 新项目刚开始
- 项目做到一半，方向开始发散
- backlog 很多，但主线不清楚
- 你需要决定接下来 1-3 个阶段先做什么

如果用户已经在讨论一个明确 requirement、一个 bug 或一组实现任务，停止留在这里，转去 `req-plan`。

## Entry Gate

1. 如果 `ROADMAP.md` / `BACKLOG.md` 已存在，先读现状再重写。
2. 先判断这是“项目方向问题”还是“单 requirement 执行问题”。
3. 先做一次上下文扫描，不能跳过现有事实直接写愿景。
4. 方向没被批准前，不准把 roadmap 偷偷下放成实现任务。

## Context Sweep

进入对话前，至少主动收这些上下文：

1. 当前 `ROADMAP.md` / `BACKLOG.md` 的主线、版本、已停放事项。
2. `CLAUDE.md`、`README*`、`TODOS.md`、最近相关 docs / specs / plans。
3. 最近相关提交、当前分支脏状态、正在进行中的 requirement。
4. 真实 forcing functions：deadline、发布窗口、资源上限、依赖、distribution、adoption / trust / delivery 卡点。
5. 当前项目最强的现实证据，以及仍然只能靠假设的空白。

先把这些材料压成一个 `Context Snapshot`，再开始追问用户。

## Session Protocol

1. 先探索上下文，不靠默认上下文注入替代阅读。
2. 先问现实，不先写愿景。
3. 一次只推进一个关键未知点，不要一口气抛一串问题。
4. 先写 `Context Snapshot`、证据、约束、非目标，再讨论阶段。
5. 给出 2-3 种路线图形状，再明确推荐一种，并说明为什么其他路线现在不值得打。
6. 只冻结 1-3 个阶段。每个阶段都必须有 goal、why now、dependencies、exit signal、kill signal、non-goals。
7. backlog 只保留会真的进入下一轮 `req-plan` 的事项，每项都要带成功信号和下一决策。
8. 用户没批准，不进入 `req-plan`。

## Ask

至少要逼清这 5 件事：

1. 这个项目真正服务谁
2. 用户今天用什么笨办法解决
3. 为什么他们会立刻想要这个东西
4. 最窄但最有穿透力的第一阶段是什么
5. 未来 6-12 个月，产品会长成什么样

同时尽量补齐这些落地上下文：

6. 当前最强证据是什么，哪些只是想象
7. deadline / team / budget / dependency / distribution 的硬约束是什么
8. 当前最大的 adoption、trust、delivery 卡点是什么
9. 这个 roadmap 成功与失败各自用什么信号判断

## Approval Gates

1. 没有 `Context Snapshot`，不准给路线推荐。
2. 没有 2-3 条路线对比，不准直接拍脑袋定主线。
3. 没有 exit signal / kill signal / non-goals，不算阶段冻结。
4. 没有明确成功信号和下一决策，不准把事项放进 `Ready For Req-Plan`。
5. 没有用户批准，不准把 roadmap item 下放到 `req-plan`。

## Review Loop

写完 `ROADMAP.md` / `BACKLOG.md` 后，至少完成这 5 个检查：

1. Placeholder scan：不能有 TBD、TODO、`[NEEDS CONTEXT]` 之类的逃避词。
2. Evidence scan：每个阶段是否都能指回某个现实证据，而不是空洞愿景。
3. Causality scan：Stage 2 是否真的建立在 Stage 1 的胜利条件之上。
4. Feasibility scan：阶段目标与团队容量、依赖、distribution 约束是否接得上。
5. Handoff scan：第一批 roadmap item 是否已经自然长成可进入 `req-plan` 的对象。

## Output

- `ROADMAP.md`
- `BACKLOG.md`

## Versioning

`roadmap` 自身使用 semver：

- `patch`：措辞、模板字段说明、非契约性澄清
- `minor`：新增兼容字段、上下文收集规则、评审规则、输出结构增强
- `major`：改变 `ROADMAP.md` / `BACKLOG.md` 的核心契约、阶段模型或 handoff 预期

每次修改都必须：

1. 更新本文件 frontmatter 的 `version`
2. 更新 `CHANGELOG.md`
3. 如果会影响已有 `ROADMAP.md` / `BACKLOG.md` 使用方式，在 `CHANGELOG.md` 写清 migration note

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 模板：`assets/ROADMAP_TEMPLATE.md`
- 模板：`assets/BACKLOG_TEMPLATE.md`
- 对话骨架：`references/roadmap-dialogue.md`
- 条目定位：`scripts/locate-roadmap-item.sh`
- 进度回写：`scripts/sync-roadmap-progress.sh`
- 版本递增：`scripts/bump-skill-version.sh`

## Exit Criteria

- 中长期方向清楚
- 核心上下文、证据和硬约束已经显式记录
- 阶段目标与优先级清楚
- 第一批 requirement 从 roadmap 里自然长出来
- 下一步唯一答案是把某个 roadmap item 放进 `req-plan`

## Working Rules

1. 先收上下文，再收意见。
2. 没有现实证据时必须明确写成 assumption，而不是偷偷当事实。
3. `ROADMAP.md` 是方向真相源，`BACKLOG.md` 是进入下一轮规划的缓冲区。
4. 决策理由必须保留下来，方便以后重跑时比较版本差异。
5. 不要为了显得完整而写 6 个阶段，能打赢下一仗比画完整战争图更重要。

## Do Not

- 不在这里拆实现任务
- 不把 roadmap 写成愿望清单
- 不讨论 20 个阶段，只定最重要的 1-3 步
- 不靠默认上下文注入替代思考
- 不把没有证据支撑的猜测包装成战略
- 不让 backlog 变成“以后再说”的垃圾堆

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 路线图对话：`references/roadmap-dialogue.md`
