# CC-Act Playbook

## Visible State Machine

`cc-check -> cc-act -> roadmap/cc-plan next loop`

- Enter from: `cc-check` with a passing report card.
- Stay in: `cc-act` while ship mode, simplify/test evidence, docs, and handoff are being aligned to proven facts.
- Exit to: the next roadmap/backlog loop once delivery artifacts, source RM progress, and follow-up writeback are complete.
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
4. 确认 `review.freshness` 新鲜、`runtime.failureOwnership` 无未解释失败、`qa.coverageAudit` / `qa.browserEvidence` 有证据或明确 skip
5. 确认 `qa.feedbackLoop` / `qa.behaviorEvidence` 能支撑行为结论；不可复现时必须写清缺什么 artifact / 权限 / 输入
6. 定位 source RM，并确认 `devflow/roadmap.json`、`devflow/ROADMAP.md`、optional `devflow/BACKLOG.md` 没有和 verified reality 冲突

如果 gate 没闭合，直接回 `cc-check` 或 `cc-do`，不要在 `cc-act` 自我安慰。

## Phase 0.5: Check Roadmap Progress

Roadmap 是执行链路的长期记忆，不是收尾时才想起的备忘录。

1. 从 `change-meta.json` / `planning/task-manifest.json` 读取 `sourceRoadmap.itemId`、REQ/FIX、primary capability、expected spec delta。
2. 用 `../cc-roadmap/scripts/locate-roadmap-item.sh <RM-ID>` 对照 `devflow/roadmap.json`、`devflow/ROADMAP.md`、optional `devflow/BACKLOG.md`。
3. 如果 RM 已经指向另一个 change、被标成 blocked/deferred/done，或 progress 与 `review/report-card.json` 现实冲突，先同步或 reroute，不继续 ship。
4. 如果没有 source RM，不编造；在 handoff 写 `roadmapSync.noOpReason: no-source-rm`。

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

## Phase 2: Simplify And Refresh Proof

在真正准备交付材料前，先做这 4 件事：

1. 调用 `cc-simplify`
   - 通过当前运行时可用的 skill 调用器执行
   - 如果桥接环境暴露为 `${JM}`，使用 `${JM}` with `skill: "cc-simplify"`
2. 跑项目单测
   - 先检查 `package.json` scripts、`Makefile`、或项目常见测试入口
   - 选择项目实际存在的命令执行
3. 跑 e2e
   - 严格遵守协调器 prompt 给出的 e2e recipe
   - recipe 明确要求跳过时，只记录 skip 理由
4. 一旦这三步里有任何修复改了代码，立即回 `cc-check`

原则很简单：

- `cc-act` 可以做清理和收尾修复
- 但只要现实被改写，就必须重新证明
- verification 每次进 `cc-act` 都要重新跑；只有 push、PR 更新、文档生成这类动作可以因幂等状态跳过

## Phase 2.5: Ship Hygiene

真正提交或推送前，先锁住 ship 卫生：

1. 比较 `VERSION` / `package.json` / base branch，识别 `fresh`、`already bumped`、`stale package`、`unexpected drift`。
2. 读取 changelog，不覆盖已有条目；新增或润色只能基于当前 diff 和 commit history。
3. 检查提交边界，按逻辑单元拆分，保证提交顺序不引用未来代码。
4. 如果有 WIP commit，只能用非破坏性 rebase / fixup 处理，不允许盲目 soft reset。
5. push 前比较 local / remote HEAD；PR 前检查是否已有打开 PR / MR。
6. 生成 readiness dashboard：review freshness、review quality、QA coverage、browser QA、feedback loop、behavior evidence、failure ownership、documentation release、PR body accuracy。
7. 生成 ship preflight：branch/base/remote/auth/clean tree/review freshness/ship mode。
8. preflight 失败必须命名为 `ShipPreflightError`，并写明 rescue action 或切到 `local-handoff`。
9. 发布、合并、PR 更新或 release note 前必须写 rollback guard。

## Phase 3: Build Delivery Pack

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

`pr-brief.md` 还必须带上 `cc-check` 的 review range：

- reviewed base SHA
- reviewed head SHA
- review packet path / summary
- finding triage summary
- QA / claim evidence summary
- ship preflight and `ShipPreflightError` rescue if any
- rollback guard
- QA behavior evidence and feedback-loop quality
- readiness dashboard
- PR body accuracy check
- Durable follow-up briefs: current behavior、desired behavior、key interfaces、acceptance criteria、out of scope

缺这些字段时，可以生成 local handoff，但不能声称 PR body 已经可 review。

## Phase 4: Sync Docs

文档同步不是装饰动作，而是 ship 的一部分。

同步规则：

1. 代码结构变了，就同步对应目录的 `CLAUDE.md`
2. 用户可感知行为变了，就同步 `README.md` / `handoff/release-note.md`
3. handoff 路径变了，就同步 `handoff/resume-index.md`
4. reviewer 如果看文档还得猜，就说明 sync 失败
5. 新文档必须从 README、CLAUDE 或 handoff 入口可发现
6. CHANGELOG 只允许保护性更新，不能重写历史
7. doc sync 结果要进入 PR body 或 handoff，而不是只留在聊天里

## Phase 5: Execute Integration

### `create-pr`

- 按 `references/git-commit-guidelines.md` 完成提交
- 推送当前分支
- 用 `gh pr create` 创建 PR / MR
- PR body 以 `pr-brief.md` 为真相源，并包含 Summary、Test Coverage、Pre-Landing Review、Readiness Dashboard、Scope Drift、Plan Completion、Verification Results、Documentation、Test plan
- 创建前检查 PR body 是否来自当前 report-card 和当前 diff，不继承旧 body

