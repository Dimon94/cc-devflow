---
name: cc-do
version: 1.6.7
description: Use when implementing planned tasks, resuming interrupted work, applying a frozen investigation handoff, or landing review feedback after cc-plan or cc-investigate.
triggers:
  - 开始做 T003
  - 继续上次做到一半的任务
  - 按 planning/tasks.md 开始实现
  - 修这个 review comment
  - implement this task
  - resume this requirement
  - repair this investigated bug
reads:
  - PLAYBOOK.md
  - CHANGELOG.md
  - references/execution-recovery.md
  - references/parallel-dispatch.md
  - docs/guides/project-postmortem.md
writes:
  - path: devflow/changes/<change-key>/execution/tasks/<task-id>/events.jsonl
    durability: durable
    required: false
    when: debug mode is enabled or the task execution fails
  - path: devflow/changes/<change-key>/execution/team-state.json
    durability: durable
    required: false
    when: execution mode uses delegated or team workers
  - path: devflow/changes/<change-key>/meta/change-state.json
    durability: durable
    required: false
    when: pause, resume, dispatch, or quick-lane state changes
effects:
  - code changes
  - test changes
  - task status updates in planning/tasks.md and planning/task-manifest.json
entry_gate:
  - Run `cc-devflow query workflow-context --change <changeId> --change-key <changeKey> --data-only --no-trace --compact` first and follow its context-index `packetOnly`, `mustNotForget`, `sourceHashes`, `defaultOpen`, `currentTask`, `commandsToTrust`, and `openWhen.conditions` fields before opening deep artifacts.
  - Read planning/design.md or planning/analysis.md, then planning/tasks.md, planning/task-manifest.json, change-meta.json, related capability specs, current Git state, and CLI logs only when the workflow context says the deep section is needed.
  - Select only ready tasks whose dependencies, wave, touched paths, and file ownership are clear.
  - Reject parallel execution when touched paths overlap by exact path or parent/child path; submodule touches must be isolated unless the task explicitly owns that submodule.
  - If the current task cannot be restated from canonical artifacts, run a context reset before coding.
  - Before each single-task execution, run a quick Project Postmortem search against `devflow/postmortems` using the task's touched files, capability, failure class, and model-risk terms; apply applicable reminders to the code path and mention only blocking/failure facts in CLI events.
  - "Validate the current task's TDD shape before coding: spec-style test name, one logical behavior, public verification path, allowed boundary mocks, Green minimality guard, and refactor candidates."
exit_criteria:
  - The current task has red/green evidence, public-seam test quality evidence, review evidence, and synchronized task status.
  - Red evidence proves one observable behavior through a public verification path; Green evidence shows only the minimal production change; Refactor evidence names the concrete smell removed or says why none was needed.
  - The completed task was closed through `scripts/mark-task-complete.sh`; manual checkbox/status edits are not valid completion evidence.
  - Execution leaves the next verifier enough code, Git, task-status, verification-command, and CLI-log truth to judge the task without chat memory.
  - The honest next step is cc-check or an explicit reroute.
reroutes:
  - when: Three failed repair attempts or new evidence show the investigation contract is wrong.
    target: cc-investigate
  - when: New evidence shows the requirement design or scope contract is wrong.
    target: cc-plan
  - when: Implementation and reviews are complete for the current task set.
    target: cc-check
recovery_modes:
  - name: resume-from-task-state
    when: Work was interrupted but the current design contract is still valid.
    action: Reload workflow-context, planning/tasks.md, task-manifest.json, current Git state, and CLI logs; continue from the first pending or failed task.
  - name: context-reset
    when: The conversation history is noisy, stale, or cannot reproduce the exact task state.
    action: Discard chat memory, reread planning/design.md or planning/analysis.md plus planning/tasks.md/planning/task-manifest.json, current Git state, and CLI logs, then restate the next action before coding.
tool_budget:
  read_files: 9
  search_steps: 6
  shell_commands: 8
---

# CC-Do

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，然后检查 `CLAUDE.md`

## Role

`cc-do` 是 PDCA 里的 `Do`。

同时它也是 IDCA / DDCA 里的 `Do`。

它只做一件事：沿着已经冻结的任务，把代码真正做出来，并把执行证据留到足够让别人接手、复盘、复验。

## Runtime Output Policy

写入任何 durable Markdown 或 JSON metadata 前，先运行 `cc-devflow config resolve --format policy`。

- `Output language` 是机器约束；如果失败或 debug CLI 日志需要人类可读摘要，必须记录并遵守它。
- `agent_preferences` 是用户偏好建议，只影响表达方式和结构选择，不覆盖本 Skill 的工作流边界。
- 如果配置解析失败，先修配置或向用户说明阻塞，不要用默认语言继续生成正式文档。

上游冻结合同可以来自两条路：

