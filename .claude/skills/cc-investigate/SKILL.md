---
name: cc-investigate
version: 1.5.1
description: "Use when a bug, regression, broken task, or unexpected behavior needs root-cause investigation, reproducible evidence, and a frozen repair handoff before cc-do resumes coding."
triggers:
  - "帮我查这个 bug"
  - "先别修先找根因"
  - "debug this bug"
  - "investigate this regression"
  - "why is this broken"
  - "root cause this"
  - "先调查再修"
reads:
  - "PLAYBOOK.md"
  - "CHANGELOG.md"
  - "references/investigation-contract.md"
  - "docs/guides/project-postmortem.md"
  - "assets/TASKS_TEMPLATE.md"
  - "assets/TASK_MANIFEST_TEMPLATE.json"
  - "../cc-roadmap/scripts/locate-roadmap-item.sh"
  - "../cc-roadmap/scripts/sync-roadmap-progress.sh"
writes:
  - path: "devflow/changes/<change-key>/planning/tasks.md"
    durability: "durable"
    required: true
  - path: "devflow/changes/<change-key>/planning/task-manifest.json"
    durability: "durable"
    required: true
  - path: "devflow/changes/<change-key>/change-meta.json"
    durability: "durable"
    required: true
effects:
  - source roadmap progress sync when investigation freezes, reroutes, or diagnoses a roadmap mismatch
entry_gate:
  - "Read the bug report, existing change artifacts, relevant code/tests/logs, and recent history before forming hypotheses."
  - "State assumptions, competing interpretations, and what evidence would change the root-cause route before testing hypotheses."
  - "Assign the change key with `cc-devflow next-change-key --prefix FIX --description \"<short bug name>\"`; first output line is `changeId`, second is full `changeKey`."
  - "Enforce the Worktree Branch Contract immediately: detached worktrees bind to `FIX/<task>`, default branches stop as setup blockers, unrelated branches need explicit same-change proof."
  - "Write root-cause truth in `planning/tasks.md#Root Cause Contract`; machine JSON must be generated or refreshed by `cc-devflow task-contract compile`, not handwritten by the AI."
  - "Build a runnable feedback loop that matches the reported symptom before freezing root cause."
  - "Search prior investigations, recent fixes, TODO/backlog signals, and project postmortems before declaring the bug novel."
  - "Run the Root Cause Proof Ladder: symptom site, first bad state, violated contract, original trigger, counterfactual proof, escape reason."
  - "For multi-component, deep-stack, flaky, or performance symptoms, open the matching escalation pack before declaring root cause."
  - "Do not write production code here; exit with a frozen repair handoff for cc-do or an explicit reroute."
  - "Before exit, sync or explicitly no-op the source roadmap item."
exit_criteria:
  - "`planning/tasks.md#Root Cause Contract` proves the first bad state and original trigger, not only the visible error site."
  - "`planning/tasks.md#Root Cause Contract` records reproduction, feedback loop, evidence chain, tested hypotheses, confirmed root cause, and repair boundary."
  - "`planning/tasks.md#Root Cause Contract` records the Project Postmortem Recall result or `no-project-postmortems-yet`."
  - "`planning/task-manifest.json` and `change-meta.json` were generated or refreshed by `cc-devflow task-contract compile`, then validated."
  - "`planning/tasks.md` and machine artifacts are explicit enough that cc-do can repair without chat memory."
  - "`planning/tasks.md` and `change-meta.json` record the canonical work branch or why branch mutation was invalid."
  - "`cc-devflow query workflow-context --compact` can derive the IDCA next action, packet digest, current task, trusted commands, and deep-open triggers."
  - "Roadmap sync is updated or a no-op reason is recorded."
  - "The honest next step is `cc-do`, `cc-plan`, or `roadmap`."
reroutes:
  - when: "The issue is actually a new feature, scope redesign, missing spec truth, or product decision."
    target: "cc-plan"
  - when: "The discussion expands into project sequencing or roadmap priority."
    target: "roadmap"
  - when: "Root cause and repair boundary are already frozen."
    target: "cc-do"
