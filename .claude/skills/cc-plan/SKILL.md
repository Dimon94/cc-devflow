---
name: cc-plan
version: 3.17.0
description: Use when a requirement, roadmap item, or bug needs scope clarification, design decisions, and executable task breakdown before coding starts.
triggers:
  - 帮我规划这个需求
  - 先别写代码先定方案
  - 这个 bug 边界不清
  - 拆一下任务
  - plan this requirement
  - scope this bug
  - turn this into tasks
reads:
  - PLAYBOOK.md
  - assets/TASKS_TEMPLATE.md
  - references/planning-contract.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - ../cc-dev/scripts/detect-worktree-state.sh
  - ../cc-dev/scripts/prepare-change-worktree.sh
  - ../cc-dev/scripts/ensure-work-branch.sh
  - ../cc-roadmap/scripts/locate-roadmap-item.sh
  - ../cc-roadmap/scripts/sync-roadmap-progress.sh
  - ../cc-dev/references/user-choice-output-protocol.md
  - references/checklist-contract.md
writes:
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: true
effects:
  - roadmap progress sync when a source item exists
  - Git commit after the Plan stage is complete
entry_gate:
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require next-change-key config` before workflow commands.
  - Assign a canonical REQ/FIX change key through `next-change-key` before writing `task.md`.
  - Detect the current Git surface with `../cc-dev/scripts/detect-worktree-state.sh` before preparing the change worktree.
  - Prepare an isolated change worktree immediately after the change key exists; keep the main checkout on `main`.
  - Enforce the Worktree Branch Contract inside the returned change worktree before writing `task.md`.
  - Read repo evidence before asking the user: roadmap handoff, specs, relevant code/tests/docs, recent commits, and existing task truth when present.
  - Run the planning flow before task generation: product/creative discovery, requirement reality, system shape, interface/data contract, abstraction boundary, execution architecture, task contract, Second-Move Review, and final approval.
  - Run the Socratic Dialogue Protocol after evidence gathering and before final approval; do not freeze task blocks until the user explicitly says the requirement and technical plan are detailed enough for the next stage.
  - Persist a Dialogue Checkpoint in `task.md#Contract Summary` before asking question rounds 11, 21, 31, and every next tenth round.
  - Ask with the Decision Question Protocol when the answer changes scope, design, implementation boundary, or verification.
  - Use `../cc-dev/references/user-choice-output-protocol.md` for every user-facing decision question; prefer Codex `request_user_input` or Claude Code structured input when available, and use the fixed A/B/C text block only as fallback.
exit_criteria:
  - "`task.md#Contract Summary` states the approved solution, non-goals, frozen decisions, work branch, user stories, decision questions, planning-flow results, review gate, verification expectations, and open assumptions."
  - "`task.md#Contract Summary` contains an ASCII Branch Chain Analysis for requirement impact and business impact, tracing upstream sources, current code path, deepest affected layer, downstream blast radius, and prompt/provider contracts when involved; tree connector characters stay ASCII while node text follows the configured output language."
  - "`task.md` contains executable task blocks generated from `assets/TASKS_TEMPLATE.md`."
  - "Non-trivial plans complete product/creative discovery before engineering design: worth doing, desired product shape, narrowest wedge, 10x/better version, and do-nothing consequence."
  - "Non-trivial plans complete Second-Move Review before approval: first good move, simpler move, better architecture, selected move, and rejected tradeoff."
  - "`task.md#Contract Summary` records the Socratic Dialogue: repo-answered questions, user-answered rounds, ten-round Dialogue Checkpoints, the three hidden assumptions challenged, overengineering/code-review findings, and the explicit user release to generate tasks."
  - "User decisions that changed the plan were asked as D<N> questions and recorded in `task.md`."
  - "No process file is created beyond `task.md`."
  - "Source roadmap progress is synced or explicitly skipped in the final response."
  - "Plan-stage changes are committed to Git before handing off to `cc-do`."
