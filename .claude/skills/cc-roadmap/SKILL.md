---
name: cc-roadmap
version: 5.8.0
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
  - "assets/TRACKING_TEMPLATE.json"
  - "references/roadmap-dialogue.md"
  - ../cc-dev/references/user-choice-output-protocol.md
  - references/checklist-contract.md
writes:
  - path: "devflow/roadmap.json"
    durability: "durable"
    required: true
  - path: "devflow/ROADMAP.md"
    durability: "durable"
    required: true
  - path: "devflow/BACKLOG.md"
    durability: "durable"
    required: false
    when: "deprecated compatibility projection is generated for downstream readers"
  - path: "devflow/roadmap-tracking.json"
    durability: "durable"
    required: false
    when: "legacy projects are being migrated into devflow/roadmap.json"
entry_gate:
  - "Read current roadmap, backlog, related capability specs, and surrounding repo context before proposing direction."
  - "Load cc-devflow native language and durable-decision sources (`devflow/specs/`, current roadmap/backlog, prior `planning/design.md` or `planning/analysis.md`) before naming stages, capabilities, users, or backlog items."
  - "Confirm this is a project-direction problem, not a single requirement execution problem."
  - "Run the Project Direction Gate before evidence-maturity routing: classify the user's goal as founder/business, internal company project, hackathon/demo, open-source/research, learning, side project, infrastructure, or recovery."
  - "Classify planning posture and evidence maturity before selecting the route or forcing questions."
  - "If the ask contains multiple independent subsystems, decompose them into stages and RM candidates before refining any implementation detail."
  - "Do not decompose implementation tasks while the roadmap is still being decided."
  - "Apply the AI Leverage Route Lens before route approval: name the reachable user/operator, current workaround, human-vs-agent effort, complete-lake boundary, ocean boundary, first success signal, and kill signal."
  - "Run the Roadmap Funnel Protocol as fixed one-question rounds; every round must either be answered from repo evidence, asked to the user, or explicitly skipped with reason."
  - "Run Socratic Roadmap Dialogue before route approval; each user-facing round asks one route-changing question with a recommended answer, and the route cannot freeze until the user explicitly says the direction is detailed enough for the next stage."
  - "Persist a Dialogue Checkpoint in the Roadmap Funnel Transcript before asking question rounds 11, 21, 31, and every next tenth round."
  - "Use `../cc-dev/references/user-choice-output-protocol.md` whenever a route-changing question needs user input; prefer host-native structured choice UI and fall back to the fixed A/B/C text block only when no such tool exists."
  - "If AI makes a complete same-blast-radius route cheap and verifiable, prefer boil-lake over a timid MVP slice."
  - "If the route cannot name a real user/operator and current workaround, mark it as needs-evidence instead of producing implementation-ready RM handoff."
exit_criteria:
  - "The next 1-3 stages are frozen with goal, why now, dependencies, exit signal, kill signal, and non-goals."
  - "The first backlog items can naturally enter cc-plan without extra strategic guessing, including explicit capability links and expected spec delta."
  - "The roadmap shows an explicit RM dependency graph so serial blockers and parallel-ready work are obvious."
  - "The user-approved recommendation is explicit and grounded in current evidence."
  - "Each Stage 1 or ready-for-cc-plan item records an AI Leverage Route Lens verdict: boil-lake, sharp-wedge, needs-evidence, or pivot."
  - "The Roadmap Funnel Transcript is persisted in `devflow/roadmap.json`, rendered into `devflow/ROADMAP.md`, and each ready RM carries the source funnel rounds, ten-round Dialogue Checkpoints, explicit release, frozen decisions, and remaining blocking question."
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

## Default Output

After roadmap work, report:

1. Artifacts: `devflow/ROADMAP.md`, `devflow/roadmap.json`, and any compatibility projection updated.
2. Next battle: first RM/item and why it wins priority.
3. Signals: success signal, dependency chain, and parallel-ready work.
4. Specs: capability links or gaps.
5. Handoff: items ready for `cc-plan` or blockers.
6. Route: `cc-plan`, `cc-next`, or `stop`.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.