recovery_modes:
  - name: "repro-reset"
    when: "The reproduction path is stale, missing, or does not match the reported symptom."
    action: "Drop the narrative, rebuild the feedback loop from fresh repo evidence, then restate the symptom before testing hypotheses."
  - name: "re-open-investigation"
    when: "Execution evidence disproves the current root-cause contract or widens the suspected blast radius."
    action: "Reopen `planning/tasks.md#Root Cause Contract`, update evidence, then regenerate machine artifacts only after the contract is stable."
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 6
---

# CC-Investigate

> [PROTOCOL]: 变更时同步更新 `version`、`CHANGELOG.md`、相关模板/脚本引用，然后检查 `CLAUDE.md`

## Role

`cc-investigate` 是 IDCA 的 `Investigate`：把 bug 现象压成证据，把证据压成根因，再把根因压成 `cc-do` 可执行的修复合同。

它不写生产代码，不做产品路线图，不制造调试文档农场。新需求走 `cc-plan`；bug / regression 走 `cc-investigate -> cc-do -> cc-check -> cc-act`。

## Thin Harness Rule

默认相信顶级模型的工程判断。Harness 只守住四件事：

1. 分支、change key、roadmap/source truth 不错位。
2. 根因证明不能停在 symptom site。
3. 关键结论落到可恢复 artifact，而不是留在聊天里。
4. 机器态 JSON 必须由 CLI / 模板生成或更新，AI 不手写过程 JSON。

不要启动就读完所有 reference。先用本文件闭合常规调查；只有触发升级条件时，才打开 `PLAYBOOK.md` 或 `references/investigation-contract.md` 的对应段落。

## Harness Contract

- Allowed actions: reproduce, collect evidence, trace code paths, test hypotheses, freeze root cause in `planning/tasks.md`, run CLI artifact generation, validate, and sync/no-op roadmap.
- Forbidden actions: production code, guessed root cause, manual JSON authoring, legacy `planning/analysis.md` for new investigations, or symptom patches before root cause proof.
- Required evidence: every root-cause claim points to reproduction output, code facts, recent history, boundary probes, or explicit user confirmation.
- Reroute rule: scope/design truth changes go to `cc-plan`; project priority goes to `roadmap`; confirmed repair handoff goes to `cc-do`.

## Investigation Discipline

- Prefer evidence over speed: no reproduction or feedback loop means no confirmed root cause.
- Use the model for classification and hypothesis ranking; use commands, logs, diffs, and probes for deterministic proof.
- When evidence conflicts, choose the newer or stronger source and record why the other pattern was rejected.
- If the bug is really missing spec truth or roadmap mismatch, reroute instead of averaging bugfix and feature design.
- Any skipped probe, unavailable environment, or stale evidence is an explicit blocker or Evidence Request.

## Runtime Output Policy

写入 durable Markdown 或 metadata 前，先运行：

```bash
cc-devflow config resolve --format policy
```

`Output language` 是机器约束，必须记录在 `planning/tasks.md` 和 CLI 生成的 `change-meta.json` 来源字段里。配置解析失败时先修配置或报告阻塞，不用默认语言偷跑。

## Read Lazily

启动时只读：

1. 用户 bug report / failed command / current artifact。
2. 当前 repo 指令：`CLAUDE.md` / `AGENTS.md` / README 中直接相关部分。
3. 相关代码、测试、日志、recent diff 的最小证据集。
4. `assets/TASKS_TEMPLATE.md`。

按需再读：

- `PLAYBOOK.md`：需要完整调查剧本、模式表、边界矩阵、flaky/perf 细则时打开。
- `references/investigation-contract.md`：要校验字段、hard rules、repair boundary 时打开。
- `docs/guides/project-postmortem.md`：仓库存在 `devflow/postmortems/` 且匹配历史失败类时打开。
- `assets/TASK_MANIFEST_TEMPLATE.json`：只在维护模板或对照 CLI 输出结构时打开；普通调查不照抄 JSON。
- `../cc-roadmap/scripts/*`：定位或回写 source RM 时打开。