reroutes:
  - when: The discussion is still project direction or stage order instead of one requirement.
    target: roadmap
  - when: The plan is already approved and tasks are frozen.
    target: cc-do
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 6
---

# CC-Plan

## Read First

1. `references/checklist-contract.md`

`cc-plan` 是 PDCA 的 `Plan`。它只产出一份 durable 任务合同：

- `devflow/changes/<change-key>/task.md`

不要生成额外过程文件。Git commit 是阶段历史，`task.md` 是任务真相。

## Default Output

After `task.md` is frozen, keep the response to:

1. Change: REQ/FIX key, worktree, and branch.
2. Scope: approved solution, non-goals, and frozen decisions.
3. Tasks: task count and first ready task.
4. Verification: planned commands and behavior evidence path.
5. Roadmap sync: synced, skipped with reason, or not applicable.
6. Route: `cc-do`, `cc-investigate`, `roadmap`, or `stop`.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.

## Operating Contract

1. 先用 resolver 找到当前仓库的 `cc-devflow`，并确认支持 `next-change-key`、`config`。
2. 用 `next-change-key --prefix REQ|FIX --description "..."` 生成 `changeId` 和完整 `changeKey`，不要手动扫描编号。
3. 分配 change key 后立刻运行 `../cc-dev/scripts/detect-worktree-state.sh`，用只读 helper 确认当前是 primary / linked / submodule / detached 中哪一种状态。
4. 再运行 `../cc-dev/scripts/prepare-change-worktree.sh --change-key <REQ/FIX-...>`，从主 checkout 创建或复用独立 change worktree；主目录必须继续绑定 `main`。
5. 进入脚本返回的 `WORKTREE_PATH` 后，再由 `../cc-dev/scripts/ensure-work-branch.sh --change-key <REQ/FIX-...>` 锚定 exact-case 分支：`REQ-003-copy-link` 对应 `REQ/003-copy-link`，`FIX-014-auth-race` 对应 `FIX/014-auth-race`。大小写碰撞、submodule 入口、错误 linked worktree 或目标分支不匹配都是 setup blocker。
6. 写 task blocks 前先确认方案。tiny 计划仍要过 planning flow，只是更短。
7. `task.md` 必须包含 `Contract Summary`、ASCII Branch Chain Analysis、决策问题、planning flow、review gate、任务列表、验证命令、完成证据、禁止重决策事项和阶段 commit 要求。
8. 完成 Plan 后提交 Git commit。下一阶段从 Git history 和 `task.md` 恢复，不靠过程文件。

```bash
DEVFLOW=".claude/skills/cc-dev/scripts/resolve-cc-devflow.sh"
bash "$DEVFLOW" config resolve --format policy
```

## Planning Standard

- 用最小可逆方案解决真实需求，不扩张到假想未来。
- 缺证据就写 assumption，不伪装成事实。
- 工程计划前先做产品/创意确认：这个问题值不值得做，用户想得到什么体验，最窄可交付楔子是什么，10x / better version 是什么，不做会损失什么。
- 非 trivial 计划至少经过两轮用户确认：先确认产品价值和形态，再确认工程方案和任务合同；只有 roadmap / spec 已经给出等价证据时才能记录 skip reason。
- 第一手好方案不能直接冻结；非 trivial 计划必须过 Second-Move Review：先写 first good move，再找 simpler move 和 better architecture，最后选择一个当前可执行的 move。
- 计划先做上下文和设计判断，再拆 task；不能把架构、接口、字段、测试缝隙留给 `cc-do` 猜。
- 需求不清时进入苏格拉底式追问：先承认“我怀疑需求还没说清楚，先别写代码”，再一轮只问一个会改变范围或形态的问题；每题给推荐答案。用户没有明确说“足够详细，可以进入下一个阶段”前，不生成 task blocks；每 10 轮问题必须先把 checkpoint 写入 `task.md#Contract Summary`。
- 从需求细化进入技术方案时，必须先区分“已有代码 / 技术思考”还是“只有想法”。已有代码先读代码和测试再做技术追问；只有想法先审方案假设。两种情况都要挑战 3 个隐含假设、指出过度工程风险，并做一次严格的代码 / 方案审查。
- 需求链路必须画成 ASCII 分叉树：从用户需求追到现有入口、调用方、状态/数据流、最深底层影响点，再向下游展开业务影响、风险和验证面。
- 用户视角必须清楚：真实用户 / operator、status quo、最痛失败场景、最小成功信号和非目标。
- 行为变更任务按 tracer bullet 写：`[TEST] -> [IMPL] -> [REFACTOR]`，不要水平切层。
- 每个任务写清目标、文件、依赖、TDD phase、读什么、怎么验证、完成证据。
- 回归测试不能 defer；缺 seam 时先计划 spike 或设计修正。

