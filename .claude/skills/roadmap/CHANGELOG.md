# Roadmap Skill Changelog

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
