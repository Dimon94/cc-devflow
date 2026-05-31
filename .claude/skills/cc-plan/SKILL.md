---
name: cc-plan
version: 3.18.2
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
  - "`task.md#Contract Summary` records the test strategy shape: suite layer, command/runtime expectation, proof value, fixture/mock boundary, low-value tests to avoid, and the smallest high-signal feedback loop."
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
2. `references/planning-contract.md`

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

## Progressive Disclosure

入口只保留不可丢的 Plan 门禁。详细流程、Socratic rounds、Decision Question 格式、ASCII Branch Chain 模板和 Engineering Review Gate 都在 `references/planning-contract.md`；需要向用户提问时再读 `../cc-dev/references/user-choice-output-protocol.md`。

按需打开：

- `PLAYBOOK.md`：复杂、跨模块、恢复或需要示例时。
- `assets/TASKS_TEMPLATE.md`：用户批准方案后，生成 task blocks 前。
- roadmap helper scripts：只有存在 source roadmap item 或需要同步进度时。

## Operating Contract

1. 先用 resolver 确认当前仓库的 `cc-devflow` 支持 `next-change-key` 和 `config`。
2. 用 `next-change-key --prefix REQ|FIX --description "..."` 生成 canonical `changeKey`。
3. 立刻运行 `detect-worktree-state.sh`，再用 `prepare-change-worktree.sh` 创建或复用独立 change worktree；主 checkout 继续绑定 `main`。
4. 进入返回的 `WORKTREE_PATH` 后，用 `ensure-work-branch.sh --change-key <REQ/FIX-...>` 锚定 exact-case `REQ/...` 或 `FIX/...` 分支。
5. 大小写碰撞、submodule 入口、错误 linked worktree、目标分支不匹配或 CLI 能力缺失都是 setup blocker。
6. 完成 Plan 后提交 Git commit；下一阶段只从 Git history 和 `task.md` 恢复。

```bash
DEVFLOW=".claude/skills/cc-dev/scripts/resolve-cc-devflow.sh"
bash "$DEVFLOW" config resolve --format policy
```

## Planning Contract

`task.md#Contract Summary` 必须记录 approved solution、non-goals、frozen decisions、work branch、user/operator stories、planning-flow results、Decision Questions、ASCII Branch Chain Analysis、review gate、verification expectations 和 open assumptions。

非 trivial 计划必须：

1. 先做产品 / 创意确认，再做工程设计。
2. 分开确认 requirement release 和 technical release，除非 roadmap/spec 已提供等价证据并记录 skip reason。
3. 完成 Planning Flow：Product Discovery -> Requirement Reality -> System Shape -> Interface/Data Contract -> Abstraction Boundary -> Execution Architecture -> Task Contract -> Second-Move Review -> Final Approval。
4. 运行 Socratic Dialogue：一轮一个会改变范围、形态、接口、任务切分或验证口径的问题；每题给推荐答案；repo 能回答的先查证。
5. 每 10 轮 user-facing question round 写一次 Dialogue Checkpoint。
6. 用户明确释放前，不生成 task blocks。

任务必须是 tracer bullet：`[TEST] -> [IMPL] -> [REFACTOR]`，每条写清目标、文件、依赖、TDD phase、public verification path、命令和完成证据。回归测试不能 defer；缺 seam 时先计划 spike 或设计修正。

## Required Output

`task.md` 的结构由 `assets/TASKS_TEMPLATE.md` 提供。模板外只允许补充对当前需求必要的事实，不允许新建额外过程文件。

## Handoff

退出时只说清：

- change key 和分支
- `task.md` 路径
- 已运行或跳过的验证
- Plan commit hash
- 下一步 `cc-do`
