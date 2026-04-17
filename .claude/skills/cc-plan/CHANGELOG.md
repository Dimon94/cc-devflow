# CC-Plan Skill Changelog

## v3.3.0 - 2026-04-17

- add structured frontmatter contract fields so cc-plan is machine-readable as a skill-first harness stage
- add explicit `Harness Contract` and `Visible State Machine` sections to move stage orchestration into `SKILL.md` and `PLAYBOOK.md`
- clarify reroute and recovery behavior so design reopening happens in the skill contract instead of hidden runtime assumptions

Migration note:

- existing requirement artifacts stay valid
- registry and publish tooling now expect the structured frontmatter keys on the public skill

## v3.2.0 - 2026-04-15

- upgrade bundled templates so `DESIGN.md`, `TASKS.md`, and `task-manifest.json` teach quality by example instead of empty placeholders
- add first-read checks that make planning density and task quality obvious to the next executor

## v3.1.0 - 2026-04-15

- add stronger trigger phrases in frontmatter
- add `Quick Start` to classify planning into `clarify-first` / `tiny-design` / `full-design`
- tighten `Good Output` so the chosen planning density is explicit on first read

## v3.0.0 - 2026-04-15

- 收敛 `cc-plan` 输出模型，默认交付物只保留 `DESIGN.md`、`TASKS.md`、`task-manifest.json`。
- 把 clarification / brainstorm / review 结论并入 `DESIGN.md`，不再默认拆出独立文档。
- 把执行 handoff 并入 `TASKS.md`，不再要求 `context-package.md` 作为 planning 产物。
- 删除 `BRAINSTORM_TEMPLATE.md`、`CLARIFICATION_REPORT_TEMPLATE.md`、`PLAN_REVIEW_TEMPLATE.md`、`CONTEXT_PACKAGE_TEMPLATE.md`、`RESUME_INDEX_TEMPLATE.md`。
- 删除面向旧输出模型的 clarification 脚本引用。

Migration note:

- 旧 requirement 目录如果已有 `BRAINSTORM.md`、`PLAN_REVIEW.md`、`context-package.md`，不要继续维护同类新文件；把仍然有效的信息吸收进 `DESIGN.md` 或 `TASKS.md`。
- `resume-index.md` 不再属于 `cc-plan` 阶段产物，它属于 `cc-act` 的 handoff / closeout 工件。
- `cc-do` 的默认任务上下文现在以 `DESIGN.md` + `TASKS.md` 为主，不再默认读取 `context-package.md`。

## v2.0.0 - 2026-04-10

- 增加 `version` frontmatter，并定义 cc-plan skill 的 semver 规则。
- 强化 `Context Sweep`，要求在 planning 前显式读取上游 roadmap handoff、requirement 目录现状、代码与文档上下文。
- 增加 `Source Handoff` / `Source Alignment` 约定，保证 `roadmap -> cc-plan` 的 success signal、constraints、dependencies、non-goals 不在 handoff 时丢失。
- 升级 `BRAINSTORM.md`、`DESIGN.md`、`PLAN_REVIEW.md`、`context-package.md`、`TASKS.md`、`task-manifest.json` 模板，加入版本链和来源元数据。
- 新增 `scripts/bump-skill-version.sh`，用于递增 skill 版本并同步 changelog。

Migration note:

- 旧 requirement 目录仍可继续使用，但建议补齐 requirement version、design version、source roadmap item / version 等元数据。
- `task-manifest.json` 新增 `sourceRoadmap` 和 `planningMeta` 字段；旧消费方若只读取原有字段不会受影响。

## v1.0.0 - 2026-04-10

- 初始版 cc-plan skill，提供 requirement planning 基础工作流。
