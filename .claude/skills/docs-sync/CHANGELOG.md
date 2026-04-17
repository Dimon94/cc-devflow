# Docs-Sync Skill Changelog

## v1.1.0 - 2026-04-17

- update the workflow sync rule so public docs can describe both `PDCA` and `IDCA/DDCA` honestly
- expand the drift scan patterns to catch stale `five visible skills` messaging when the cc-investigate loop is present

## v1.0.0 - 2026-04-10

- 初始版 `docs-sync` 维护类 skill。
- 定义 skill 文档同步协议：skill 变更要同步 `version`、skill `CHANGELOG.md`、README / CONTRIBUTING / `docs/**/*.md`。
- 新增通用 `bump-skill-version.sh` 与公开文档清单脚本，降低每次提交遗漏文档更新的概率。
