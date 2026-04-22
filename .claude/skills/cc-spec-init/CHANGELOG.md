# CC-Spec-Init Skill Changelog

## v1.0.1 - 2026-04-22

- tighten `validate-spec-links.sh` so `INDEX.md` only reads the capability map table instead of accidentally scanning unrelated tables
- validate dangling `secondaryCapabilities` and `spec.specFiles` from `change-meta.json` in addition to the primary capability
- make spec-link repair safer before `cc-plan`, `cc-do`, and `cc-act` continue

Migration note:

- existing `change-meta.json` files with stale secondary capability or spec file links will now fail fast until repaired

## v1.0.0 - 2026-04-19

- 初始版 `cc-spec-init`，用于 capability-centered spec 初始化、能力真相源维护和 `change-meta.json` 链路收口。
- 新增 `INDEX.md`、capability spec、`change-meta.json` 三类模板。
- 新增 bootstrap 与链接校验脚本，供 `cc-roadmap`、`cc-plan`、`cc-act` 前后复用。
