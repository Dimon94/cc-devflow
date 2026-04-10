---
name: roadmap
description: Roadmap skill for CC-DevFlow. Use when a project needs a long-range roadmap before the PDCA requirement loop starts.
---

# Roadmap

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Role

`roadmap` 只负责一件事：决定项目接下来 1-3 个阶段该打哪几仗。

它先逼出真实用户、真实痛点、真实紧迫性，再把这些现实压成一条清晰主线。

## Use This Skill When

- 新项目刚开始
- 项目做到一半，方向开始发散
- backlog 很多，但主线不清楚
- 你需要决定接下来 1-3 个阶段先做什么

## Loop

1. 先问现实，不先写愿景。
2. 一次只推进一个关键未知点。
3. 给出 2-3 种路线图形状，再明确推荐一种。
4. 用户没批准，不进入 `req-plan`。

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

## Good Output

- `ROADMAP.md` 只写阶段目标、阶段顺序、每阶段为什么存在
- `BACKLOG.md` 只保留会进入下一轮 `req-plan` 的主线事项

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