- `cc-plan` 产出的 `planning/design.md`
- `cc-investigate` 产出的 `planning/analysis.md`

## Read First

1. `PLAYBOOK.md`
2. `CHANGELOG.md`
3. `references/execution-recovery.md`
4. `references/parallel-dispatch.md`
5. `docs/guides/project-postmortem.md`

## Use This Skill When

- 要实现 `planning/tasks.md` / `planning/task-manifest.json`
- 执行被中断，需要恢复
- bug 根因已经在 `cc-investigate` 里冻结，准备开始修
- review feedback 要落成代码

如果方案还没冻结、任务边界还没定，停下并回 `cc-plan` 或 `cc-investigate`。

## Quick Start

先判断现在是哪一种执行局面，再开始编码：

| 现实状态 | 先走什么路径 |
| --- | --- |
| 已有 ready task，直接实现 | `implement` |
| 上次做到一半，需要继续 | `resume` |
| bug 根因已冻结 | `repair-from-investigation` |
| bug 还没搞清根因 | reroute 到 `cc-investigate` |
| 收到 review comment，要在既定范围内修正 | `review-fix` |

如果连“当前 task 是什么”都说不清，先别写代码，先跑 `cc-devflow query workflow-context`。只有它的 `openWhen` 指向 scheduling 或 recovery 时，才继续跑 `scripts/select-ready-tasks.sh`；`scripts/build-task-context.sh` 只能输出 stdout，不得生成 `context.md`。

## Harness Contract

- Allowed actions: implement ready tasks, debug inside frozen scope, update task status through the completion script, and apply review feedback that does not reopen design.
- Forbidden actions: re-planning the requirement in place, blindly rerunning the whole requirement, or delegating tasks without full task context.
- Required evidence: every task must leave objective code/Git/test evidence; blocked or failed work may leave compact CLI events, but must not create AI-written process files.
- Reroute rule: after repeated failed repairs or root-cause drift, stop patching and go back to `cc-investigate`; if scope or design truth breaks, go back to `cc-plan`; after task closure, hand off to `cc-check`.

## TDD Iron Law

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

`cc-do` 默认采用测试先行的执行纪律：

1. Red：先写一个最小失败测试，运行并确认它因为目标行为缺失而失败。
2. Green：只写让当前失败测试通过的最小生产代码。
3. Refactor：只有 Green 之后才能清理命名、重复、结构和坏味道。
4. Record：任务状态只通过 `mark-task-complete.sh` 同步到 `planning/tasks.md` 与 `planning/task-manifest.json`；失败或 debug 时才写 `events.jsonl`。

Red 不是形式上的红，而是公共 seam 上的行为缺失证明。测试必须通过公共接口、调用方流程、CLI/API/UI 路径或其它真实边界进入系统；只验证私有函数、内部调用次数、临时数据结构或 mock 自己控制的内部协作者，不算 TDD 证据。

一个 Red 只证明一个逻辑行为。测试名要像规格说明，而不是实现步骤；结果要从同一类公共入口读回。直接查数据库、读内部状态、扫描临时文件或绕过 API 来证明行为，只在那个边界本身就是被测对象时成立。

例外只能用于 throwaway prototype、纯生成文件、纯配置改动；例外必须写在当前 task block 或 manifest task context 中，包含原因、风险和替代验证命令。测试第一次就绿，说明测试没有证明新行为，必须修测试而不是继续写生产代码。

禁止水平切片：不要先写一批测试，再写一批实现。每次只推进一个 tracer bullet：一个可观察行为的 Red -> 让它变绿的最小实现 -> 必要重构 -> 记录证据，然后再进入下一个行为。

测试数据也必须诚实。fixture 只提供当前行为需要的最小输入；partial fixture、类型断言、mock payload 或 generated stub 必须写清哪些字段是真实 contract，哪些只是测试填充。不能用 `as`、`any`、双重 cast、缺字段 partial mock 或 test-only method 掩盖 seam 设计问题。

Green 不是顺手把未来行为都做掉。只写当前红灯要求的最小生产代码；如果需要新接口，优先保持小接口深模块，依赖从调用方传入，外部 boundary adapter 拆成具体操作，而不是用一个 generic fetcher 把复杂条件推给 mock。

Refactor 只能发生在 Green 之后。优先处理当前 slice 暴露出的重复、长方法、浅模块、feature envy、primitive obsession、命名混乱、三层以上分支和新代码揭开的旧代码坏味道；没被当前绿色测试保护的扩张性整理，回到 `cc-plan` 或后续任务。

## Entry Gate

