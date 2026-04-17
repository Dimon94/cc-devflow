# Docs-Sync Playbook

## Core Rules

1. 文档同步从 `git diff` 开始，不从猜测开始。
2. 先定 skill 版本结论，再写 changelog。
3. 中文和英文文档一起收口，不允许单边漂移。
4. 主 workflow 叙事保持极简，维护类能力单独归档。
5. 每次提交前都要回答：这次改动会不会让用户理解发生变化。

## Standard Sweep

先看这些事实源：

1. 被修改的 `.claude/skills/<skill>/`
2. `README.md` / `README.zh-CN.md`
3. `CONTRIBUTING.md` / `CONTRIBUTING.zh-CN.md`
4. `docs/**/*.md`
5. 根 `CHANGELOG.md`

## Version Order

1. 先判断 bump 类型：`patch` / `minor` / `major`
2. 再改 skill `SKILL.md` frontmatter
3. 再补 skill `CHANGELOG.md`
4. 再同步引用到该 skill 的 docs

## Command Kit

```bash
# 看这次到底改了什么
git status --short
git diff --name-only

# 列出需要复核的公开 docs
bash .claude/skills/docs-sync/scripts/list-public-docs.sh

# 给某个 skill bump 版本并预置 changelog 条目
bash .claude/skills/docs-sync/scripts/bump-skill-version.sh \
  --skill-dir .claude/skills/<skill> \
  --type patch \
  --message "change summary"

# 检查公开 docs 里是否还残留旧叙事
rg -n "five visible skills|six visible skills|PDCA|IDCA|DDCA|cc-investigate|cc-act|roadmap" \
  README.md README.zh-CN.md CONTRIBUTING.md CONTRIBUTING.zh-CN.md docs
```

## Review Questions

交付前至少问自己这 6 个问题：

1. 这次变更改了 skill 契约，还是只改了实现细节？
2. 版本号是否匹配这次变更的真实级别？
3. skill changelog 是否写清楚了为什么要改？
4. 中文 / 英文 docs 是否同时更新？
5. 主 workflow 叙事有没有被维护性细节污染？
6. 是否存在用户照文档操作却会撞墙的地方？

## Migration Rule

只要旧文档使用方式会误导用户，就写 migration note。

不要等到 breaking change 才写。只要迁移成本值得提醒，就写。
