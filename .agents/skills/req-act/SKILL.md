---
name: req-act
description: Act-stage skill for CC-DevFlow. Use when checked work must be shipped, documented, handed off, released, and folded back into the next planning cycle.
---

# Req-Act

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Role

`req-act` 是 PDCA 里的 `Act`。

它负责把已经通过验证的结果真正落地，并把这次学习回写成下一轮更好的起点。

## Use This Skill When

- `req-check` 已通过
- 需要生成 PR brief / release note
- 需要同步最终文档
- 需要把收尾结论回写给下一轮计划

## Loop

1. 只接收已经通过 `req-check` 的工作。
2. 整理交付材料，不重写事实。
3. 同步代码地图与 handoff 文档。
4. 如果这次结果改变了优先级，回写 `BACKLOG.md` 或 `ROADMAP.md`。

## Output

- `pr-brief.md`
- `RELEASE_NOTE.md`
- 同步后的 `CLAUDE.md` / 架构文档
- 更新后的 `resume-index.md` / handoff 信息
- 必要时更新的 `BACKLOG.md` / `ROADMAP.md`

## Working Rules

1. `req-check` 没过，不准 ship。
2. 交付只总结事实，不编故事。
3. 文档必须与最终代码同构。
4. Act 结束后，下一轮的 Plan 入口要比之前更清楚。

## Exit Criteria

- 交付材料可直接给 reviewer / maintainer
- 需要同步的文档已经同步
- 下一轮该怎么接手已经写清楚
- requirement 不是“看起来结束”，而是真正闭环

## Do Not

- 不把发布动作偷偷塞回 Check
- 不让 handoff 变成口头描述
- 不留“下次再说”的关键空洞