1. 先运行 `cc-devflow query workflow-context --change <changeId> --change-key <changeKey> --data-only --no-trace --compact`，把 `nextAction.skill == "cc-do"` 和 `currentTask.id` 作为执行入口。
2. 先只用 `workflow-context.progressiveDisclosure.packetOnly` 和 `mustNotForget` 做导航与护栏，必要时打开 `defaultOpen` 的 section / JSON refs；如果 `sourceHashes` 不匹配、命令缺失、scope/依赖/触点不确定，必须按 `openWhen.conditions` 打开 `deepOpen`，不能靠猜。
3. 先用 `workflow-context.queues.readyTasks` 判断现在到底哪几个任务真的 ready；需要 shell 复核时再跑 `scripts/select-ready-tasks.sh`。
4. 只锁定当前 ready task，或一组经依赖、wave、精确触点与父子路径触点校验后可并行的 ready tasks。
5. 如果这次来自 `cc-investigate`，必须把 `planning/analysis.md` 当成 canonical contract，而不是一边实现一边重新调查。
6. 没有任务上下文，不准把任务扔给 subagent；先用 `workflow-context.currentTask`，不够时再用 `scripts/build-task-context.sh` 从 canonical artifacts 组装上下文。
7. 如果 `task-manifest.json.metadata.lane == "quick"`，仍然必须有 current task、verification、task status 和唯一 next action；quick 只缩短文档密度，不跳过证据。
8. 如果仓库含 `.gitmodules` 或 manifest 提供 `submodulePaths`，先用 `scripts/detect-file-conflicts.sh` 标出 `submoduleTouches`；只有触达该 submodule 的任务失去默认 worktree 隔离资格，未触达任务不能被无辜串行化。
9. 每个单 task 开工前，用当前 task 的 touched files、capability、错误类型、模型风险词快速检索 `devflow/postmortems`；命中时把相关原则转成当前 task 的 guardrail。不要为 no-match 生成过程文件。

## Loop

1. 读取当前任务，而不是重新发明任务。
2. 先执行当前 task 的 Project Postmortem quick search；如果命中同类 incident，先打开对应 incident 的 Prevention Summary 和 Git Evidence，再开始 Red。
3. 依赖没满足前，不准提前做下游任务；不同 wave 之间不允许抢跑。
4. 没有明确并行资格，不准把多个实现任务同时推进；`touches` 父子路径重叠也算同一执行表面。
5. 先 `fail-first`：先写失败测试，先看见预期红，再写生产代码。
6. 如果红灯不是预期失败（语法错、fixture 错、测试没连上），先修测试直到它正确失败。
7. 如果红灯通过错误 seam 得到，比如私有方法、内部调用次数、mock 内部协作者，先修测试 seam，不准进入 Green。
8. 如果红灯只断言实现形状、直接查内部状态或一次证明多个逻辑行为，先改测试，不准进入 Green。
9. 按 `Red -> Green -> Refactor` 推进，Green 只允许最小实现，不预铺未来测试尚未要求的分支、状态或 API。
10. 如果当前 Red 需要新的 fixture 或 mock，先证明它仍从公共 seam 触发真实行为；fixture 缺字段、类型强转或内部 mock 都要写入 `tdd.testQuality.fixtureRisk` 或先修 seam。
11. Refactor 后必须重跑相关测试，保持 Green；Red 状态下不重构。
12. 每次推进都以代码 diff、Git 状态、验证命令输出和 task 状态为真相源；只有失败、阻塞或 debug 需要机器日志时才写 `events.jsonl`。
13. 任务实现后，先过 `spec review`，再过 `code review`，两道门都过才算任务收口；这里只验证 spec delta，不回写长期 spec。
14. 当前任务完成后，把可验证证据留给 `cc-check`。

## Output

- 代码变更
- 测试变更
- `planning/tasks.md` 与 `planning/task-manifest.json` 的 task 状态
- `devflow/changes/<change-key>/execution/tasks/<task-id>/events.jsonl`（仅 debug / failed 默认保留；CLI 自动日志，不写叙事 Markdown）
- `planning/task-manifest.json` 里的 task review verdict

## Good Output

- 当前 task 一眼可见，执行者不用从聊天记录里猜目标
- 当前 wave、ready tasks、parallel candidates、touch conflict verdict 和 submoduleTouches 一眼可见
- 至少留下一次明确的 tracer bullet Red/Green/Refactor 证据，且 Red 是公共 seam 上的预期行为失败
- Red 证据说明测试名、单一行为、公共验证路径和为何不是实现细节测试
- Green 证据说明 minimality guard：本轮只满足当前红灯，没有提前实现未来分支
- Refactor 证据说明清掉了哪个具体坏味道，或者为什么当前 slice 不需要 refactor
- 测试 fixture 说明真实 contract 字段和测试填充字段，没有用类型欺骗或内部 mock 制造假绿
- task status、Git diff、验证命令和必要 CLI 日志足够让下一位接手者恢复
- quick lane 也有 mini manifest、verification 和唯一 next action，不靠聊天记录继续
- reviewer 能顺着 review 记录和验证命令复盘这次实现