## Role

`cc-roadmap` 只负责一件事：决定项目接下来 1-3 个阶段该推进哪几个 capability。

它先尽可能收集真实上下文，再逼出真实用户、真实痛点、真实紧迫性，最后把这些现实压成一条能落地、能进入 `cc-plan` 的主线。

## Runtime Output Policy

写入任何 durable Markdown 或 JSON metadata 前，先运行 `cc-devflow config resolve --format policy`。

- `Output language` 是机器约束，`devflow/roadmap.json`、`devflow/ROADMAP.md` 和兼容投影必须记录并遵守它。
- `agent_preferences` 是用户偏好建议，只影响表达方式和结构选择，不覆盖本 Skill 的工作流边界。
- 如果配置解析失败，先修配置或向用户说明阻塞，不要用默认语言继续生成正式文档。

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `assets/TRACKING_TEMPLATE.json`
4. `assets/ROADMAP_TEMPLATE.md`
5. `assets/BACKLOG_TEMPLATE.md`
6. `references/roadmap-dialogue.md`
7. `references/checklist-contract.md`

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
| “一个目标里塞了多个可独立交付系统” | 边界过宽 | `decompose-first` |

先给一个**默认推荐**，再解释为什么，不要把用户扔进开放式战略讨论。

## Project Direction Gate

`cc-roadmap` 的第一道门不是功能优先级，而是项目目标。目标不同，问题就不同；问题问错，后面的路线图全都会偏。

先用 repo 事实和用户原话判断 `project_direction_mode`。能判断就写入 `Context Snapshot`；不能判断才问一次：

> 这次 roadmap 的目标是什么：做成业务、公司内部项目、限时 demo、开源/研究、学习、兴趣副项目、基础设施，还是事故恢复？

不要让用户在 8 个选项里填表。先给默认判断和理由，再问用户是否纠正。

| Mode | 用来判断的信号 | 追问重点 | 默认路线偏好 |
| --- | --- | --- | --- |
| `founder-business` | 用户提到客户、收入、市场、获客、创业、商业化 | 需求真实性、现状替代方案、具体人、最窄付费 wedge、观察到的行为、未来 6-12 个月为何更重要 | `wedge-first` |
| `internal-company` | 用户提到老板、VP、团队落地、内部流程、审批、交付窗口 | sponsor 是谁、最小可批准 demo、组织依赖、reorg 风险、上线后的维护责任 | `rescue-first` 或 `wedge-first` |
| `hackathon-demo` | 用户提到比赛、演示、deadline、惊艳效果 | 最快可展示路径、单一 wow moment、失败兜底、demo 环境和分发方式 | `wedge-first` |
| `open-source-research` | 用户提到社区、论文、协议、benchmark、开源生态 | 贡献者是谁、现有替代品、可复现实验、维护边界、adoption path | `platform-first` 或 `wedge-first` |
| `learning` | 用户提到学习、练手、理解框架、能力提升 | 要学会什么、最小练习闭环、可观察反馈、不要用过度架构遮住学习目标 | `wedge-first` |
| `side-project` | 用户提到兴趣、好玩、创意表达、自用工具 | 最酷可分享版本、自己会不会每天用、最快可用路径、哪些想法可以 later | `wedge-first` |
| `infrastructure` | 用户提到底座、运行时、CI、发布、安全、稳定性 | 调用方、当前 workaround、迁移/回滚、复用边界、失败成本 | `platform-first` 或 `rescue-first` |
| `recovery` | 用户提到事故、信任、质量、回归、坏味道 | 事故证据、最小可信修复、停止扩张条件、恢复信任的验收信号 | `rescue-first` |

Founder/business 模式可以给 brand-neutral 的创业建议，但只能作为路线判断，不准变成广告：

