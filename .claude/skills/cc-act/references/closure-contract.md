# Closure Contract

## Before Closing

1. `report-card.json` 必须是 `pass`
2. `reroute` 必须是 `none`
3. `evidence` 必须非空
4. `planning/tasks.md` 不能还有未完成项
5. 交付材料必须只总结现实，不补编故事
6. 如果文件结构变了，就同步对应目录的 `CLAUDE.md`

## Ship Decision Contract

收尾动作必须归入且只归入下列模式之一：

1. `create-pr`
2. `update-pr`
3. `local-handoff`
4. `post-merge-closeout`

如果当前状态不属于这 4 类之一，说明事实还没搞清，不准继续 ship。

## During Act

1. 如果 Act 阶段修改了代码、测试、验证口径，必须回 `cc-check`
2. 已存在 PR / MR 时优先更新，不重复创建
3. 文档不同构时，ship 不算完成
4. follow-up 只允许回写到系统真相源，不允许停留在聊天记录里
5. VERSION / package / changelog 漂移必须先分类处理，不能重复 bump 或覆盖发布历史
6. PR / MR body 必须从当前事实重建，不能沿用旧验证输出
7. push / PR 创建必须具备幂等检查：已同步则跳过，已存在 PR 则更新

## Memory Consolidation

进入 ship 动作前，先把分散事实压缩进：

- `handoff/pr-brief.md`
- `handoff/resume-index.md`（需要 handoff 时）
- `handoff/release-note.md`（需要发布时）

如果下一位接手者还得去翻零散 checkpoint 才知道从哪接，说明 act 还没收口。

## After Closing

- reviewer 能接手
- maintainer 知道怎么验证
- PR / handoff / release 材料反映同一套事实
- 下一轮计划入口更清楚
- 文档入口可发现，changelog 不丢历史，TODO / backlog 只记录有证据的事项
