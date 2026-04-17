# CC-Act Playbook

## Visible State Machine

`cc-check -> cc-act -> roadmap/cc-plan next loop`

- Enter from: `cc-check` with a passing report card.
- Stay in: `cc-act` while ship mode, docs, and handoff are being aligned to proven facts.
- Exit to: the next roadmap/backlog loop once delivery artifacts and follow-up writeback are complete.
- Reroute to: `cc-check` if verification changes, or `cc-do` if act uncovers unfinished implementation.

## Core Thesis

`cc-act` 的任务不是“再解释一遍”，而是把已经通过验证的事实推进成真正的交付状态。

它接收 `cc-check` 的结果，但不复用 `cc-check` 的职责。

- `cc-check` 解决：这次变更到底有没有被证明
- `cc-act` 解决：这次被证明的变更到底怎么落地

## Phase 0: Close The Gate

开始前先做 3 件事：

1. 运行 `scripts/verify-act-gate.sh --dir <requirement-dir>`
2. 确认 `review/report-card.json` 是 `pass`，且没有未解释的 gaps / reroute
3. 确认 `planning/tasks.md` 不再有未完成项

如果 gate 没闭合，直接回 `cc-check` 或 `cc-do`，不要在 `cc-act` 自我安慰。

## Phase 1: Freeze Ship Facts

运行 `scripts/detect-ship-target.sh`，锁定这些事实：

- current branch
- base branch
- platform / remote 能力
- 是否已有 PR / MR
- 推荐 ship 模式

Ship 必须属于这 4 种模式之一：

- `create-pr`
- `update-pr`
- `local-handoff`
- `post-merge-closeout`

这里不要只报事实，必须给出一句明确结论：

- `Recommended mode: <mode>`
- `Why now: <一句话理由>`
- `Why not others: <一句话排除>`

## Phase 2: Build Delivery Pack

先按模式整理最小材料：

- `create-pr`: `handoff/pr-brief.md`
- `update-pr`: 更新后的 `handoff/pr-brief.md`
- `local-handoff`: `handoff/resume-index.md`
- `post-merge-closeout`: doc sync 结果 + `handoff/release-note.md`（需要发布时）

然后再补下面这些扩展材料：

- `handoff/pr-brief.md`
- `handoff/release-note.md`（需要发布时）
- 更新后的 `handoff/resume-index.md`
- `doc-sync-report.md`

这些文件只允许写已经被证明过的事实，不准补编故事。

建议顺序：

1. `scripts/sync-act-docs.sh --dir <requirement-dir>`
2. `scripts/render-pr-brief.sh --dir <requirement-dir>`

## Phase 3: Sync Docs

文档同步不是装饰动作，而是 ship 的一部分。

同步规则：

1. 代码结构变了，就同步对应目录的 `CLAUDE.md`
2. 用户可感知行为变了，就同步 `README.md` / `handoff/release-note.md`
3. handoff 路径变了，就同步 `handoff/resume-index.md`
4. reviewer 如果看文档还得猜，就说明 sync 失败

## Phase 4: Execute Integration

### `create-pr`

- 推送当前分支
- 创建 PR / MR
- PR body 以 `pr-brief.md` 为真相源

### `update-pr`

- 不重新造一个 PR
- 刷新已有 PR / MR body
- 确保 body 反映这次最新 `cc-check` 结果与 doc sync 状态

### `local-handoff`

- 不假装已经 ship
- 明确写出下一位接手者的入口、验证方式、阻塞点

### `post-merge-closeout`

- 不做 feature branch PR 动作
- 完成 release note、文档同步、backlog/roadmap 回写、归档

## Phase 5: Write Back The Learning

以下情况必须回写 `devflow/roadmap/backlog.md` / `devflow/roadmap/roadmap.md`：

1. 本次工作暴露了新的 follow-up
2. 原有优先级被改变
3. 有明确 deferred item 不能靠口头记忆保存

原则：

- 长期方向写 `devflow/roadmap/roadmap.md`
- 下一轮待排队动作写 `devflow/roadmap/backlog.md`
- 不要把噪音和碎念回写成系统真相

## Phase 6: Declare The Next Entry

`cc-act` 结束时必须留下一个明确入口：

- requirement 真闭环：可归档，下一轮入口在 backlog / roadmap
- requirement 未完全闭环：`handoff/resume-index.md` 必须告诉下一位从哪里接、怎么验、当前卡点是什么

## Recommendation Test

交付前过一遍这 4 个问题：

1. 看完第一屏，别人能不能立刻知道 ship 模式？
2. 材料是不是只覆盖当前模式真正需要的内容？
3. reviewer / 接手者 还需不需要追问“所以我现在该看哪个文件”？
4. 如果删掉 `handoff/release-note.md` 或 PR 更新动作，是否仍然符合当前模式？

如果第 1 或第 3 题答案不是“能”，说明 `cc-act` 仍然太重或太糊。

## Required Outputs

- `handoff/pr-brief.md`
- `handoff/release-note.md`（需要发布时）
- 更新后的 `handoff/resume-index.md`
- 更新后的 `CLAUDE.md` / README / 架构文档（如果结构或行为变了）
- 必要时更新后的 `devflow/roadmap/backlog.md` / `devflow/roadmap/roadmap.md`

## Local Kit

- `assets/PR_BRIEF_TEMPLATE.md` 负责 reviewer / PR 交付骨架
- `assets/RELEASE_NOTE_TEMPLATE.md` 负责对外发布骨架
- `scripts/verify-act-gate.sh` 负责 gate 闭合校验
- `scripts/detect-ship-target.sh` 负责分支与 PR 决策
- `scripts/sync-act-docs.sh` 负责同步 requirement 级文档与 doc target 报告
- `scripts/render-pr-brief.sh` 负责从 requirement 真相源渲染 `pr-brief.md`
- `scripts/generate-status-report.sh` 负责汇总 requirement 与 ship 现状
- `scripts/archive-requirement.sh` 负责 requirement 生命周期收尾

## Exit Smell

如果用户看完结果还会问：

- “所以现在是提 PR 还是先 handoff？”
- “为什么要写 release note？”
- “下一位到底从哪里开始接？”

那这次 `cc-act` 还没有把复杂度压平。
