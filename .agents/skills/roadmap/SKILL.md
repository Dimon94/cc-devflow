---
name: roadmap
description: Use when defining, resetting, or narrowing project direction, stage order, or backlog priority before a concrete requirement enters the PDCA loop.
---

# Roadmap

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Role

`roadmap` 只负责一件事：决定项目接下来 1-3 个阶段该打哪几仗。

它先逼出真实用户、真实痛点、真实紧迫性，再把这些现实压成一条清晰主线。

## Read First

1. `PLAYBOOK.md`
2. `assets/ROADMAP_TEMPLATE.md`
3. `assets/BACKLOG_TEMPLATE.md`

## Use This Skill When

- 新项目刚开始
- 项目做到一半，方向开始发散
- backlog 很多，但主线不清楚
- 你需要决定接下来 1-3 个阶段先做什么

如果用户已经在讨论一个明确 requirement、一个 bug 或一组实现任务，停止留在这里，转去 `req-plan`。

## Entry Gate

1. 如果 `ROADMAP.md` / `BACKLOG.md` 已存在，先读现状再重写。
2. 先判断这是“项目方向问题”还是“单 requirement 执行问题”。
3. 方向没被批准前，不准把 roadmap 偷偷下放成实现任务。

## Loop

1. 先问现实，不先写愿景。
2. 一次只推进一个关键未知点。
3. 给出 2-3 种路线图形状，再明确推荐一种。
4. 冻结 1-3 个阶段、阶段 exit signal 和非目标。
5. 用户没批准，不进入 `req-plan`。

## Ask

至少要逼清这 5 件事：

1. 这个项目真正服务谁
2. 用户今天用什么笨办法解决
3. 为什么他们会立刻想要这个东西
4. 最窄但最有穿透力的第一阶段是什么
5. 未来 6-12 个月，产品会长成什么样

## Output

- `ROADMAP.md`
- `BACKLOG.md`

## Bundled Resources

- 模板：`assets/ROADMAP_TEMPLATE.md`
- 模板：`assets/BACKLOG_TEMPLATE.md`
- 对话骨架：`references/roadmap-dialogue.md`
- 条目定位：`scripts/locate-roadmap-item.sh`
- 进度回写：`scripts/sync-roadmap-progress.sh`

## Exit Criteria

- 中长期方向清楚
- 阶段目标与优先级清楚
- 第一批 requirement 从 roadmap 里自然长出来
- 下一步唯一答案是把某个 roadmap item 放进 `req-plan`

## Do Not

- 不在这里拆实现任务
- 不把 roadmap 写成愿望清单
- 不讨论 20 个阶段，只定最重要的 1-3 步
- 不靠默认上下文注入替代思考

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 路线图对话：`references/roadmap-dialogue.md`