## Bundled Resources

- 变更记录：`CHANGELOG.md`
- 执行 / 恢复规则：`references/execution-recovery.md`
- 并行分配准则：`references/parallel-dispatch.md`
- 恢复分析：`scripts/recover-workflow.sh`
- 任务状态：`scripts/check-task-status.sh`
- ready 任务选择：`scripts/select-ready-tasks.sh`
- 任务上下文组装：`scripts/build-task-context.sh`（stdout only，不落盘）
- 旧 checkpoint 兼容入口：`scripts/write-task-checkpoint.sh`（不写 checkpoint，只在失败 / debug 时写事件）
- review 记录：`scripts/record-review-decision.sh`
- 任务闭环校验：`scripts/verify-task-gates.sh`
- 任务勾选：`scripts/mark-task-complete.sh`
- 文件冲突：`scripts/detect-file-conflicts.sh`

## Working Rules

1. 没有根因，不准修 bug。
2. 没有任务边界，不准无界发散。
3. 没有失败测试，不准写生产代码。
4. 测试如果第一次就绿，说明你没证明任何东西，先修测试。
5. 红灯原因必须和目标行为缺失一致；红灯如果只是测试写错，不算 TDD 证据。
6. 红灯必须验证公共接口上的行为；实现细节测试、私有方法测试、内部调用次数断言都要先退回 Red 修正。
7. Mock 只能放在系统边界；如果必须 mock 内部协作者才能测试，说明 seam 或设计合同有问题。
8. 一个 Red 只证明一个逻辑行为；bulk Red 或测试名描述实现步骤，都先退回测试设计。
9. Green 只写当前红灯需要的最小实现；预铺未来功能、兼容分支或宽接口都算越界。
10. Red 时不重构；Refactor 只在相关测试已绿后处理当前 slice 暴露的坏味道。
11. 先过 `spec review`，再过 `code review`，顺序不能反。
12. 不在 `cc-do` 里改 capability spec 正文；这里只产出实现证据和 spec 对齐证据。
13. 失败和阻塞都要留下恢复证据。
14. 给 subagent 的输入必须包含：当前进度、当前任务全文、依赖状态、必读文件、验收标准、可信命令。
15. 三次失败修补后必须先质疑调查合同或设计合同，而不是继续堆补丁。
16. 完成任务后必须调用 `scripts/mark-task-complete.sh` 同步 `planning/task-manifest.json` 和 `planning/tasks.md`；禁止手工改 checkbox、status、currentTaskId 来冒充完成。
17. 如果 `mark-task-complete.sh` 失败，说明 review gate 或任务依赖还没闭合；先修证据，再重跑脚本，不准绕过。

## Task Status Protocol

ClaudeCode / Codex 执行 `cc-do` 时必须把任务状态当成状态机，不是普通 Markdown TODO。

1. 开始前用 `planning/task-manifest.json.currentTaskId` 或 ready-task 脚本确认当前任务。
2. 执行时读取完整 task block，包含 Goal、TDD phase、Files、Read first、Verification、Evidence、test seam、mock boundary、minimality / refactor 字段。
3. 完成验证和 review gate 后运行完成脚本：

```bash
SCRIPT_ROOT=".claude/skills/cc-do/scripts"
if [[ ! -d "$SCRIPT_ROOT" && -d ".codex/skills/cc-do/scripts" ]]; then
  SCRIPT_ROOT=".codex/skills/cc-do/scripts"
fi
bash "$SCRIPT_ROOT/mark-task-complete.sh" --manifest devflow/changes/<change-key>/planning/task-manifest.json --tasks devflow/changes/<change-key>/planning/tasks.md --task <task-id>
```

4. 脚本会先跑任务 gate，再同步 manifest、checkbox、`currentTaskId` 和整体状态。不要手动改这些字段。
5. 如果任务不能完成，只在失败 / debug 需要时写 CLI event；不要生成过程 Markdown，也不要把失败任务标成完成。

## Exit Criteria

- 当前任务有 Red/Green 证据
- 当前任务有 `spec review` / `code review` 两道门证据
- 恢复点可从 `planning/tasks.md`、`planning/task-manifest.json`、Git 状态和必要 CLI 日志判断
- 阻塞原因已写清楚
- 下一步应进入 `cc-check`，或明确退回 `cc-investigate` / `cc-plan`

## Do Not

- 不在这里重开方案讨论
- 不把一次修复膨胀成重写整个模块
- 不把依赖任务和被依赖任务同时并行
- 不把没有当前进度的任务直接丢给 subagent
- 三层以上判断说明上游合同该回炉

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 变更记录：`CHANGELOG.md`
- 执行规则：`references/execution-recovery.md`
- 并行规则：`references/parallel-dispatch.md`