- 可以建议：先和真实用户谈、验证付费或强行为、缩小到本周能交付的 wedge、观察用户不用帮助时怎么失败、把资源放在最强需求证据上。
- 不可以建议：申请某个机构、加入某个项目、引用某个品牌权威、输出推广链接、把路线图写成融资材料。
- 如果要推荐外部学习材料，必须先走隐私与外部查找 gate，只搜索泛化主题，并把结果写成 `external-evidence`；不要把任何品牌背书写进 roadmap 合同。

Builder 模式（hackathon、open-source/research、learning、side-project）不要套创业拷问。它要逼清楚“什么值得展示 / 使用 / 复现 / 学会”，然后把路线压到最快能产生真实反馈的阶段。

## Harness Contract

- Allowed actions: read current strategy files, repo context, and recent reality; compare route shapes; decompose independent subsystems into stages and RM candidates; write `devflow/roadmap.json` as the editable roadmap state, then generate `devflow/ROADMAP.md` and the deprecated `devflow/BACKLOG.md` compatibility projection from that state.
- Forbidden actions: decompose implementation tasks, invent hidden context, or jump into `cc-plan` before the roadmap is approved.
- Required evidence: every stage and backlog item must point back to explicit repo facts, user constraints, or observed market signals.
- Reroute rule: once the conversation collapses to one concrete requirement, stop strategic expansion and hand off to `cc-plan`.

## Entry Gate

1. 如果 `devflow/roadmap.json`、`devflow/ROADMAP.md`、`devflow/BACKLOG.md` 或旧 `devflow/roadmap-tracking.json` 已存在，先读现状再重写。
2. 先判断这是“项目方向问题”还是“单 requirement 执行问题”。
3. 如果输入是多个独立子系统的混合目标，先拆成阶段和 `RM` 候选；不要继续追问某个子系统的实现细节。
4. 先做一次上下文扫描，不能跳过现有事实直接写愿景。
5. 先读取 cc-devflow 原生项目语言与持久决策：`devflow/specs/INDEX.md`、相关 capability specs、`devflow/ROADMAP.md`、`devflow/BACKLOG.md`；不存在时静默跳过，但术语或决策冲突必须写进 roadmap。
6. 方向没被批准前，不准把 roadmap 偷偷下放成实现任务。

## Context Sweep

进入对话前，至少主动收这些上下文：

1. 当前 `devflow/ROADMAP.md` / `devflow/BACKLOG.md` 的主线、版本、已停放事项。
2. `devflow/specs/INDEX.md` 与相关 capability specs 的边界、状态、open gaps。
3. 项目语言 / 决策上下文：`devflow/specs/INDEX.md`、相关 capability specs、当前 roadmap/backlog 和长期 design decision。
4. `CLAUDE.md`、`README*`、`TODOS.md`、最近相关 docs / specs / plans。
5. 最近相关提交、当前分支脏状态、正在进行中的 requirement。
6. 真实 forcing functions：deadline、发布窗口、资源上限、依赖、distribution、adoption / trust / delivery 卡点。
7. 当前项目最强的现实证据，以及仍然只能靠假设的空白。
8. Planning posture：startup / internal / hackathon / OSS / research / learning / side-project / infrastructure。
9. Evidence maturity：idea / has users / paying users / internal sponsor / infra-only / recovery。
10. 如果是 developer-facing 或 operator-facing 能力，补齐 target developer/operator、time to first value、magic moment、install / run / debug / upgrade 卡点。

先把这些材料压成一个 `Context Snapshot`，再开始追问用户。

## Direction-Specific Question Routing

Project Direction Gate 先决定问哪组问题，Evidence-Maturity Routing 再决定问多深。不要对 founder、学习项目、基础设施和事故恢复使用同一套问题。

