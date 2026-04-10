---
name: req-plan
description: Plan-stage skill for CC-DevFlow. Use when a project, requirement, or bug must be clarified, designed, and broken into executable tasks before coding starts.
---

# Req-Plan

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Role

`req-plan` 是 PDCA 里的 `Plan`。

它只负责把一个 roadmap item、一个 requirement，或一个 bug 机会，压成可执行的单次作战方案。

## Use This Skill When

- 新 requirement 还模糊
- bug 现象很多，但修复边界还没定
- 需求变更后需要重做设计与任务拆解
- 你不确定下一步要做什么

## Loop

1. 先澄清目标、约束、成功标准。
2. 先写不做什么，再写要做什么。
3. 如果方向还不稳，先给 2-3 个方案，再定一个。
4. 先冻结方案，再拆任务顺序。
5. 计划完成后，下一步只能是 `req-do`。

## Output

- `BRAINSTORM.md`
- `DESIGN.md`
- `TASKS.md`
- `task-manifest.json`
- `context-package.md`
- `resume-index.md`

## Good Output

- `BRAINSTORM.md` 讲清问题、边界、成功标准、不做项
- `DESIGN.md` 讲清决定后的唯一方案
- `TASKS.md` 只保留可以直接执行的任务
- `task-manifest.json` 是 Do 阶段的真相源

## Working Rules

1. 先定义结果，再定义任务。
2. 任务必须可执行，不能靠临场灵感补完。
3. 默认显式读文件，不靠自动上下文注入。
4. 项目中长期方向属于 `roadmap`，不在这里重开。

## Exit Criteria

- 范围边界清楚
- 成功标准可验证
- 任务顺序没有歧义
- 下一步唯一答案是 `req-do`

## Do Not

- 不在这里写生产代码
- 任务少而硬，胜过任务多而虚
- 不把项目规划和 requirement 规划混成一锅
- 不拿“后面再想”伪装成计划
