# Roadmap Playbook

## Core Rules

1. 先读上下文，再问现实，不先写愿景。
2. 一次只推进一个关键未知点。
3. 只定 1-3 个阶段，不写愿望清单。
4. 通过 `roadmap` 只能产出方向，不能偷拆实现任务。
5. 没有证据时写 assumption，不准冒充事实。

## Local Kit

- 生成骨架时用 `assets/ROADMAP_TEMPLATE.md` 和 `assets/BACKLOG_TEMPLATE.md`
- 需要追问脚本时看 `references/roadmap-dialogue.md`
- 需要定位 / 回写条目时用 `scripts/locate-roadmap-item.sh` 和 `scripts/sync-roadmap-progress.sh`
- 变更版本时同步 `CHANGELOG.md`，必要时用 `scripts/bump-skill-version.sh`

## Context Sweep

进入 roadmap 对话前，至少摸清：

1. 现有 `ROADMAP.md` / `BACKLOG.md`
2. `CLAUDE.md`、`README*`、`TODOS.md`
3. 最近相关 docs / specs / plans
4. 最近相关提交、当前工作树状态、正在推进的 requirement
5. 现实 forcing functions：deadline、distribution、资源、依赖、当前卡点

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

## Route Shapes

- `wedge-first`: 用一个极窄切口先打穿真实需求
- `platform-first`: 先搭通后续阶段复用的关键底座
- `rescue-first`: 先解决当前最大的 adoption / trust / delivery 卡点

推荐时必须回答：为什么这条主线比其他两条更值得先打。

## Stage Contract

每个阶段至少要有：

1. `Goal`
2. `Why now`
3. `Dependencies`
4. `Exit signal`
5. `Kill signal`
6. `Non-goals`
7. 可以自然长成下一轮 `req-plan` 的候选事项

## Output Contract

`ROADMAP.md`
- version / skill version / context snapshot / evidence ledger
- 1-3 个阶段
- 每阶段目标
- 每阶段存在原因
- 每阶段 dependencies
- 每阶段 exit signal
- 每阶段 kill signal
- 非目标

`BACKLOG.md`
- 只保留会真的进入下一轮 `req-plan` 的事项
- 每项注明来源阶段、优先级、证据、依赖、当前未知点、下一决策、是否 ready

## Review Loop

交付前至少扫一遍：

1. 有没有 placeholder
2. 阶段之间是否有因果链
3. 阶段目标是否真能被当前资源支撑
4. ready 项是否真能进入 `req-plan`
5. 本次版本相比上一版到底改了什么

## Versioning

- `patch`: 文案澄清、模板说明、小修补
- `minor`: 上下文收集、评审、字段增强，且不破坏既有 tracking 习惯
- `major`: 核心输出契约变化，需要 migration note

## Exit Rule

只有当第一批 requirement 能从阶段主线自然长出来时，`roadmap` 才算完成。