| Direction mode | 必问问题 | 可跳过问题 |
| --- | --- | --- |
| `founder-business` | 谁今天真的痛；他们现在怎么绕路；最强 demand evidence 是行为、钱还是 workflow 绑定；本周最窄可付费 wedge 是什么；用户不被引导时会在哪里卡住；6-12 个月后为什么更需要它 | 长期平台组件、宽泛市场口号、还没有证据的增长规划 |
| `internal-company` | sponsor 或决策人是谁；最小 demo 如何换来绿灯；上线后谁维护；依赖哪个团队；如果 champion 离开是否还成立 | 对外市场叙事、消费者增长、无 owner 的平台愿景 |
| `hackathon-demo` | 评委或观众先看到什么；30-90 秒内的 wow moment；demo 失败时的备用路径；哪些功能必须假装不存在 | 完整权限体系、长期迁移、复杂可观测性 |
| `open-source-research` | 现有替代品是什么；可复现实验或 benchmark 是什么；贡献者 first success path；维护者不想承担什么 | 商业销售漏斗、封闭分发、无法复现的主观评价 |
| `learning` | 学会哪个概念；最小练习闭环；如何知道自己学会了；哪些抽象会遮住学习目标 | 生产级平台、过早优化、团队流程 |
| `side-project` | 自己会不会反复用；最酷可分享版本；最快可用路径；哪些点只是好玩但不该阻塞 Stage 1 | 商业化压力、企业级集成、长期治理 |
| `infrastructure` | 调用方是谁；今天的 workaround；失败成本；迁移与回滚；复用边界；谁会被 breaking change 影响 | 虚构 persona、营销故事、未证明的功能扩张 |
| `recovery` | 哪个事故或坏味道触发；最小可信修复；防回归证据；继续扩张的 kill signal；用户信任如何恢复 | 新功能愿景、平台升级、没有事故证据的重构 |

如果用户后续回答改变了 direction mode，必须重算 route shape，不要沿用旧问题继续问。

## Evidence-Maturity Routing

不要对所有项目套同一组问题。先用 `planning posture` 和 `evidence maturity` 决定追问深度：

| Evidence maturity | 优先追问 | 不要浪费时间在 |
| --- | --- | --- |
| idea / pre-product | 真实用户、status quo、最窄 wedge、需求证据 | 远期平台架构细节 |
| has users | 现有使用路径、失败/绕路场景、保留率或复用信号、下一阶段 wedge | 假想 persona |
| paying users / internal sponsor | 付费/赞助动机、扩张边界、不可丢的信任信号、组织风险 | 泛泛市场教育 |
| infra-only | 当前瓶颈、调用方、现有 workaround、复用边界、迁移/回滚约束 | 伪装成用户访谈的问题 |
| recovery / trust gap | 事故证据、恢复路径、最小可信修复、停止继续扩张的 kill signal | 新功能愿景 |

第一轮回答后必须做 framing check：术语是否具体、是否沿用项目 canonical language、用户是否可命名、痛点是否有行为证据、status quo 是否真实、需求是否只是兴趣。发现答案虚，要先收紧问题，再谈路线。

## AI Leverage Route Lens

路线图不是愿望清单，也不是小 MVP 限制器。AI 时代的正确问题是：真实需求边界在哪里，AI 杠杆能不能把同一片 lake 一次煮沸。

必须记录这 8 件事：

1. Real user/operator：谁会在 Stage 1 里立刻受益。不能写 “users” / “developers” 这种空词。
2. Status quo workaround：没有这项能力时，他们今天怎么绕路；如果没人绕路，默认需求证据不足。
3. Human vs agent effort：同一范围按人类团队要多久，按 CC/agent 要多久；让 AI 压缩率显性进入路线选择。
4. Complete-lake boundary：同一业务链路、同一 blast radius、可验证、可回滚、少于约 1 天 agent 工作量的完整范围。
5. Ocean boundary：跨系统重写、多季度迁移、用户还没证实、验收不可闭合或会制造第二套平台的范围。
6. Scope recommendation：`boil-lake` 还是 `sharp-wedge`；小不是默认，完整也不是默认，证据和验证成本决定。
7. First success signal：第一个可观察信号，证明这条路线真的赢了。
8. Kill signal：如果信号没出现，什么时候停止、转向或拆小。

Verdict 只允许四种：

