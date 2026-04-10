# Req-Act Playbook

## Core Thesis

`req-act` 的任务不是“再解释一遍”，而是把已经通过验证的事实推进成真正的交付状态。

它接收 `req-check` 的结果，但不复用 `req-check` 的职责。

- `req-check` 解决：这次变更到底有没有被证明
- `req-act` 解决：这次被证明的变更到底怎么落地

## Phase 0: Close The Gate

开始前先做 3 件事：

1. 运行 `scripts/verify-act-gate.sh --dir <requirement-dir>`
2. 确认 `report-card.json` 是 `pass`，且没有未解释的 gaps / reroute
3. 确认 `TASKS.md` 不再有未完成项

如果 gate 没闭合，直接回 `req-check` 或 `req-do`，不要在 `req-act` 自我安慰。

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

## Phase 2: Build Delivery Pack

至少整理这些材料：

- `status-report.md`
- `pr-brief.md`
- `RELEASE_NOTE.md`（需要发布时）
- 更新后的 `resume-index.md`
- `doc-sync-report.md`

这些文件只允许写已经被证明过的事实，不准补编故事。

建议顺序：

1. `scripts/sync-act-docs.sh --dir <requirement-dir>`
2. `scripts/render-pr-brief.sh --dir <requirement-dir>`

## Phase 3: Sync Docs

文档同步不是装饰动作，而是 ship 的一部分。

同步规则：

1. 代码结构变了，就同步对应目录的 `CLAUDE.md`
2. 用户可感知行为变了，就同步 `README.md` / `RELEASE_NOTE.md`
3. handoff 路径变了，就同步 `resume-index.md`
4. reviewer 如果看文档还得猜，就说明 sync 失败

## Phase 4: Execute Integration

### `create-pr`

- 推送当前分支
- 创建 PR / MR
- PR body 以 `pr-brief.md` 为真相源

### `update-pr`

- 不重新造一个 PR
- 刷新已有 PR / MR body
- 确保 body 反映这次最新 `req-check` 结果与 doc sync 状态

### `local-handoff`

- 不假装已经 ship
- 明确写出下一位接手者的入口、验证方式、阻塞点

### `post-merge-closeout`

- 不做 feature branch PR 动作
- 完成 release note、文档同步、backlog/roadmap 回写、归档

## Phase 5: Write Back The Learning

以下情况必须回写 `BACKLOG.md` / `ROADMAP.md`：

1. 本次工作暴露了新的 follow-up
2. 原有优先级被改变
3. 有明确 deferred item 不能靠口头记忆保存

原则：

- 长期方向写 `ROADMAP.md`
- 下一轮待排队动作写 `BACKLOG.md`
- 不要把噪音和碎念回写成系统真相

## Phase 6: Declare The Next Entry

`req-act` 结束时必须留下一个明确入口：

- requirement 真闭环：可归档，下一轮入口在 backlog / roadmap
- requirement 未完全闭环：`resume-index.md` 必须告诉下一位从哪里接、怎么验、当前卡点是什么

## Required Outputs

- `status-report.md`
- `pr-brief.md`
- `RELEASE_NOTE.md`（需要发布时）
- 更新后的 `resume-index.md`
- 更新后的 `CLAUDE.md` / README / 架构文档（如果结构或行为变了）
- 必要时更新后的 `BACKLOG.md` / `ROADMAP.md`

## Local Kit

- `assets/PR_BRIEF_TEMPLATE.md` 负责 reviewer / PR 交付骨架
- `assets/RELEASE_NOTE_TEMPLATE.md` 负责对外发布骨架
- `scripts/verify-act-gate.sh` 负责 gate 闭合校验
- `scripts/detect-ship-target.sh` 负责分支与 PR 决策
- `scripts/sync-act-docs.sh` 负责同步 requirement 级文档与 doc target 报告
- `scripts/render-pr-brief.sh` 负责从 requirement 真相源渲染 `pr-brief.md`
- `scripts/generate-status-report.sh` 负责汇总 requirement 与 ship 现状
- `scripts/archive-requirement.sh` 负责 requirement 生命周期收尾
