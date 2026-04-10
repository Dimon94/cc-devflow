---
name: req-plan
description: Use when a requirement, roadmap item, or bug needs scope clarification, design decisions, and executable task breakdown before coding starts.
---

# Req-Plan

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Role

`req-plan` 是 PDCA 里的 `Plan`。

它只负责把一个 roadmap item、一个 requirement，或一个 bug 机会，压成可执行的单次作战方案。

## Read First

1. `PLAYBOOK.md`
2. `assets/BRAINSTORM_TEMPLATE.md`
3. `assets/DESIGN_TEMPLATE.md`

## Use This Skill When

- 新 requirement 还模糊
- bug 现象很多，但修复边界还没定
- 需求变更后需要重做设计与任务拆解
- 你不确定下一步要做什么

如果用户已经给了明确的任务清单和冻结方案，不要重开计划，去 `req-do`。

## Entry Gate

1. 先确认当前对象是一个 requirement，而不是整个项目路线图。
2. 先读已有的上游方向输入与当前 requirement 目录现状。
3. 先写不做什么，再开始写做什么。

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

## Bundled Resources

- 模板：`assets/BRAINSTORM_TEMPLATE.md`
- 模板：`assets/DESIGN_TEMPLATE.md`
- 模板：`assets/TASKS_TEMPLATE.md`
- 模板：`assets/TASK_MANIFEST_TEMPLATE.json`
- 模板：`assets/CONTEXT_PACKAGE_TEMPLATE.md`
- 模板：`assets/RESUME_INDEX_TEMPLATE.md`
- 模板：`assets/CLARIFICATION_REPORT_TEMPLATE.md`
- 任务解析：`scripts/parse-task-dependencies.js`
- 澄清问题：`scripts/generate-clarification-questions.sh`
- 澄清报告：`scripts/generate-clarification-report.sh`
- 范围检查：`scripts/validate-scope.sh`
- 范围规则：`references/planning-contract.md`

## Working Rules

1. 先定义结果，再定义任务。
2. 任务必须可执行，不能靠临场灵感补完。
3. 默认显式读文件，不靠自动上下文注入。
4. 项目中长期方向属于 `roadmap`，不在这里重开。
5. 不允许 placeholder 计划。

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

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 计划契约：`references/planning-contract.md`