## Planning Flow

先把调查和引导结果写进 `task.md#Contract Summary`，再生成任务。不要把这些内容拆成其它过程文件。

1. Product / Creative Discovery：确认这个问题值不值得做、目标体验、最窄楔子、10x / better version、do-nothing consequence；证据不足时先问用户，不先谈实现。
2. Requirement Reality：确认真实用户 / operator、当前 workaround、最痛失败场景、最小成功信号、非目标。
3. System Shape：确认现有代码链路、模块归属、状态 / 数据流、复用点、边界外系统和必须保留的不变量。
4. Interface / Data Contract：确认 public interface、调用方、输入输出、关键字段、错误形态、权限 / 边界和命名来源。
5. Abstraction Boundary：确认复杂度藏在哪个模块，哪些抽象被拒绝，哪些公共方法必须保持小而深。
6. Execution Architecture：确认 foundation、core logic、integration、polish/tests 阶段的冻结决策、文件职责、耦合风险和失败恢复。
7. Task Contract：确认每条 tracer bullet 的 user / edge story、Red test name、public seam、Green minimality guard、refactor candidates 和 2-5 分钟任务粒度。
8. Second-Move Review：记录 first good move、simpler move、better architecture、selected move 和 rejected tradeoff；tiny 计划可压成一句，非 trivial 计划必须说明为什么没有选择另一个好走法。
9. Final Approval：展示冻结方案和任务合同摘要；用户批准前不生成执行 task blocks。

`tiny-design` 可以把每轮压成一句话；`full-design` 必须保留足够证据让执行者不二次设计。任一轮 `blocked` 时，只能问一个 blocking question、拆回 roadmap / 多个 REQ/FIX，或记录用户明确接受的人工边界。非 trivial 计划的产品/创意确认和工程方案确认必须分成至少两次确认，不能一次性把所有问题塞给用户。

## Socratic Dialogue Protocol

这个协议把苏格拉底式追问从聊天习惯变成 `task.md` 合同：一轮只问一个问题，每个问题给推荐答案；能从代码、roadmap、spec、测试、日志或 git history 回答的，先查证，不问用户。

命名原则：允许使用通用、可理解、能稳定触发正确行为的方法词，例如 `Socratic Dialogue`、`Adversarial Review`、`surgical planning`；不要使用项目外读者无法理解的内部暗语或个人化来源名。

### Phase A: Requirement Refinement

在 Product / Creative Discovery 和 Requirement Reality 之间运行。目标不是收集更多形容词，而是把需求压成可执行事实：

1. 先输出当前理解、最强证据、最大不确定点和推荐收窄方向。
2. 只问一个 D<N> 问题；问题必须改变用户、场景、成功信号、非目标、范围边界或路线形态。
3. 用户回答后，更新 `task.md#Contract Summary` 的 `Socratic Dialogue`，再决定下一个最关键未知点。
4. 如果答案仍虚，继续追问具体人、现状 workaround、失败场景、最小成功信号和不要做什么。
5. 只有用户明确确认“足够详细，可以进入工程方案 / 技术细节 / 下一个阶段”或等价表达，才能进入技术方案确认。

