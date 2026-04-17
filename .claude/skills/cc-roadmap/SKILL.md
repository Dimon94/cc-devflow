---
name: cc-roadmap
version: 3.0.0
description: "Use when defining, resetting, or narrowing project direction, stage order, or backlog priority before a concrete requirement enters the PDCA loop."
triggers:
  - "帮我定路线图"
  - "下一阶段先做什么"
  - "backlog 太乱了"
  - "项目方向散了"
  - "roadmap this project"
  - "what should we build next"
  - "reset the roadmap"
  - "prioritize the backlog"
reads:
  - "PLAYBOOK.md"
  - "CHANGELOG.md"
  - "assets/ROADMAP_TEMPLATE.md"
  - "assets/BACKLOG_TEMPLATE.md"
  - "references/roadmap-dialogue.md"
writes:
  - path: "ROADMAP.md"
    durability: "durable"
    required: true
  - path: "BACKLOG.md"
    durability: "durable"
    required: true
entry_gate:
  - "Read current roadmap, backlog, and surrounding repo context before proposing direction."
  - "Confirm this is a project-direction problem, not a single requirement execution problem."
  - "Do not decompose implementation tasks while the roadmap is still being decided."
exit_criteria:
  - "The next 1-3 stages are frozen with goal, why now, dependencies, exit signal, kill signal, and non-goals."
  - "The first backlog items can naturally enter cc-plan without extra strategic guessing."
  - "The roadmap shows an explicit RM dependency graph so serial blockers and parallel-ready work are obvious."
  - "The user-approved recommendation is explicit and grounded in current evidence."
reroutes:
  - when: "The user is already discussing one concrete requirement, bug, or execution task."
    target: "cc-plan"
recovery_modes:
  - name: "re-scan-context"
    when: "The current direction no longer matches repo reality, roadmap files, or the latest user constraint."
    action: "Reload the roadmap sources, rewrite Context Snapshot, and recompute the recommended route before continuing."
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 4
---

# Roadmap

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，必要时写 migration note，然后检查 `CLAUDE.md`

## Role

`cc-roadmap` 只负责一件事：决定项目接下来 1-3 个阶段该打哪几仗。

它先尽可能收集真实上下文，再逼出真实用户、真实痛点、真实紧迫性，最后把这些现实压成一条能落地、能进入 `cc-plan` 的主线。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `assets/ROADMAP_TEMPLATE.md`
4. `assets/BACKLOG_TEMPLATE.md`
5. `references/roadmap-dialogue.md`

## Use This Skill When

- 新项目刚开始
- 项目做到一半，方向开始发散
- backlog 很多，但主线不清楚
- 你需要决定接下来 1-3 个阶段先做什么

如果用户已经在讨论一个明确 requirement、一个 bug 或一组实现任务，停止留在这里，转去 `cc-plan`。

## Quick Start

如果用户只给了一个模糊问题，先把它归到下面 3 类之一，再继续问：

| 用户信号 | 先读成什么问题 | 默认路线形状 |
|---------|---------------|-------------|
| “不知道下一步做什么” | 主线不清 | `wedge-first` |
| “后面几阶段都会重复碰同一底座” | 底座风险 | `platform-first` |
| “增长/交付/信任卡住了” | 当前最大瓶颈 | `rescue-first` |

先给一个**默认推荐**，再解释为什么，不要把用户扔进开放式战略讨论。

## Harness Contract

- Allowed actions: read current strategy files, repo context, and recent reality; compare route shapes; write only repo-root `ROADMAP.md` and `BACKLOG.md`.
- Forbidden actions: decompose implementation tasks, invent hidden context, or jump into `cc-plan` before the roadmap is approved.
- Required evidence: every stage and backlog item must point back to explicit repo facts, user constraints, or observed market signals.
- Reroute rule: once the conversation collapses to one concrete requirement, stop strategic expansion and hand off to `cc-plan`.

## Entry Gate

1. 如果 repo root 下的 `ROADMAP.md` / `BACKLOG.md` 已存在，先读现状再重写。
2. 先判断这是“项目方向问题”还是“单 requirement 执行问题”。
3. 先做一次上下文扫描，不能跳过现有事实直接写愿景。
4. 方向没被批准前，不准把 roadmap 偷偷下放成实现任务。

## Context Sweep

进入对话前，至少主动收这些上下文：

1. 当前 repo root `ROADMAP.md` / `BACKLOG.md` 的主线、版本、已停放事项。
2. `CLAUDE.md`、`README*`、`TODOS.md`、最近相关 docs / specs / plans。
3. 最近相关提交、当前分支脏状态、正在进行中的 requirement。
4. 真实 forcing functions：deadline、发布窗口、资源上限、依赖、distribution、adoption / trust / delivery 卡点。
5. 当前项目最强的现实证据，以及仍然只能靠假设的空白。

先把这些材料压成一个 `Context Snapshot`，再开始追问用户。

## Session Protocol

1. 先探索上下文，不靠默认上下文注入替代阅读。
2. 先问现实，不先写愿景。
3. 一次只推进一个关键未知点，不要一口气抛一串问题。
4. 先写 `Context Snapshot`、证据、约束、非目标，再讨论阶段。
5. 给出 2-3 种路线图形状，再明确推荐一种，并说明为什么其他路线现在不值得打。
6. 只冻结 1-3 个阶段。每个阶段都必须有 goal、why now、dependencies、exit signal、kill signal、non-goals。
7. 把 `RM` 之间的硬依赖压成显式 dependency graph，并标出 parallel-ready wave；不要把“最好按这个顺序做”伪装成 blocker。
8. backlog 只保留会真的进入下一轮 `cc-plan` 的事项，每项都要带成功信号、下一决策、`Depends On` 与 `Parallel With`。
9. 用户没批准，不进入 `cc-plan`。