### `update-pr`

- 如果有新增提交，先按 `references/git-commit-guidelines.md` 完成 commit / push
- 不重新造一个 PR
- 刷新已有 PR / MR body
- 确保 body 由本次最新 `cc-check` 结果与 doc sync 状态重建，不沿用旧 body
- PR body 与当前 commits / diff 不一致时，必须先更新 body，再继续交付判断

### `local-handoff`

- 不假装已经 ship
- 明确写出下一位接手者的入口、验证方式、阻塞点

### `post-merge-closeout`

- 不做 feature branch PR 动作
- 在 merged result 上重跑必要 gate，并记录命令、exit status、关键观察
- 完成 release note、文档同步、backlog/roadmap 回写、归档

### destructive cleanup

- 删除 branch、worktree、未合并提交、change archive 前，先列出对象
- 丢弃未合并工作必须要求用户显式确认
- 无法确认时保留现场，切到 `local-handoff`

如果 `gh` 不可用、push 失败、远端不可达，就不要硬凹 `create-pr` / `update-pr`。切到 `local-handoff`，把阻塞和下一步写清楚。

## Phase 6: Write Back The Learning

以下情况必须回写 `devflow/roadmap.json`，再重新生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`：

1. 本次工作暴露了新的 follow-up
2. 原有优先级被改变
3. 有明确 deferred item 不能靠口头记忆保存
4. source RM 的 ship 现实从 planned / repair planned 推进到了 in review / ready for handoff / done

原则：

- 长期方向写进 `devflow/roadmap.json` 的 stage / item / backlog 字段
- 下一轮待排队动作写进对应 RM 的 backlog 字段，或交给 `cc-roadmap` 新增 RM
- 不要把噪音和碎念回写成系统真相
- follow-up 必须是 durable brief：用领域语言写 current behavior、desired behavior、key interfaces、acceptance criteria、out of scope
- 独立行为拆独立条目；有依赖关系时写明顺序，方便下一轮并行或排队
- 常规进度用 `../cc-roadmap/scripts/sync-roadmap-progress.sh --rm <RM-ID> --status <state> --req <REQ/FIX> --progress <percent>`
- follow-up 改变阶段顺序或项目优先级时，不在 `cc-act` 临场重排，reroute 到 `cc-roadmap`

## Phase 7: Declare The Next Entry

`cc-act` 结束时必须留下一个明确入口：

- requirement 真闭环：可归档，下一轮入口在 backlog / roadmap
- requirement 未完全闭环：`handoff/resume-index.md` 必须告诉下一位从哪里接、怎么验、当前卡点是什么

## Recommendation Test

交付前过一遍这 4 个问题：

1. 看完第一屏，别人能不能立刻知道 ship 模式？
2. 材料是不是只覆盖当前模式真正需要的内容？
3. reviewer / 接手者 还需不需要追问“所以我现在该看哪个文件”？
4. `cc-simplify`、单测、e2e、commit/push 的结果是不是都能追溯？
5. PR body / release note / handoff / changelog 说的是不是同一套现实？
6. readiness dashboard 有没有 blocker 或 stale warning？
7. follow-up 是不是行为契约，而不是“改某文件某行”的易腐烂 TODO？
8. ship preflight failure 是否有 `ShipPreflightError`、artifact ref 和 rescue action？
9. rollback guard 是否足够让下一位维护者不靠聊天记录回退？
10. source RM 的 status、REQ/FIX、progress 是否已经和 ship 现实一致？

如果第 1 或第 3 题答案不是“能”，说明 `cc-act` 仍然太重或太糊。

## Required Outputs

- `handoff/pr-brief.md`
- `handoff/release-note.md`（需要发布时）
- 更新后的 `handoff/resume-index.md`
- 更新后的 `CLAUDE.md` / README / 架构文档（如果结构或行为变了）
- 必要时更新后的 `devflow/roadmap.json` / `devflow/ROADMAP.md` / `devflow/BACKLOG.md`

## Local Kit

- `assets/PR_BRIEF_TEMPLATE.md` 负责 reviewer / PR 交付骨架
- `assets/RELEASE_NOTE_TEMPLATE.md` 负责对外发布骨架
- `scripts/verify-act-gate.sh` 负责 gate 闭合校验
- `scripts/detect-ship-target.sh` 负责分支与 PR 决策
- `scripts/sync-act-docs.sh` 负责同步 requirement 级文档与 doc target 报告
- `scripts/render-pr-brief.sh` 负责从 requirement 真相源渲染 `pr-brief.md`
- `scripts/generate-status-report.sh` 负责汇总 requirement 与 ship 现状
- `scripts/archive-change.sh` 负责 change 生命周期收尾（归档到 `devflow/changes/archive/YYYY-MM/`）
- `../cc-roadmap/scripts/locate-roadmap-item.sh` 负责定位 source RM
- `../cc-roadmap/scripts/sync-roadmap-progress.sh` 负责回写 roadmap progress 并渲染投影
- `cc-simplify` 负责在 ship 前压掉重复、坏味道、低效实现
- `references/git-commit-guidelines.md` 负责提交规范真相源

## Exit Smell

如果用户看完结果还会问：

- “所以现在是提 PR 还是先 handoff？”
- “你真的跑过 simplify、单测、e2e 吗？”
- “为什么要写 release note？”
- “下一位到底从哪里开始接？”

那这次 `cc-act` 还没有把复杂度压平。
