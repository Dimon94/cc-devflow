---
name: cc-roadmap
version: 5.9.0
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
  - "The first backlog items can naturally enter cc-plan without extra strategic guessing, including explicit capability links, expected spec delta, and review gate hints."
  - "The roadmap shows an explicit RM dependency graph so serial blockers and parallel-ready work are obvious."
  - "The user-approved recommendation is explicit and grounded in current evidence."
  - "Each Stage 1 or ready-for-cc-plan item records an AI Leverage Route Lens verdict: boil-lake, sharp-wedge, needs-evidence, or pivot."
  - "The Roadmap Funnel Transcript is persisted in `devflow/roadmap.json`, rendered into `devflow/ROADMAP.md`, and each ready RM carries the source funnel rounds, ten-round Dialogue Checkpoints, explicit release, frozen decisions, review gate hints, and remaining blocking question."
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

`cc-roadmap` 只负责一件事：决定项目接下来 1-3 个阶段该推进哪几个 capability。它先收集真实上下文，再逼出真实用户、真实痛点、真实紧迫性，最后把现实压成能进入 `cc-plan` 的主线。

## Runtime Output Policy

写入任何 durable Markdown 或 JSON metadata 前，先运行 `cc-devflow config resolve --format policy`。

- `Output language` 是机器约束，`devflow/roadmap.json`、`devflow/ROADMAP.md` 和兼容投影必须记录并遵守它。
- `agent_preferences` 是用户偏好建议，只影响表达方式和结构选择，不覆盖本 Skill 的工作流边界。
- 如果配置解析失败，先修配置或向用户说明阻塞，不要用默认语言继续生成正式文档。

## Read First

1. `references/checklist-contract.md`
2. `references/roadmap-dialogue.md`

## Progressive Disclosure

入口只保留路线图门禁。详细 project direction modes、Roadmap Funnel F0-F9、AI Leverage Route Lens、Founder Advice Guardrail、route shapes、question rules、approval gates 和 review scans 都在 `references/roadmap-dialogue.md`。

按需打开：

- `PLAYBOOK.md`：复杂路线、迁移、示例或恢复旧 roadmap 时。
- `assets/TRACKING_TEMPLATE.json` / `assets/ROADMAP_TEMPLATE.md` / `assets/BACKLOG_TEMPLATE.md`：写 durable roadmap state 或生成投影前。
- `CHANGELOG.md`：修改本 skill 或判断版本迁移时。
- `../cc-dev/references/user-choice-output-protocol.md`：需要 route-changing 用户选择时。

## Entry Gate

1. 如果 `devflow/roadmap.json`、`devflow/ROADMAP.md`、`devflow/BACKLOG.md` 或旧 `devflow/roadmap-tracking.json` 已存在，先读现状再重写。
2. 先判断这是“项目方向问题”还是“单 requirement 执行问题”。
3. 如果输入是多个独立子系统的混合目标，先拆成阶段和 `RM` 候选；不要继续追问某个子系统的实现细节。
4. 做 `Context Snapshot`：当前 roadmap/backlog、capability specs、历史 design/analysis、近期提交、forcing functions、项目语言和 durable decisions。
5. 跑 Project Direction Gate、Evidence-Maturity Routing、AI Leverage Route Lens 和 Roadmap Funnel F0-F9。
6. 每轮只处理一个 route-changing unknown；repo 证据能回答的先回答，不能回答才问用户。
7. 每 10 轮 user-facing question round 写 Dialogue Checkpoint。
8. 方向没被批准前，不准把 roadmap 偷偷下放成实现任务。

## Roadmap Contract

Allowed: read strategy files and repo reality, compare route shapes, decompose independent subsystems, write `devflow/roadmap.json`, then generate `devflow/ROADMAP.md` and deprecated compatibility `devflow/BACKLOG.md`.

Forbidden: decompose implementation tasks, invent hidden context, output promotional brand advice, or jump into `cc-plan` before route approval.

Every stage records goal, why now, dependencies, exit signal, kill signal, non-goals, evidence, AI Leverage verdict, and dependency graph. Backlog only contains items that can enter `cc-plan` without strategic guessing.

Route recommendation must compare 2-3 shapes and say why the recommended one fits current evidence, why the others wait, which signal wins earliest, and when to stop or pivot.

## Review Loop

After writing `devflow/roadmap.json` and generated projections, run the scans in `references/roadmap-dialogue.md`: placeholder, evidence, causality, feasibility, graph, spec, decomposition, handoff, evidence maturity, project direction, promotional, adoption, domain language, and durable decision.

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
