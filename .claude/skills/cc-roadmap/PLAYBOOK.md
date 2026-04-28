# Roadmap Playbook

## Visible State Machine

`roadmap` is the only strategy stage.

- Enter from: project kickoff, backlog drift, or strategy reset.
- Stay in: `roadmap` while direction is still being argued or evidence is incomplete.
- Exit to: `cc-plan` once one approved roadmap item becomes the next concrete requirement.

## Core Rules

1. 先读上下文，再问现实，不先写愿景。
2. 一次只推进一个关键未知点。
3. 只定 1-3 个阶段，不写愿望清单。
4. 通过 `roadmap` 只能产出方向，不能偷拆实现任务。
5. 没有证据时写 assumption，不准冒充事实。
6. 每次都必须明确推荐一条路线，不准只列选项不下判断。
7. 多个独立子系统混在一个目标里时，先拆阶段和 `RM` 候选，不要继续追问实现细节。
8. 先判断 planning posture 和 evidence maturity，再决定追问哪些问题；不要用同一套问题硬套 idea、已有用户、付费客户、infra 和 recovery 场景。
9. developer-facing / operator-facing 路线必须写清 target user、time to first value、magic moment 和 adoption bottleneck。
10. 先对齐 `devflow/specs/`、roadmap/backlog 和历史 design decision，再命名 stage、capability、RM 和 backlog；术语或决策冲突必须成为显式路线风险。

## Local Kit

- 生成骨架时用 `assets/ROADMAP_TEMPLATE.md` 和 `assets/BACKLOG_TEMPLATE.md`
- 需要结构化 tracking 时用 `assets/TRACKING_TEMPLATE.json`
- 需要追问脚本时看 `references/roadmap-dialogue.md`
- 需要定位 / 回写条目时用 `scripts/locate-roadmap-item.sh` 和 `scripts/sync-roadmap-progress.sh`
- `scripts/locate-roadmap-item.sh` 先读 `roadmap-tracking.json`，再回落到 `ROADMAP.md` / `BACKLOG.md`，避免定位依赖 markdown 列位或文案漂移
- 只想把 sidecar 重渲染回 `ROADMAP.md` / `BACKLOG.md` 时，直接调用 `scripts/roadmap-tracking.js render`
- `scripts/sync-roadmap-progress.sh` 会把 `roadmap-tracking.json` 当真相源，再回渲染 `ROADMAP.md` 和 `BACKLOG.md`
- 变更版本时同步 `CHANGELOG.md`，必要时用 `scripts/bump-skill-version.sh`

## Context Sweep

进入 roadmap 对话前，至少摸清：

1. 现有 `devflow/ROADMAP.md` / `devflow/BACKLOG.md`
2. `CLAUDE.md`、`README*`、`TODOS.md`
3. 项目语言和持久决策：`devflow/specs/INDEX.md`、相关 capability specs、当前 roadmap/backlog、历史 `planning/design.md` / `planning/analysis.md`、`change-meta.json`、长期 design decision
4. 最近相关 docs / specs / plans
5. 最近相关提交、当前工作树状态、正在推进的 requirement
6. 现实 forcing functions：deadline、distribution、资源、依赖、当前卡点
7. planning posture：startup / internal / hackathon / OSS / research / learning / side-project / infrastructure
8. evidence maturity：idea / has users / paying users / internal sponsor / infra-only / recovery
9. developer / operator adoption 线索：目标人、first success path、TTHW / time to first value、debug / upgrade 卡点

先把这些材料压成 `Context Snapshot`，再追问用户。

## Force Reality First

至少逼清这 5 件事：

1. 这个项目真正服务谁
2. 用户今天用什么笨办法解决
3. 为什么他们现在就会想要这个东西
4. 最窄但最有穿透力的第一阶段是什么
5. 未来 6-12 个月产品会自然长成什么样

同时补齐这 4 件落地信息：

6. 当前最强证据是什么
7. deadline / capacity / dependency / distribution 约束是什么
8. 当前最大的 adoption / trust / delivery 卡点是什么
9. 成功与失败的判断信号是什么

第一轮答案之后做 framing check：术语是否具体、是否沿用项目 canonical language、用户是否可命名、pain 是否来自真实行为、status quo 是否明确、需求证据是否强过“感兴趣”。如果答案虚，先收紧问题，不要急着定路线。