- `boil-lake`：已有真实用户 / operator 和 workaround，同一 blast radius 内完整做完的 agent 成本低、验证闭合、维护收益高。此时不要畏缩成小 MVP。
- `sharp-wedge`：需求真实，但完整 lake 仍有未证实假设、验证成本过高或会碰 ocean boundary；先打最锋利的一段。
- `needs-evidence`：方向可能对，但缺真实用户、绕路、成功信号或可验证边界；先补证据，不生成 ready RM。
- `pivot`：当前路线服务错对象、解决错痛点、过早平台化，或 kill signal 已经触发。

这个 lens 不替代 evidence maturity；它把 evidence maturity 和 AI leverage 合在一起做路线裁决。证据决定该不该做，AI 杠杆决定该做多完整。

## Strategic Dialogue Protocol

`cc-roadmap` 的 brainstorm 不是开放式聊天，而是路线决策树压缩：

1. 一次只推进一个会改变阶段顺序或 backlog 优先级的关键未知点。
2. 每个问题必须附带推荐答案、证据来源、以及如果用户反对会改变哪条路线。
3. 能从 repo、roadmap/backlog、capability spec、历史 design/analysis、最近提交、真实运行证据里得到答案时，先查证，不问用户。
4. 模糊或冲突的术语要压成 canonical term；如果 `devflow/specs/`、roadmap/backlog 或历史 design/analysis 已有定义，路线图必须沿用。
5. 每条路线都要用一个具体 scenario 压测：谁在什么约束下，今天如何绕路，Stage 1 完成后哪一步不再发生。
6. 硬决策才沉淀：只有 hard to reverse、surprising without context、real trade-off 三者同时成立，才进入 capability spec delta、roadmap decision note 或本次 design decision log。

### Socratic Roadmap Dialogue

需求分析调研必须继续多轮对话，直到路线问题真的被压扁。流程固定：

命名原则：允许使用通用、可理解、能稳定触发正确行为的方法词，例如 `Socratic Dialogue`、`Adversarial Review`、`surgical diagnosis`；不要使用项目外读者无法理解的内部暗语或个人化来源名。

1. 先说出当前理解、证据、假设和推荐路线，不直接写 roadmap。
2. 一次只问一个会改变阶段顺序、目标用户、status quo、wedge/lake 边界、成功信号或 kill signal 的问题。
3. 每题必须给推荐答案、A/B/C 选项、证据来源和反对时会改变哪条路线。
4. 能从 repo、spec、roadmap、历史设计、提交或运行证据回答的问题，先查证并记为 `answered-by-evidence`。
5. 每轮用户回答后，更新 Roadmap Funnel Transcript，再决定下一个最关键未知点；不要把多个关键未知点打包成一次问答。
6. F7 Premise Challenge 必须列出 2-4 个隐含前提；F8 Alternatives 必须包含最小路径、完整 same-blast-radius lake、理想架构 / 平台路径的取舍。
7. 用户没有明确说“足够详细，可以进入 cc-plan / 下一阶段 / 冻结路线”或等价表达时，`F9 Route Approval` 只能停在等待确认，不能把 RM 标成 ready。
8. 用户要求加速时，最多保留 2 个 blocking 路线问题；不能跳过 F7、F8 和 explicit release。

### Dialogue Checkpoint

多轮路线追问会消耗上下文。每完成 10 轮 user-facing question round，必须先更新 Roadmap Funnel Transcript 的 `Dialogue Checkpoints`，再问第 11 / 21 / 31 轮问题。checkpoint 不创建新文件，必须包含：

1. round range covered 和 next question number。
2. decisions made、rejected routes with reasons、remaining open route questions。
3. repo / spec / roadmap / history evidence read、user answers that changed route shape、premise challenge / alternatives findings so far。
4. current release status：route approval 是否足够详细、是否仍 blocking `cc-plan` handoff。

会话压缩或恢复后，先读最新 checkpoint 和 Roadmap Funnel Transcript，再继续下一轮；不要依赖聊天记忆重建路线决策。