### Phase B: Technical Deepening And Adversarial Review

在 System Shape / Interface Data Contract 已有 repo 证据后运行。不要先问用户实现偏好；先读现有代码、测试、脚本、spec 和相似实现。

必须覆盖：

1. `Existing-code path`：如果已有代码，列出现有入口、调用方、数据/状态、测试 seam 和能复用的模块；如果没有代码，记录为 `no existing code -> proposal review`。
2. `3 hidden assumptions`：指出 3 个还没被证据确认、但会改变方案的隐含假设。
3. `Overengineering challenge`：指出哪里可能过度工程，给出更小方案和更深架构方案。
4. `Adversarial review`：严格审查一次当前代码或技术方案，只关注 bug、耦合、接口膨胀、测试假象和未来维护成本。
5. `One-question rounds`：每次只问一个技术 D<N> 问题，并给推荐答案、证据、选项和影响。
6. `Release gate`：用户没有明确说“足够详细，可以生成任务 / 进入 cc-do / 下一个阶段”前，不写 task blocks。

如果用户要求快速推进，只能保留最多 2 个 blocking 技术问题；不能跳过 hidden assumptions、overengineering challenge 和 adversarial review。

### Dialogue Checkpoint

多轮追问会消耗上下文。每完成 10 轮 user-facing question round，必须先更新 `task.md#Contract Summary` 的 `Dialogue Checkpoints`，再问第 11 / 21 / 31 轮问题。checkpoint 不创建新文件，必须包含：

1. round range covered 和 next question number。
2. decisions made、rejected options with reasons、remaining open questions。
3. repo evidence read、user answers that changed scope、hidden assumptions / review findings so far。
4. current release status：requirement release、technical release、是否仍 blocked。

会话压缩或恢复后，先读最新 checkpoint 和 `Socratic Dialogue` 字段，再继续下一轮；不要依赖聊天记忆重建决策。

## ASCII Branch Chain Analysis

`task.md#Contract Summary` 必须包含一个 ASCII 分叉树代码块。它不是插图，是执行合同的一部分。

Language rule:

- Tree structure tokens must stay ASCII: `|--`, `` `-- ``, `|`, spaces, and plain punctuation.
- Node labels, placeholder text, explanations, and evidence summaries must follow `Output language` in `task.md`.
- If `Output language` is unset, use the current conversation language and record the assumption.
- Do not hard-code English labels such as `Requirement Impact Chain` when the configured output language is not English.
- Use the Label table as the shared source for chain titles, node labels, and placeholder text.

Label table:

| Semantic slot | en | zh-CN |
| --- | --- | --- |
| requirementChain | Requirement Impact Chain | 需求影响链 |
| requirementMarker | REQ | 需求 |
| upstreamSource | Upstream source | 上游来源 |
| currentCodePath | Current code path | 当前代码路径 |
| caller | caller | 调用方 |
| dataOrState | data or state | 数据或状态 |
| deepestAffectedLayer | deepest affected layer | 最深影响层 |
| requiredChange | Required change | 必要变更 |
| verificationSeam | Verification seam | 验证缝隙 |
| businessChain | Business Impact Chain | 业务影响链 |
| outcomeMarker | OUTCOME | 结果 |
| directBehaviorImpact | Direct behavior impact | 直接行为影响 |
| downstreamImpact | Downstream impact | 下游影响 |
| riskBranch | Risk branch | 风险分支 |
| nonGoalBranch | Non-goal branch | 非目标分支 |

```text
<requirementChain>
<requirementMarker>: <user-visible change>
|-- <upstreamSource>: <roadmap / issue / user request / existing task>
|-- <currentCodePath>: <entry>
|   |-- <caller>: <file / command / UI / API>
|   |-- <dataOrState>: <field / config / artifact>
|   `-- <deepestAffectedLayer>: <module / prompt / provider contract / storage>
|-- <requiredChange>: <smallest behavior delta>
`-- <verificationSeam>: <public test / command / artifact>