## Evidence-Maturity Routing

- `idea / pre-product`: 先追真实用户、现状替代方案、最窄 wedge、需求证据。
- `has users`: 先追现有路径、失败/绕路场景、使用保留信号、下一阶段 wedge。
- `paying users / internal sponsor`: 先追付费/赞助动机、扩张边界、信任信号、组织风险。
- `infra-only`: 先追调用方、瓶颈、复用边界、迁移/回滚约束。
- `recovery / trust gap`: 先追事故证据、恢复路径、最小可信修复、停止扩张的 kill signal。

## Route Shapes

- `wedge-first`: 用一个极窄切口先打穿真实需求
- `platform-first`: 先搭通后续阶段复用的关键底座
- `rescue-first`: 先解决当前最大的 adoption / trust / delivery 卡点
- `decompose-first`: 先把多个可独立交付的子系统拆成阶段和 `RM`，再选择主线

推荐时必须回答：为什么这条主线比其他两条更值得先打。

## Recommendation Test

写完推荐后，快速自检：

1. 如果删掉路线名，别人还能从理由里猜出为什么是这条吗？
2. 有没有明确说“不先做另外两条”的原因？
3. Stage 1 的 win signal 能不能在 1-2 个周期内看到？
4. 如果 Stage 1 输了，kill signal 是不是具体到可以止损？
5. 当前问题路由是否匹配 evidence maturity，而不是为了完整感把所有问题都问一遍？

## Stage Contract

每个阶段至少要有：

1. `Goal`
2. `Why now`
3. `Dependencies`
4. `Exit signal`
5. `Kill signal`
6. `Non-goals`
7. 子系统 / `RM` 边界，说明哪些合并、哪些拆开
8. 可以自然长成下一轮 `cc-plan` 的候选事项

## Dependency Contract

1. `Depends On` 只写硬阻塞，不写“最好先做”的软顺序。
2. 至少画出一份 `RM Dependency Graph`，让串行主链和并行分支一眼可见。
3. 至少列出一组 `Parallel waves`，说明哪些事项可共享同一前置后并发推进。
4. 如果图里出现环，说明阶段切分错了，先重切，不要硬解释。

## Output Contract

`devflow/ROADMAP.md`
- version / skill version / context snapshot / evidence ledger
- 1-3 个阶段
- 独立子系统拆分判断
- 每阶段目标
- 每阶段存在原因
- 每阶段 dependencies
- 每阶段 exit signal
- 每阶段 kill signal
- 非目标
- `RM Dependency Graph`
- `Parallel waves`
- `Implementation Tracking` 由 `devflow/roadmap-tracking.json` 渲染，避免手改 markdown 表格列位

`devflow/BACKLOG.md`
- 只保留会真的进入下一轮 `cc-plan` 的事项
- 每项注明来源阶段、优先级、证据、`Depends On`、`Parallel With`、当前未知点、下一决策、是否 ready
- developer-facing / operator-facing 条目要带 target user、time to first value、magic moment 和 adoption bottleneck，方便 `cc-plan` 继续做 DX 设计
- `Backlog Meta`、`Queue`、`Dependency Handoff`、`Ready For Req-Plan`、`Parked` 可由 `devflow/roadmap-tracking.json` 回渲染，避免 roadmap truth 和 backlog handoff 分叉

## Review Loop

交付前至少扫一遍：

1. 有没有 placeholder
2. 阶段之间是否有因果链
3. 阶段目标是否真能被当前资源支撑
4. `RM Dependency Graph` 是否只有硬依赖、没有环
5. ready 项是否真能进入 `cc-plan`
6. 本次版本相比上一版到底改了什么
7. 问题路由是否匹配 planning posture / evidence maturity
8. developer-facing / operator-facing item 是否能说明 first value 为什么会发生
9. stage / RM / capability 命名是否沿用项目语言，或明确记录了需要重开的 language / spec / roadmap decision 冲突

## Versioning

- `patch`: 文案澄清、模板说明、小修补
- `minor`: 上下文收集、评审、字段增强，且不破坏既有 tracking 习惯
- `major`: 核心输出契约变化，需要 migration note

## Exit Rule

只有当第一批 requirement 能从阶段主线自然长出来时，`roadmap` 才算完成。
如果用户看完还会问“所以现在到底先做什么”，说明 roadmap 还没写好。