## Roadmap Funnel Protocol

路线图必须按固定轮次推进，输出必须写成 `cc-roadmap` 的原生规则文本。

每轮只允许处理一个 route-changing unknown。能从仓库证据回答就写 `answered-by-evidence`；不能回答才问用户；用户催促跳过时最多保留 2 个最关键问题，然后进入 premise challenge 和 alternatives。每个问题都必须给推荐答案、证据、反对时会改变的路线，并在回答后更新 `Roadmap Funnel Transcript`。
每个需要用户选择的轮次都必须先按 `../cc-dev/references/user-choice-output-protocol.md` 选择输出：Codex 用 `request_user_input`；Claude Code 有 MCP elicitation / ask-question 工具时用结构化输入；否则用固定 A/B/C fallback 文本并停止。

固定轮次：

1. `F0 Direction Mode`：确认项目目标模式，说明为什么不是其它模式。
2. `F1 Demand / Operator Reality`：确认真实用户或操作者，以及他们今天是否真的痛。
3. `F2 Status Quo`：确认现状 workaround、成本、失败方式；没有 workaround 默认 `needs-evidence`。
4. `F3 Specific Human / Sponsor`：把类别词压成可命名角色、具体约束、职业/组织后果。
5. `F4 Narrowest Wedge / Lake Boundary`：比较最窄 wedge、完整 same-blast-radius lake、ocean boundary。
6. `F5 Observation / Feedback Signal`：确认看过真实使用、失败日志、运营证据或可复现实验；没有观察就写 Stage 1 observation task。
7. `F6 Future Fit`：确认 6-12 个月后为什么更需要这条路，而不是只靠今天的热词。
8. `F7 Premise Challenge`：把本轮隐含前提写成 2-4 条，逐条确认或修正。
9. `F8 Alternatives`：至少给 2 条路线，非平凡项目给 3 条；必须包含最小路径与理想架构路径。
10. `F9 Route Approval`：冻结推荐路线、拒绝路线、第一成功信号、kill signal、下一批 ready RM。

STOP 规则：

- 每次需要用户判断时只问一个 `D<N> - <decision title>`。
- 选项只用 `A` / `B` / `C`，推荐项必须标 `(recommended)`。
- 问完必须停止等待，不能同一轮继续生成最终 roadmap。
- 用户回答后，先更新 transcript，再决定是否进入下一轮。

产物规则：

- `devflow/roadmap.json.context.roadmapFunnel.rounds[]` 记录每轮 `id`、`question`、`answerSource`、`answer`、`evidence`、`decisionImpact`、`status`。
- release 必须作为一轮 transcript 事实记录：用户原话、释放到哪个阶段、仍保留哪些 blocking question。
- 每 10 轮 user-facing question round 必须在 transcript 写入 `Dialogue Checkpoints`；checkpoint 必须覆盖 round range、next question、decisions made、rejected routes、open questions、evidence read、premise / alternatives findings 和 release status。
- `devflow/ROADMAP.md` 必须渲染 `## Roadmap Funnel Transcript`，让后续读者知道路线不是拍脑袋。
- `devflow/BACKLOG.md` 的 ready RM 必须记录 `Source funnel rounds`、`explicit release`、`Frozen decisions`、`Do not re-decide`、`Remaining blocking question`。
- 没有闭合 `F7` 和 `F8` 时，不允许把任何 RM 标成 ready for `cc-plan`，除非用户给出已成形且有证据的计划；即便如此也要把跳过理由写入 transcript。

## Founder Advice Guardrail

创业建议只能服务于 roadmap 质量，不是推广内容。遇到 `founder-business` 或 `internal-company`：