<businessChain>
<outcomeMarker>: <operator / user value>
|-- <directBehaviorImpact>: <what changes for user>
|-- <downstreamImpact>: <consumers / docs / examples / release>
|-- <riskBranch>: <regression / migration / support / cost>
`-- <nonGoalBranch>: <explicitly not changed>
```

规则：

- 先向上追来源，再向下追影响面；不要只写目标文件列表。
- 必须找到“最深底层会影响的链路”：数据模型、状态机、CLI/runtime、prompt、provider contract、存储或外部边界。
- 若需求影响提示词、agent 指令、provider 参数、生成 artifact，树里必须写出精确 prompt/provider 合同位置。
- 没有证据的分支写 `unknown -> Evidence Request`，不能伪装成已确认。

## Decision Question Protocol

只在答案会改变范围、方案、接口、任务切分或验证口径时提问。能从 repo evidence、roadmap、spec、测试或 git history 确认的，不问用户。
提问前先做一次 Second-Move Review：这个问题是否能由 repo evidence 回答，是否把用户拉进实现细节，是否有更高质量的问题能一次冻结更多下游决策。
产品/创意问题优先于工程问题。若“值不值得做”或“做成什么样”仍不清楚，只问产品/创意层 D<N>；不要提前问文件、接口、字段、测试实现。
每次需要用户选择时，先按 `../cc-dev/references/user-choice-output-protocol.md` 选择宿主原生格式：Codex 用 `request_user_input`，Claude Code 有 MCP elicitation / ask-question 工具时用结构化输入；没有结构化工具时才输出下面的 A/B/C 文本块并停止。

固定格式：

```text
D<N> - <decision title>
Planning object: <REQ/FIX/RM/change key>
Known evidence: <repo / roadmap / code / test facts>
Decision needed: <what changes downstream>
Recommendation: <A/B/C> because <reason>
Options:
A) <label> (recommended)
  Good: <upside>
  Cost/Risk: <cost or risk>
B) <label>
  Good: <upside>
  Cost/Risk: <cost or risk>
C) <label, optional>
  Good: <upside>
  Cost/Risk: <cost or risk>
Impact: <what cc-do will do differently>
STOP: wait for the user answer before continuing.
```

用户回答后，把决定写入 `task.md#Contract Summary` 的 `Decision Questions`。聊天不是长期真相源。

## Engineering Review Gate

冻结 task blocks 前，在 `task.md#Contract Summary` 里完成轻量 review：

1. Existing leverage map：每个子问题先映射到现有代码、脚本、spec、模板或测试。
2. Scope challenge：超过 8 个文件、2 个新 service/class、或跨模块连锁时，说明为什么不是过度设计。
3. Second-Move Review：非 trivial 方案必须比较 first good move、simpler move、better architecture，并说明 selected move 与 rejected tradeoff。
4. Domain language check：核心名词、文件名、测试名、任务标题对齐项目真相；没有来源就写 assumption。
5. Interface depth check：公共面小而深，复杂度藏进模块内部，边界 adapter 是具体操作而不是 generic catch-all。
6. Test seam check：Red 任务从公共接口、调用方流程或用户可见路径证明行为；不要测私有实现细节。
7. Mock boundary check：只 mock 外部 API、时间、随机性、文件系统或必要数据库边界。
8. Feedback loop check：为每个行为选定最短可信反馈循环。

## Required Output

`task.md` 的结构由 `assets/TASKS_TEMPLATE.md` 提供。模板外只允许补充对当前需求必要的事实，不允许新建额外过程文件。

## Handoff

退出时只说清：

- change key 和分支
- `task.md` 路径
- 已运行或跳过的验证
- Plan commit hash
- 下一步 `cc-do`
