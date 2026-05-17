---
name: cc-plan
version: 3.10.7
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
  - ../cc-dev/scripts/prepare-change-worktree.sh
  - ../cc-dev/scripts/ensure-work-branch.sh
  - ../cc-roadmap/scripts/locate-roadmap-item.sh
  - ../cc-roadmap/scripts/sync-roadmap-progress.sh
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
  - Prepare an isolated change worktree immediately after the change key exists; keep the main checkout on `main`.
  - Enforce the Worktree Branch Contract inside the returned change worktree before writing `task.md`.
  - Read repo evidence before asking the user: roadmap handoff, specs, relevant code/tests/docs, recent commits, and existing task truth when present.
  - Run the planning flow before task generation: product/creative discovery, requirement reality, system shape, interface/data contract, abstraction boundary, execution architecture, task contract, Second-Move Review, and final approval.
  - Ask with the Decision Question Protocol when the answer changes scope, design, implementation boundary, or verification.
exit_criteria:
  - "`task.md#Contract Summary` states the approved solution, non-goals, frozen decisions, work branch, user stories, decision questions, planning-flow results, review gate, verification expectations, and open assumptions."
  - "`task.md#Contract Summary` contains an ASCII Branch Chain Analysis for requirement impact and business impact, tracing upstream sources, current code path, deepest affected layer, downstream blast radius, and prompt/provider contracts when involved; tree connector characters stay ASCII while node text follows the configured output language."
  - "`task.md` contains executable task blocks generated from `assets/TASKS_TEMPLATE.md`."
  - "Non-trivial plans complete product/creative discovery before engineering design: worth doing, desired product shape, narrowest wedge, 10x/better version, and do-nothing consequence."
  - "Non-trivial plans complete Second-Move Review before approval: first good move, simpler move, better architecture, selected move, and rejected tradeoff."
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

`cc-plan` 是 PDCA 的 `Plan`。它只产出一份 durable 任务合同：

- `devflow/changes/<change-key>/task.md`

不要生成额外过程文件。Git commit 是阶段历史，`task.md` 是任务真相。

## Operating Contract

1. 先用 resolver 找到当前仓库的 `cc-devflow`，并确认支持 `next-change-key`、`config`。
2. 用 `next-change-key --prefix REQ|FIX --description "..."` 生成 `changeId` 和完整 `changeKey`，不要手动扫描编号。
3. 分配 change key 后立刻运行 `../cc-dev/scripts/prepare-change-worktree.sh --change-key <REQ/FIX-...>`，从主 checkout 创建或复用独立 change worktree；主目录必须继续绑定 `main`。
4. 进入脚本返回的 `WORKTREE_PATH` 后，再由 `../cc-dev/scripts/ensure-work-branch.sh --change-key <REQ/FIX-...>` 锚定 exact-case 分支：`REQ-003-copy-link` 对应 `REQ/003-copy-link`，`FIX-014-auth-race` 对应 `FIX/014-auth-race`。大小写碰撞或目标分支不匹配都是 setup blocker。
5. 写 task blocks 前先确认方案。tiny 计划仍要过 planning flow，只是更短。
6. `task.md` 必须包含 `Contract Summary`、ASCII Branch Chain Analysis、决策问题、planning flow、review gate、任务列表、验证命令、完成证据、禁止重决策事项和阶段 commit 要求。
7. 完成 Plan 后提交 Git commit。下一阶段从 Git history 和 `task.md` 恢复，不靠过程文件。

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
