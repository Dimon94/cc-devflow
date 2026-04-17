# Roadmap Skill Changelog

## v2.2.0 - 2026-04-17

- convert public frontmatter from loose prose into structured harness contract fields: `triggers`, `reads`, `writes`, `entry_gate`, `exit_criteria`, `reroutes`, `recovery_modes`, `tool_budget`
- add `Harness Contract` to `SKILL.md` and `Visible State Machine` to `PLAYBOOK.md`
- make roadmap explicitly skill-first: strategy stays in skill text and artifacts instead of hidden harness behavior

Migration note:

- any downstream tooling that only read `name` and `description` can keep working, but new registry consumers should prefer the structured contract fields
- roadmap users do not need to change existing `ROADMAP.md` / `BACKLOG.md` files; the new contract only makes the operating rules explicit

## v2.1.0 - 2026-04-15

- 增强 frontmatter `description`，补充中英文触发词，提升命中率。
- 新增 `Quick Start` 和 `Route Selection Rule`，把首次路线判断前置成更易执行的入口。
- 新增 `Recommendation Test`，要求推荐必须同时说明“为什么选它”和“为什么不先做另外两条”。
- 升级 `ROADMAP_TEMPLATE.md`，增加 `Recommended Route` 区块。
- 升级 `BACKLOG_TEMPLATE.md`，让 ready 项显式写清“为什么现在 ready”。

Migration note:

- 旧版 `ROADMAP.md` / `BACKLOG.md` 可以继续使用；建议在下次重跑 roadmap 时补齐 `Recommended Route` 和 ready rationale，以减少后续 `cc-plan` 阶段的解释成本。

## v2.0.0 - 2026-04-10

- 增加 `version` frontmatter，并定义 roadmap skill 的 semver 规则。
- 强化 `Context Sweep`，要求先读取现有 roadmap、文档、最近提交、forcing functions，再开始追问。
- 增加 `Approval Gates` 与 `Review Loop`，避免没有证据、没有退出信号的伪路线图。
- 升级 `ROADMAP_TEMPLATE.md`，加入 metadata、context snapshot、evidence ledger、route options、dependencies、kill signal、版本差异记录。
- 升级 `BACKLOG_TEMPLATE.md`，让事项带上 evidence、dependency、next decision、ready 状态。
- 新增 `scripts/bump-skill-version.sh`，用于递增 skill 版本并同步 changelog。

Migration note:

- 旧版 `ROADMAP.md` / `BACKLOG.md` 仍可继续使用，但建议补齐新模板里的 metadata、evidence、dependencies、kill signal、ready 字段。
- `Implementation Tracking` 表保持兼容，`scripts/sync-roadmap-progress.sh` 无需修改。

## v1.0.0 - 2026-04-10

- 初始版 roadmap skill，提供基础路线图和 backlog 产物。
