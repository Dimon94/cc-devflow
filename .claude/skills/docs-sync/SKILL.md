---
name: docs-sync
version: 1.0.0
description: Use when a shipped skill, CLI contract, or public-facing workflow changed and you need to sync skill versions, CHANGELOGs, README/CONTRIBUTING/docs content, and migration notes before commit or ship.
---

# Docs-Sync

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、公开 docs、必要的 migration note，然后检查 `CLAUDE.md`

## Role

`docs-sync` 是仓库的文档收口器。

它不发明功能，只负责把已经发生的真实变更，压回 skill 版本、skill changelog、仓库 docs 和 release-facing 文案里，避免代码已经变了，说明书还活在昨天。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/sync-contract.md`

## Use This Skill When

- 改了任何已发布 skill 的 `SKILL.md`、`PLAYBOOK.md`、`assets/`、`references/`、`scripts/`
- 改了 CLI、安装方式、适配命令、workflow 叙事或公开输出
- 准备提交一个会影响用户理解的变更
- `req-act` 结束后，需要做最终文档同步

如果只是改纯内部实现，且不会改变 skill 契约、CLI 行为、公开文档或用户心智模型，不要强行制造文档噪音。

## Entry Gate

1. 先看 `git diff` / `git status`，不要凭感觉说“应该不用改 docs”。
2. 先定位这次变更碰了哪些 skill，哪些只是内部代码。
3. 先判断这次是 `patch`、`minor` 还是 `major` 级别的 skill 变化。
4. 先写清本次必须同步哪些 docs，再开始编辑。

## Session Protocol

1. 先做 `Change Inventory`
   - 这次改了哪些 skill
   - 哪些 skill 需要 bump version
   - 哪些 changelog 需要补
   - 哪些仓库 docs 需要同步
2. 对每个被修改的 skill：
   - 更新 `SKILL.md` frontmatter 里的 `version`
   - 更新 skill 本地 `CHANGELOG.md`
   - 检查 `PLAYBOOK.md`、模板、脚本、references 是否还与 `SKILL.md` 一致
3. 对仓库 docs：
   - 同步 `README.md` / `README.zh-CN.md`
   - 同步 `CONTRIBUTING.md` / `CONTRIBUTING.zh-CN.md`
   - 同步受影响的 `docs/**/*.md`
   - 如果会影响发布说明，再同步根 `CHANGELOG.md`
4. 如果主 workflow 仍然只有 `roadmap -> req-plan -> req-do -> req-check -> req-act`，保住这条主线；维护类 skill 单独说明，不要污染主叙事。
5. 结束前做一次 drift scan，确认没有旧版本号、旧技能列表、旧命令残留在公开 docs 里。

## Skill Versioning Rules

对被修改的 skill，按 semver 处理：

- `patch`：措辞澄清、模板说明补充、非契约性修正
- `minor`：新增兼容资源、流程 gate、输出字段、脚本能力
- `major`：改变输出契约、主流程、handoff 方式、安装/路由心智模型

出现 `major` 时，必须写 migration note。

## Output

- 已同步的 skill `version`
- 已更新的 skill `CHANGELOG.md`
- 已对齐的 README / CONTRIBUTING / `docs/**/*.md`
- 必要时补上的根 `CHANGELOG.md` 记录

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 同步契约：`references/sync-contract.md`
- 版本递增：`scripts/bump-skill-version.sh`
- 文档清单：`scripts/list-public-docs.sh`

## Exit Criteria

- 每个受影响 skill 都有明确版本结论
- skill 本地 changelog 已对齐
- 公开 docs 不再讲旧事实
- 需要 migration note 的地方已经写明
- 下一步可以放心 commit，而不是赌别人会脑补这次变更

## Do Not

- 不要只改代码不改 docs
- 不要 bump 版本却不写 changelog
- 不要只改英文或只改中文文档
- 不要把内部实现噪音硬写进对外文档
- 不要把维护类 skill 写成主 workflow 第六步
