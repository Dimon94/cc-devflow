# Docs-Sync Skill Changelog

## v1.3.0 - 2026-05-18

- add a docs-sync checklist contract for change inventory, skill versioning, changelog updates, public-doc drift, migration notes, and exit proof

## v1.2.0 - 2026-04-28

- add a skill contract quality gate for trigger descriptions, concise SKILL.md entrypoints, references, scripts, and template consistency
- require docs to preserve dependency order so concepts appear before derived steps and bilingual docs tell the same facts
- make conflicting skill descriptions, README text, changelogs, templates, and scripts a contract repair before commit

## v1.1.0 - 2026-04-17

- update the workflow sync rule so public docs can describe both `PDCA` and `IDCA/DDCA` honestly
- expand the drift scan patterns to catch stale `five visible skills` messaging when the cc-investigate loop is present

## v1.0.0 - 2026-04-10

- 初始版 `docs-sync` 维护类 skill。
- 定义 skill 文档同步协议：skill 变更要同步 `version`、skill `CHANGELOG.md`、README / CONTRIBUTING / `docs/**/*.md`。
- 新增通用 `bump-skill-version.sh` 与公开文档清单脚本，降低每次提交遗漏文档更新的概率。
