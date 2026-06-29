---
name: docs-sync
version: 1.3.1
description: Use when a shipped skill, CLI contract, or public-facing workflow loop changed and you need to sync skill versions, CHANGELOGs, README/CONTRIBUTING/docs content, and migration notes before commit or ship.
reads:
  - PLAYBOOK.md
  - CHANGELOG.md
  - references/sync-contract.md
  - references/checklist-contract.md
---

# Docs-Sync

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、公开 docs、必要的 migration note，然后检查 `CLAUDE.md`

## Role

`docs-sync` 不发明功能。它把已经发生的真实变更同步回 skill 版本、skill changelog、仓库 docs 和 release-facing 文案。

## Quick Start

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/sync-contract.md`
4. `references/checklist-contract.md`
5. `git status --short` and `git diff --name-only`

## Use This Skill When

- 改了任何已发布 skill 的 `SKILL.md`、`PLAYBOOK.md`、`assets/`、`references/`、`scripts/`
- 改了 CLI、安装方式、适配命令、workflow 叙事或公开输出
- 准备提交一个会影响用户理解的变更
- `cc-act` 结束后，需要做最终文档同步

如果只是改纯内部实现，且不会改变 skill 契约、CLI 行为、公开文档或用户心智模型，不要强行制造文档噪音。

## Entry Gate

1. Diff-first: classify touched skills, internal code, CLI behavior, and public docs impact from Git truth.
2. Classify each skill change as `patch`, `minor`, or `major`.
3. Name the docs, changelogs, and migration notes that must sync before editing.

## Sync Protocol

1. Build `Change Inventory`: touched skills, version bumps, changelogs, public docs, migration notes.
2. For each changed skill:
   - 更新 `SKILL.md` frontmatter 里的 `version`
   - 更新 skill 本地 `CHANGELOG.md`
   - 检查 `PLAYBOOK.md`、模板、脚本、references 是否还与 `SKILL.md` 一致
3. For public docs:
   - 同步 `README.md` / `README.zh-CN.md`
   - 同步 `CONTRIBUTING.md` / `CONTRIBUTING.zh-CN.md`
   - 同步受影响的 `docs/**/*.md`
   - 如果会影响发布说明，再同步根 `CHANGELOG.md`
4. 公开 workflow 叙事要忠于现实：`roadmap` 之后是 planned-work `PDCA` 和轻量 `cc-diagnose` hotfix 路径；维护类 skill 单独说明，不要污染主叙事。
5. 结束前做一次 drift scan，确认没有旧版本号、旧技能列表、旧命令残留在公开 docs 里。

## Skill Contract Quality Gate

改动 skill 时，先检查它作为模型可见触发合同是否仍然好用：

1. Description 是触发真相源：
   - 第一层说明 skill 做什么。
   - 第二层说明 `Use when...` 的具体触发词、场景、文件类型或 workflow 状态。
   - 不写空泛描述，例如“helps with workflow”。
2. `SKILL.md` 保持入口短而硬：
   - 常用路径留在主文件。
   - 稀有细节下沉到 `references/`。
   - 可重复的确定性操作优先写进 `scripts/`，不要让模型每次重新发明。
3. 文档顺序按依赖关系组织：
   - 先讲必须先知道的概念，再讲派生步骤。
   - 同一段只服务一个决策或动作。
   - 中英文公开文档要表达同一套事实，不做自由改写。
4. 发现 skill 描述、README、CHANGELOG、模板或脚本互相矛盾时，先修合同，不要只补 changelog。

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
- 不要把维护类 skill 写成公开主 workflow 的一环