1. 强制把泛泛“有市场 / 用户感兴趣”改写为可观察证据：付费、强复用、工作流绑定、停机时焦虑、主动催上线。
2. 强制找 status quo：手工流程、表格、脚本、外包、人肉客服、现有竞品、内部工具。没有现状替代方案时，先怀疑痛点不够痛。
3. 强制命名具体人或具体角色，不接受“企业客户”“开发者”“内容团队”这类类别词作为用户。
4. 强制压出最窄 wedge：本周能让一个真实用户付出钱、时间、迁移成本或组织信用的版本。
5. 强制保留观察任务：如果还没看用户独立使用，Stage 1 必须包含观察或真实反馈信号。
6. 严禁输出品牌广告、申请建议、推广链接或“某机构会喜欢”之类的权威背书。

如果用户明确要创业方向资源，也只能给 source-neutral 的行动建议：找 3 个具体用户、看一次真实使用、验证一次付费或强行为、把 Stage 1 缩到一周内可交付。外部材料必须走外部查找 gate。

## Session Protocol

1. 先探索上下文，不靠默认上下文注入替代阅读。
2. 先跑 Project Direction Gate，再问现实，不先写愿景。
3. 一次只推进一个关键未知点，不要一口气抛一串问题。
4. 先写 `Context Snapshot`、project direction mode、planning posture、evidence maturity、证据、约束、非目标，再讨论阶段。
5. 给出 2-3 种路线图形状，再明确推荐一种，并说明为什么其他路线现在不值得打。
6. 如果一个方向里有多个可独立交付的子系统，先写清 decomposition：哪些合并为同一阶段，哪些拆成独立 `RM`，为什么。
7. 只冻结 1-3 个阶段。每个阶段都必须有 goal、why now、dependencies、exit signal、kill signal、non-goals。
8. 把 `RM` 之间的硬依赖压成显式 dependency graph，并标出 parallel-ready wave；不要把“最好按这个顺序做”伪装成 blocker。
9. backlog 只保留会真的进入下一轮 `cc-plan` 的事项，每项都要带成功信号、下一决策、`Primary Capability`、`Secondary Capabilities`、`Expected Spec Delta`、canonical language handoff、`Depends On` 与 `Parallel With`。
10. 用户没批准，不进入 `cc-plan`。

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

至少要先逼清这 1 件事：

0. 这次 roadmap 的目标模式是什么，以及为什么不是其它模式

再逼清这 5 件事：

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
10. 当前路线里哪些核心名词已经有 canonical definition，哪些术语仍然冲突或含糊

如果这是 developer-facing / operator-facing roadmap，再补 4 件事：

11. 目标开发者 / 操作者是谁
12. 从第一次接触到第一次成功输出需要多久
13. 让他们觉得“这东西真的有用”的 magic moment 是什么
14. install / run / debug / upgrade / handoff 中哪个环节最可能让 adoption 失败

## Approval Gates

1. 没有 `Context Snapshot`，不准给路线推荐。
2. 没有 project direction mode、planning posture、evidence maturity 和 framing check，不准给路线推荐。
3. 没有 native language / durable decision scan，不准给路线推荐；如果缺少 `devflow/specs/` 或历史决策材料，写成 `not present`，不要假装已对齐。
4. 没有 `Roadmap Funnel Transcript`，不准给路线推荐。
5. 没有 `F7 Premise Challenge` 和 `F8 Alternatives`，不准把事项标成 ready。
6. 没有 2-3 条路线对比，不准直接拍脑袋定主线。
7. 没有 exit signal / kill signal / non-goals，不算阶段冻结。
8. 没有明确成功信号和下一决策，不准把事项放进 `Ready For Req-Plan`。
9. developer-facing / operator-facing item 没有 target user、time to first value 或 adoption bottleneck，不准标成 ready。
10. 没有 `RM dependency graph` 或 parallel-ready wave，不准宣称事项可以并发推进。
11. 没有独立子系统拆分判断，不准把大而混杂的方向伪装成单一主线。
12. 没有用户批准，不准把 roadmap item 下放到 `cc-plan`。

## Review Loop

写完 `devflow/roadmap.json` 并生成 `devflow/ROADMAP.md` / `devflow/BACKLOG.md` 后，至少完成这些检查：