## Change Key And Branch

新调查先分配 change key：

```bash
cc-devflow next-change-key --prefix FIX --description "short bug name"
```

脚本输出两行：`changeId` 和完整 `changeKey`。直接使用输出，不手动扫描、不心算编号。

分支锚定规则：

1. `FIX-014-auth-race` 对应 `FIX/014-auth-race`。
2. 当前 detached 时，立刻 `git switch -c <canonical-work-branch>`。
3. 当前是 `main` / `master` / default branch 时停止，报告 setup blocker。
4. 当前是其它分支时，只有它已明确绑定同一个 change key 才继续。

`planning/tasks.md` 和 `change-meta.json` 必须记录 work branch。

## Machine Artifact Rule

AI 只手写默认人类合同：`planning/tasks.md#Root Cause Contract` 和后面的 repair task blocks。

机器态文件必须由命令生成或更新：

```bash
cc-devflow task-contract compile --change <changeId> --change-key <changeKey>
cc-devflow task-contract validate --change <changeId> --change-key <changeKey>
```

硬规则：

- 不手写 `planning/task-manifest.json`。
- 不手写 `change-meta.json`。
- 不生成 `planning/analysis.md`、task `context.md`、`checkpoint.json`、review Markdown 或其它 AI 手写过程文件。
- 需要修机器态结构时，改 CLI / 模板 / validator，再重新生成；不要在项目 change 目录里补 JSON。
- legacy `planning/analysis.md` 只能作为读取或 migration 输入。

## Investigation Loop

1. **Classify**：先说明属于 `reproduce-first`、`feedback-loop`、`diff-trace`、`boundary-probe`、`backward-trace`、`condition-wait`、`workflow-forensics`、`diagnose-only` 还是 reroute。
2. **Reproduce**：构造 agent 可运行的 pass/fail loop；证明它匹配用户看到的同一个失败。
3. **Trace**：读代码、测试、日志、recent diff、相关 spec / roadmap / history；找到 first bad state，而不是只看报错点。
4. **Hypothesize**：列 3-5 个候选，收敛到 1-3 个 active hypotheses；每个都写证伪方法、预期观察、实际观察。
5. **Prove**：爬完 Root Cause Proof Ladder；缺关键层级时只能写 Evidence Request 或 reroute。
6. **Freeze**：把根因、边界、测试缝隙、allowed/forbidden files 写进 `planning/tasks.md#Root Cause Contract`。
7. **Compile**：运行 `cc-devflow task-contract compile` 生成/刷新 manifest 和 meta，再 validate。
8. **Sync**：定位 source RM，回写调查结果或记录 no-op reason。

## Root Cause Proof Ladder

根因不是“报错点在哪里”，而是“坏状态第一次在哪里被制造”。每次调查必须回答：

1. `L1 Symptom Site`：用户看见的错误、失败命令、UI 状态、日志或坏 artifact。
2. `L2 First Bad State`：第一个字段、文件、缓存、队列消息、API 响应、配置或内存对象从正确变坏的位置。
3. `L3 Violated Contract`：被破坏的 schema、invariant、API contract、state transition、权限边界或时序条件。
4. `L4 Original Trigger`：制造 first bad state 的用户动作、命令、事件、recent diff、配置变化或外部响应。
5. `L5 Counterfactual Proof`：恢复 contract、替换输入、回滚 diff、固定配置或断言边界后的实际观察。
6. `L6 Escape Reason`：为什么测试、类型、验证、监控、review 或 artifact gate 没提前挡住。

硬规则：

- `First bad state` 为空时，root cause 只能是 `needs-more-evidence`。
- `Original trigger` 为空时，不能把下游 guard 写成根因修复。
- `Counterfactual proof` 为空时，假设只能停在 candidate。
- `Escape reason` 必须变成 regression test、artifact guard、capability invariant、operator check 或明确 follow-up。
- ladder 指向 spec 缺失或路线假设错误时，reroute 到 `cc-plan` 或 `roadmap`。

