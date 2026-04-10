# npm-release Skill Changelog

## v1.0.0 - 2026-04-10

- 为 `npm-release` 补齐 `version` frontmatter，纳入仓库维护类 skill 契约。
- 新增本地 `PLAYBOOK.md` 与 skill changelog，避免发布流程说明继续漂移成孤儿文件。
- 明确 `npm whoami` 失败属于发布阻断条件，要求在真实 `npm publish` 前先验证 registry 身份。