1. Placeholder scan：不能有 TBD、TODO、`[NEEDS CONTEXT]` 之类的逃避词。
2. Evidence scan：每个阶段是否都能指回某个现实证据，而不是空洞愿景。
3. Causality scan：Stage 2 是否真的建立在 Stage 1 的胜利条件之上。
4. Feasibility scan：阶段目标与团队容量、依赖、distribution 约束是否接得上。
5. Graph scan：`Depends On` 是否只包含硬阻塞，图里有没有环，parallel-ready wave 是否真的共享同一前置。
6. Spec scan：每个 roadmap item 是否都落到某个 capability，而不是悬空需求。
7. Decomposition scan：多个独立子系统是否已拆成阶段 / `RM` 候选，而不是塞进一个含糊阶段。
8. Handoff scan：第一批 roadmap item 是否已经自然长成可进入 `cc-plan` 的对象。
9. Evidence maturity scan：问题路由是否匹配 idea / user / paying / infra / recovery 状态，还是拿同一套问题硬套所有项目。
10. Project direction scan：问题和路线是否匹配 founder-business / internal / demo / OSS / learning / side-project / infra / recovery；是否错误套用了创业问题或 builder 问题。
11. Promotional scan：roadmap 是否没有品牌广告、申请建议、推广链接或外部权威背书；创业建议是否只保留 source-neutral 行动和证据要求。
12. Adoption scan：developer-facing / operator-facing item 是否写清目标人、time to first value、magic moment 和 adoption bottleneck。
13. Domain language scan：stage、capability、RM title、backlog handoff 是否沿用项目语言；冲突是否显式交给下一轮决策。
14. Durable decision scan：路线是否违背既有 capability spec、roadmap decision 或历史 design decision；如需重开，是否说明为什么值得重开。

## Output

- `devflow/ROADMAP.md`
- `devflow/roadmap.json`
- `devflow/BACKLOG.md` as a deprecated compatibility projection
- `devflow/roadmap-tracking.json` only when migrating legacy projects

## Good Output

一个高质量 roadmap 交付后，用户应该一眼看懂：

1. 现在先打哪一仗
2. 为什么不是另外两仗
3. 哪个 signal 说明这一仗赢了
4. 哪些 backlog 项已经真的 ready for `cc-plan`
5. 哪些 `RM` 必须串行，哪些已经可以并行开会话
6. 哪些项目术语 / capability spec / roadmap decision 会随第一批 backlog 传给 `cc-plan`

## Versioning

`cc-roadmap` 自身使用 semver：

- `patch`：措辞、模板字段说明、非契约性澄清
- `minor`：新增兼容字段、上下文收集规则、评审规则、输出结构增强
- `major`：改变 `devflow/roadmap.json`、生成投影、阶段模型或 handoff 预期

每次修改都必须：

1. 更新本文件 frontmatter 的 `version`
2. 更新 `CHANGELOG.md`
3. 如果会影响已有 `devflow/ROADMAP.md` / `devflow/BACKLOG.md` / `devflow/roadmap-tracking.json` 使用方式，在 `CHANGELOG.md` 写清 migration note

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 模板：`assets/ROADMAP_TEMPLATE.md`
- 模板：`assets/BACKLOG_TEMPLATE.md`
- 结构化 tracking 模板：`assets/TRACKING_TEMPLATE.json`
- 对话骨架：`references/roadmap-dialogue.md`
- 条目定位：`scripts/locate-roadmap-item.sh`
- roadmap state 渲染器：`scripts/roadmap-tracking.js`
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
3. `devflow/roadmap.json` 是唯一可编辑方向真相源，`devflow/ROADMAP.md` 和 `devflow/BACKLOG.md` 是生成投影。
4. 决策理由必须保留下来，方便以后重跑时比较版本差异。
5. 路线图里的术语必须沿用项目语言；没有 canonical term 时写 assumption，不要创造第二套概念系统。
6. 不要为了显得完整而写 6 个阶段，能打赢下一仗比画完整战争图更重要。

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