## Project Postmortem Recall Gate

形成最终假设前先查项目级 postmortem：

```bash
rg -n "<symptom|module|boundary|failure-class|model-risk>" devflow/postmortems
```

- `devflow/postmortems/` 不存在时，在 Root Cause Contract 记录 `no-project-postmortems-yet`。
- 有命中时读 `INDEX.md` / `principles.md`，再打开最相关的 1-2 个 incident。
- 相关 incident 必须进入假设表或反证表：同根因、相似症状不同根因、已知模型陷阱或明确不相关。
- 重复根因必须标记 `recurring` 或 `same-root-cause`。

## Output Model

默认 durable 输出只有 3 个：

1. `planning/tasks.md`
   - 唯一默认 human-authored Markdown。
   - `## Root Cause Contract` 记录症状、复现、feedback loop、证据链、Root Cause Proof Ladder、假设、confirmed root cause、repair boundary、correct test seam。
   - 后续 task blocks 只保留真正要执行的修复任务。
2. `planning/task-manifest.json`
   - CLI 生成的执行图真相源。
   - 不复制调查叙事，不承载 roadmap progress，不手工编辑。
3. `change-meta.json`
   - CLI 生成/更新的 change metadata；记录 spec / roadmap / root-cause 摘要和 work branch。

diagnose-only 仍写 `Root Cause Contract`，但 task blocks 只能包含证据交接、监控、人工动作或 reroute，不能伪装成已修复。

## Escalation Packs

只在触发时打开深层规则：

| Pack | Trigger | Open |
| --- | --- | --- |
| Boundary Probe | 多组件链路、API/service/DB/queue/build/deploy 边界断裂 | `PLAYBOOK.md#Boundary And Trace Evidence` |
| Backward Trace | 报错点很深、坏值来源不明、symptom-site guard 看起来诱人 | `references/investigation-contract.md#Backward Trace Chain` |
| Flaky / Timing | sleep、timeout、重试后消失、低复现率 | `PLAYBOOK.md#Investigation Modes` |
| Performance | 变慢、CPU/IO/query/throughput 回退 | `PLAYBOOK.md#Pattern Analysis` |
| External Research | 陌生框架/依赖/平台错误且本地证据不足 | `references/investigation-contract.md#External Research` |
| No-Code Root Cause | 环境、外部服务、配置或时序窗口 | `references/investigation-contract.md#No Code Root Cause` |
| Escalation | 三次假设失败或 loop 无法构造 | `references/investigation-contract.md#Escalation` |

如果没有触发条件，不要打开这些包。

## Roadmap Sync

退出前定位 source RM：

```bash
bash .claude/skills/cc-roadmap/scripts/locate-roadmap-item.sh --id <RM-or-FIX>
```

- `implementation drift`：回写 source RM 为 repair planned / investigation frozen，绑定 `FIX-*`。
- `missing spec truth`：写 expected spec delta 或 follow-up，必要时 reroute 到 `cc-plan`。
- `roadmap mismatch`：写回 roadmap / backlog，下一步是 `roadmap` 或 `cc-plan`，不要直接修。
- 找不到 source RM 时，在 `planning/tasks.md#Root Cause Contract` 和 `change-meta.json.roadmapSync` 记录 `no-source-rm`。

## Exit Rule

调查合格的标准很简单：

- 复现 loop 可信，并匹配用户症状。
- First bad state、original trigger、counterfactual proof 已冻结。
- 修复边界清楚到 `cc-do` 不需要二次调查。
- machine artifacts 由 CLI 生成并通过 validate。
- source RM 已同步或 no-op reason 已落盘。

如果执行者还要猜“为什么坏、修哪里、不该碰哪里、怎么证明修好了”，调查没完成。

## Companion Files

- 深入剧本：`PLAYBOOK.md`
- 变更记录：`CHANGELOG.md`
- 调查契约：`references/investigation-contract.md`
