---
name: req-act
description: Use when verified work must be integrated, shipped, documented, handed off, and folded back into backlog or roadmap with a clear next-entry point.
---

# Req-Act

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Role

`req-act` 是 PDCA 里的 `Act + Ship`。

它不再只是“写收尾文档”，而是负责把已经通过验证的现实推进到真正可接手、可 review、可发布、可回写的状态。

一句话：`req-check` 证明“东西已经好”，`req-act` 负责把“已经好”变成“已经落地”。

## Read First

1. `PLAYBOOK.md`
2. `references/closure-contract.md`

## Use This Skill When

- `req-check` 已通过
- 需要决定这次是 `create-pr`、`update-pr`、`local-handoff`，还是 `post-merge-closeout`
- 需要同步最终文档、handoff、release note
- 需要把遗留 follow-up / 优先级变化回写 `BACKLOG.md` 或 `ROADMAP.md`
- 需要让下一轮入口比现在更清楚

如果 `report-card.json` 不是 `pass`，或者仍指向 `req-do` / `req-plan`，停止在这里，不准 ship。

## Entry Gate

1. 先读 `report-card.json`，只接受已通过且有证据的现实。
2. 再读 `DESIGN.md`、`TASKS.md`、`task-manifest.json`、`resume-index.md`，确认这次到底完成了什么。
3. 运行 `scripts/verify-act-gate.sh --dir <requirement-dir>`，确认 gate 真的闭合。
4. 运行 `scripts/detect-ship-target.sh`，识别当前分支、base branch、PR 状态与推荐 ship 路径。
5. 如果在 `req-act` 期间又改了代码、修了 review、补了测试，必须回 `req-check`，不能带着旧证明继续 ship。

## Ship Modes

`req-act` 只允许 4 种模式，避免“收尾”变成模糊动作：

1. `create-pr`
   - 当前在 feature branch
   - 远端存在
   - 当前没有 PR / MR
2. `update-pr`
   - 当前在 feature branch
   - 已存在打开的 PR / MR
   - 需要刷新 body、补文档、同步最新状态
3. `local-handoff`
   - 当前在 feature branch
   - 暂不推远端，或远端工具不可用
   - 但要把 handoff 与下一步写清楚
4. `post-merge-closeout`
   - 当前已在 base branch，或 requirement 已完成合并
   - 重点是 release note、doc sync、backlog writeback、归档

不要发明第五种模糊模式。

## Loop

1. 先锁定 ship 事实：当前分支、base branch、PR 状态、requirement 状态。
2. 只使用 `req-check` 已经证明过的事实写交付材料，不编故事，不补脑。
3. 同步文档：
   - 结构变了，更新对应目录的 `CLAUDE.md`
   - 用户可感知行为变了，更新 `README.md` / `RELEASE_NOTE.md`
   - handoff 变了，更新 `resume-index.md`
4. 生成 `pr-brief.md`，把需求、变更、验证证据、风险、文档同步状态一次写清。
   - 优先运行 `scripts/sync-act-docs.sh --dir <requirement-dir>`
   - 再运行 `scripts/render-pr-brief.sh --dir <requirement-dir>`
5. 执行分支集成动作：
   - `create-pr`：推分支并创建 PR / MR
   - `update-pr`：刷新 PR / MR body，不沿用陈旧内容
   - `local-handoff`：不假装已经发出，只生成可接手材料
   - `post-merge-closeout`：跳过 PR，完成发布与闭环回写
6. 处理 doc sync：如果 ship 结果改变了代码地图、用法、架构边界，文档必须跟上。
7. 回写 `BACKLOG.md` / `ROADMAP.md`：
   - 新发现的 follow-up
   - 被推迟但必须保留的事项
   - 因本次结果而改变优先级的事项
8. 如果 requirement 真正闭环，更新状态摘要并归档；否则把下一位接手者的入口写清楚。

## Output

- `status-report.md`
- `pr-brief.md`
- `RELEASE_NOTE.md`（需要对外发布时）
- 更新后的 `resume-index.md`
- 同步后的 `CLAUDE.md` / README / 架构文档
- 必要时更新后的 `BACKLOG.md` / `ROADMAP.md`
- 必要时创建或更新的 PR / MR

## Bundled Resources

- 契约：`references/closure-contract.md`
- 模板：`assets/PR_BRIEF_TEMPLATE.md`
- 模板：`assets/RELEASE_NOTE_TEMPLATE.md`
- 状态摘要：`scripts/generate-status-report.sh`
- Gate 校验：`scripts/verify-act-gate.sh`
- Ship 目标识别：`scripts/detect-ship-target.sh`
- 文档同步：`scripts/sync-act-docs.sh`
- PR 简报生成：`scripts/render-pr-brief.sh`
- requirement 归档：`scripts/archive-requirement.sh`

## Working Rules

1. `req-check` 没过，不准 ship。
2. 没有新鲜证据的完成结论，不准进入交付材料。
3. 交付材料只总结现实，不重写历史。
4. 文档必须与最终代码和 ship 状态同构。
5. 分支决策必须明确属于 4 种模式之一，不要含糊。
6. 已存在 PR / MR 时，优先更新，不重复创建。
7. 如果 Act 阶段修改了代码、测试或验证口径，必须回 `req-check`。
8. `BACKLOG.md` / `ROADMAP.md` 只回写真正改变优先级或产生 follow-up 的事项，不写噪音。
9. `local-handoff` 不是偷懒模式，它仍然必须让下一位接手者知道做什么、怎么验证、卡在哪。

## Exit Criteria

- gate 闭合且现实一致
- ship 模式已明确并执行到位
- reviewer / maintainer 能直接接手
- 需要同步的文档已经同步
- follow-up 已回写到正确的 backlog / roadmap 位置
- 下一轮该怎么继续已经写清楚
- requirement 不是“看起来结束”，而是真正闭环

## Do Not

- 不把发布动作偷偷塞回 `req-check`
- 不拿旧测试输出冒充当前事实
- 不重复创建 PR / MR
- 不让 handoff 只停留在口头描述
- 不留“下次再说”的关键空洞
- 不在 `req-act` 阶段继续偷偷开发新范围

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 收尾契约：`references/closure-contract.md`
