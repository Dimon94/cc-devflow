# Req-Plan Skill Changelog

## v2.0.0 - 2026-04-10

- 增加 `version` frontmatter，并定义 req-plan skill 的 semver 规则。
- 强化 `Context Sweep`，要求在 planning 前显式读取上游 roadmap handoff、requirement 目录现状、代码与文档上下文。
- 增加 `Source Handoff` / `Source Alignment` 约定，保证 `roadmap -> req-plan` 的 success signal、constraints、dependencies、non-goals 不在 handoff 时丢失。
- 升级 `BRAINSTORM.md`、`DESIGN.md`、`PLAN_REVIEW.md`、`context-package.md`、`TASKS.md`、`task-manifest.json` 模板，加入版本链和来源元数据。
- 新增 `scripts/bump-skill-version.sh`，用于递增 skill 版本并同步 changelog。

Migration note:

- 旧 requirement 目录仍可继续使用，但建议补齐 requirement version、design version、source roadmap item / version 等元数据。
- `task-manifest.json` 新增 `sourceRoadmap` 和 `planningMeta` 字段；旧消费方若只读取原有字段不会受影响。

## v1.0.0 - 2026-04-10

- 初始版 req-plan skill，提供 requirement planning 基础工作流。