## Route Selection Rule

给出 2-3 条路线后，必须明确推荐其中一条。推荐格式至少回答这 4 件事：

1. 为什么这条路线最符合当前证据
2. 为什么另外两条现在不值得先打
3. 这条路线最早会在哪个 signal 上赢
4. 如果这个 signal 没出现，什么时候该止损

推荐话术要像这样：

> Recommendation: `wedge-first`, because the strongest current evidence is demand uncertainty, not platform pain. We should earn the right to build the base layer after Stage 1 proves pull.

不要只写：

- “建议先做 wedge-first”
- “这条更合理”
- “综合来看最优”

## Ask

至少要逼清这 5 件事：

1. 这个项目真正服务谁
2. 用户今天用什么笨办法解决
3. 为什么他们会立刻想要这个东西
4. 最窄但最有穿透力的第一阶段是什么
5. 未来 6-12 个月，产品会长成什么样

同时尽量补齐这些落地上下文：

6. 当前最强证据是什么，哪些只是想象
7. deadline / team / budget / dependency / distribution 的硬约束是什么
8. 当前最大的 adoption、trust、delivery 卡点是什么
9. 这个 roadmap 成功与失败各自用什么信号判断

## Approval Gates

1. 没有 `Context Snapshot`，不准给路线推荐。
2. 没有 2-3 条路线对比，不准直接拍脑袋定主线。
3. 没有 exit signal / kill signal / non-goals，不算阶段冻结。
4. 没有明确成功信号和下一决策，不准把事项放进 `Ready For Req-Plan`。
5. 没有 `RM dependency graph` 或 parallel-ready wave，不准宣称事项可以并发推进。
6. 没有用户批准，不准把 roadmap item 下放到 `cc-plan`。

## Review Loop

写完 repo root `ROADMAP.md` / `BACKLOG.md` 后，至少完成这 6 个检查：

1. Placeholder scan：不能有 TBD、TODO、`[NEEDS CONTEXT]` 之类的逃避词。
2. Evidence scan：每个阶段是否都能指回某个现实证据，而不是空洞愿景。
3. Causality scan：Stage 2 是否真的建立在 Stage 1 的胜利条件之上。
4. Feasibility scan：阶段目标与团队容量、依赖、distribution 约束是否接得上。
5. Graph scan：`Depends On` 是否只包含硬阻塞，图里有没有环，parallel-ready wave 是否真的共享同一前置。
6. Handoff scan：第一批 roadmap item 是否已经自然长成可进入 `cc-plan` 的对象。

## Output

- `ROADMAP.md`
- `BACKLOG.md`

## Good Output

一个高质量 roadmap 交付后，用户应该一眼看懂：

1. 现在先打哪一仗
2. 为什么不是另外两仗
3. 哪个 signal 说明这一仗赢了
4. 哪些 backlog 项已经真的 ready for `cc-plan`
5. 哪些 `RM` 必须串行，哪些已经可以并行开会话

## Versioning

`cc-roadmap` 自身使用 semver：

- `patch`：措辞、模板字段说明、非契约性澄清
- `minor`：新增兼容字段、上下文收集规则、评审规则、输出结构增强
- `major`：改变 `ROADMAP.md` / `BACKLOG.md` 的核心契约、阶段模型或 handoff 预期

每次修改都必须：

1. 更新本文件 frontmatter 的 `version`
2. 更新 `CHANGELOG.md`
3. 如果会影响已有 `ROADMAP.md` / `BACKLOG.md` 使用方式，在 `CHANGELOG.md` 写清 migration note

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 模板：`assets/ROADMAP_TEMPLATE.md`
- 模板：`assets/BACKLOG_TEMPLATE.md`
- 对话骨架：`references/roadmap-dialogue.md`
- 条目定位：`scripts/locate-roadmap-item.sh`
- 进度回写：`scripts/sync-roadmap-progress.sh`
- 版本递增：`scripts/bump-skill-version.sh`

## Exit Criteria

- 中长期方向清楚
- 核心上下文、证据和硬约束已经显式记录
- 阶段目标与优先级清楚
- 第一批 requirement 从 roadmap 里自然长出来
- 下一步唯一答案是把某个 roadmap item 放进 `cc-plan`

## Working Rules

1. 先收上下文，再收意见。
2. 没有现实证据时必须明确写成 assumption，而不是偷偷当事实。
3. repo root `ROADMAP.md` 是方向真相源，repo root `BACKLOG.md` 是进入下一轮规划的缓冲区。
4. 决策理由必须保留下来，方便以后重跑时比较版本差异。
5. 不要为了显得完整而写 6 个阶段，能打赢下一仗比画完整战争图更重要。

## Do Not

- 不在这里拆实现任务
- 不把 roadmap 写成愿望清单
- 不讨论 20 个阶段，只定最重要的 1-3 步
- 不靠默认上下文注入替代思考
- 不把没有证据支撑的猜测包装成战略
- 不让 backlog 变成“以后再说”的垃圾堆

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 路线图对话：`references/roadmap-dialogue.md`
