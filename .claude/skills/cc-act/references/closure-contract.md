# Closure Contract

## Before Closing

1. `report-card.json` 必须是 `pass`
2. `reroute` 必须是 `none`
3. `evidence` 必须非空
4. `planning/tasks.md` 不能还有未完成项
5. 交付材料必须只总结现实，不补编故事
6. 如果文件结构变了，就同步对应目录的 `CLAUDE.md`
7. PR / handoff 必须记录 `cc-check` 审过的 base/head SHA、review packet、finding triage 摘要
8. readiness dashboard 必须说明 review freshness、QA coverage、browser evidence、failure ownership、documentation release、PR body accuracy
9. behavior handoff 必须带上 QA feedback loop、expected / actual / reproduction steps，以及 durable follow-up brief
10. source RM 必须已从 `devflow/roadmap.json` 定位，且 roadmap progress 与 verified reality 一致；没有 source RM 时记录 no-op reason
11. `post-merge-closeout` 必须预先冻结 archive target；最终只能是已归档，或带 `ArchiveSkip` blocker 的未完成 closeout

## Ship Decision Contract

收尾动作必须归入且只归入下列模式之一：

1. `create-pr`
2. `update-pr`
3. `local-handoff`
4. `post-merge-closeout`

如果当前状态不属于这 4 类之一，说明事实还没搞清，不准继续 ship。

detached HEAD 是分支事实，不是第 5 种 ship 模式。若远端可用且用户目标是
继续 / 提交远程 PR，必须先运行 `scripts/ensure-ship-branch.sh --dir <requirement-dir>`
在当前 HEAD 创建命名分支，再回到 `create-pr` 流程。

## During Act

1. 如果 Act 阶段修改了代码、测试、验证口径，必须回 `cc-check`
2. 已存在 PR / MR 时优先更新，不重复创建
3. 文档不同构时，ship 不算完成
4. follow-up 只允许回写到系统真相源，不允许停留在聊天记录里
5. VERSION / package / changelog 漂移必须先分类处理，不能重复 bump 或覆盖发布历史
6. PR / MR body 必须从当前事实重建，不能沿用旧验证输出
7. push / PR 创建必须具备幂等检查：已同步则跳过，已存在 PR 则更新
8. 本地合并或 post-merge closeout 后必须在 merged result 上重跑必要 gate
9. 删除 branch、worktree、未合并提交、归档 requirement 前必须列出对象；丢弃未合并工作需要显式确认
10. verification 每次进入 `cc-act` 都必须重新跑；只有 push、PR 更新、文档生成等动作可以因为幂等状态跳过
11. PR body accuracy 必须对照当前 report-card、当前 diff、当前 commits；旧 body 不能作为证据源
12. follow-up 回写必须用行为契约表达，包含 current behavior、desired behavior、key interfaces、acceptance criteria、out of scope；不能只写文件路径或聊天 TODO
13. roadmap 回写只更新 `devflow/roadmap.json`，并通过 `sync-roadmap-progress.sh` 重新生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`
14. `post-merge-closeout` 的归档必须真实执行：`cc-devflow archive-change <change-key>`，不能只把“可归档”写进 next action

## Memory Consolidation

进入 ship 动作前，先把分散事实压缩进：

- `handoff/pr-brief.md`
- `handoff/resume-index.md`（需要 handoff 时）
- `handoff/release-note.md`（需要发布时）

如果下一位接手者还得去翻零散过程笔记才知道从哪接，说明 act 还没收口。

## After Closing

- reviewer 能接手
- maintainer 知道怎么验证
- PR / handoff / release 材料反映同一套事实
- readiness dashboard 没有 blocker，PR body accuracy 已检查或明确阻塞
- QA behavior evidence 和 feedback loop 已进入 PR / handoff / release 材料
- post-merge closeout 反映 merged result 的验证事实，而不是只反映合并前事实
- source RM 的 status、REQ/FIX 绑定、progress 和 follow-up 已经落入 roadmap truth
- closed change 已经移动到 `devflow/changes/archive/YYYY-MM/<change-key>`；如果没有，必须有 `ArchiveSkip` blocker、原因、受影响路径和 retry command
- 下一轮计划入口更清楚
- 文档入口可发现，changelog 不丢历史，TODO / backlog 只记录有证据的事项
