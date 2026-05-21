---
name: cc-investigate
version: 1.12.0
description: Use when a bug, regression, broken task, or unexpected behavior needs root-cause investigation before coding resumes.
triggers:
  - 帮我查这个 bug
  - 先别修先找根因
  - debug this bug
  - investigate this regression
  - why is this broken
  - root cause this
reads:
  - PLAYBOOK.md
  - references/investigation-contract.md
  - docs/guides/project-postmortem.md
  - assets/TASKS_TEMPLATE.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
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
  - Git commit after the Investigate stage is complete
entry_gate:
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require next-change-key config`.
  - Assign a FIX change key through `next-change-key --prefix FIX --description "<short bug name>"`.
  - Prepare an isolated FIX worktree before writing `task.md`; keep the main checkout on `main`.
  - Enforce the Worktree Branch Contract inside the returned FIX worktree.
  - Reproduce or build the closest honest feedback loop before naming root cause.
  - Classify the investigation mode before tracing: reproduce-first, diff-trace, boundary-probe, backward-trace, reference-compare, condition-wait, workflow-forensics, performance, or diagnose-only.
  - Search relevant code, logs, recent history, and project postmortems before declaring the bug novel.
  - Inspect the current state before asking technical detail or solution questions; phenomenon questions may capture reproduction facts, but solution confirmation starts only after symptom, feedback loop, and evidence chain are grounded.
  - Run the Investigation Socratic Dialogue Protocol before freezing the repair boundary when technical details or solution shape need user confirmation.
  - Persist a Dialogue Checkpoint in `task.md#Root Cause Contract` before asking question rounds 11, 21, 31, and every next tenth round.
  - Use `../cc-dev/references/user-choice-output-protocol.md` for repair-boundary choices; prefer host-native structured choice UI and fall back to the fixed A/B/C text block only when no such tool exists.
  - Record hypotheses with falsification methods; do not collapse first intuition into root cause.
exit_criteria:
  - "`task.md#Root Cause Contract` proves symptom site, first bad state, violated contract, original trigger, counterfactual proof, and escape reason."
  - "`task.md#Root Cause Contract` records investigation mode, feedback loop, evidence chain, tested hypotheses, boundary/backward/reference evidence when applicable, correct test seam, and diagnose-only boundary when applicable."
  - "`task.md#Root Cause Contract` contains ASCII Branch Chain Analysis trees for problem chain, solution chain, and impact chain, tracing upstream root cause and downstream blast radius to the deepest proven prompt/code/provider/data source; tree connector characters stay ASCII while node text follows the configured output language."
  - "`task.md#Root Cause Contract` records Investigation Socratic Dialogue rounds, including repo-answered facts, user-answered phenomenon gaps, ten-round Dialogue Checkpoints, the 3 hidden repair assumptions, overengineering / symptom-fix challenge, adversarial review findings, and explicit user release to freeze repair tasks when confirmation was needed."
  - "`task.md` contains the repair tasks needed by `cc-do`."
  - "Evidence gaps produce Evidence Request, diagnose-only, or reroute tasks instead of fake repair tasks."
  - "No process file is created beyond `task.md`."
  - "Source roadmap progress is synced or explicitly skipped in the final response."
  - "Investigate-stage changes are committed to Git before handing off to `cc-do`."
reroutes:
  - when: The issue is actually missing scope, spec truth, or product direction.
    target: cc-plan
  - when: Project priority or sequencing is the real question.
    target: roadmap
  - when: Root cause and repair boundary are already frozen.
    target: cc-do
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 6
---

# CC-Investigate

## Read First

1. `references/checklist-contract.md`

`cc-investigate` 是 IDCA 的 `Investigate`。它把 bug 现象压成根因合同，并把修复边界写入同一个 `task.md`。

唯一默认输出：

- `devflow/changes/<change-key>/task.md`

不要生成额外过程文件。Git commit 是阶段历史，`task.md` 是根因合同。

## Iron Law

```text
NO REPAIR WITHOUT A FROZEN ROOT-CAUSE CONTRACT
```

根因不是报错点，而是坏状态第一次被制造的地方。

## Investigation Loop

1. Classify：复现优先、diff trace、boundary probe、flaky、performance、workflow forensics 或 diagnose-only。
2. Anchor：分配 FIX change key 后运行 `../cc-dev/scripts/prepare-change-worktree.sh --change-key <FIX-...>`，从主 checkout 创建或复用独立 FIX worktree；进入返回的 `WORKTREE_PATH` 后必须得到 exact-case `FIX/...` 分支。大小写碰撞或目标分支不匹配都是 setup blocker。
3. Reproduce：用测试、脚本、日志、浏览器路径或最小 harness 证明同一个症状。
4. Trace：找到 first bad state，而不是只给 symptom guard。
5. Hypothesize：列候选，写证伪方法，逐个打掉。
6. Grill：现状查完后，如果需要确认技术细节或解决方案，用一问一答继续追问；用户没有明确说足够详细前，不冻结 repair tasks。
7. Prove：完成 Root Cause Proof Ladder。
8. Freeze：把根因、ASCII Branch Chain Analysis、修复边界、测试 seam、allowed/forbidden files 写进 `task.md`。
9. Commit：提交 Investigate 阶段，再交给 `cc-do`。

## Investigation Modes

先说清这是什么类问题，再决定证据路径：

- `reproduce-first`：症状真实但复现不稳，先把现象钉死。
- `feedback-loop`：已有复现但信号慢、宽或偶然，先让 loop 更快、更准、更可复跑。
- `diff-trace`：明显 regression，先查最近变化和行为断点。
- `boundary-probe`：多组件链路断裂，逐边界记录 input、output、config/env、state、verdict。
- `backward-trace`：报错点很深或坏值来源不明，从 symptom site 追到 original trigger。
- `reference-compare`：仓库里有相似可用路径，先列 working vs broken 差异。
- `condition-wait`：flaky / sleep / timeout，找真实完成条件，不先加大等待。
- `workflow-forensics`：坏在 artifact、Git、state、tool、permission 或流程。
- `performance`：性能回归先拿 baseline、profile、query plan 或 bisect 信号。
- `diagnose-only`：只做根因报告；task blocks 只能是证据交接、监控、人工动作或 reroute。

## Evidence Flow

调查结果写入 `task.md#Root Cause Contract`，不要拆新文件：

1. Symptom Capture：用户看见什么、期望 / 实际、触发条件、影响面、复现入口。
2. Feedback Loop Contract：loop type、命令或手动 driver、expected failing signal、actual failing signal、symptom match、runtime、determinism、failure rate、sharpening plan。
3. Evidence Chain：按时间和数据流记录证据，不把代码阅读伪装成复现。
4. Boundary Probe Matrix：多组件时记录每个边界的 input、output、config/env、state、verdict。
5. Backward Trace Chain：deep error 时记录 immediate failure site、direct caller、caller chain、bad value origin、original trigger、rejected symptom-site fix。
6. Reference Comparison：记录 similar working example、broken path、differences found、accepted hypotheses、ruled-out differences。
7. Hypothesis Table：列 3-5 个候选，收敛到 1-3 个 active hypotheses；每个都有 support、counter-evidence、falsification method、expected observation、actual observation。
8. Diagnostic Instrumentation：临时 probe 必须有 tag、location、question answered、command、expected signal、actual signal、cleanup requirement。
9. Correct Test Seam：说明 regression test 是否覆盖真实触发链；只能测私有实现时，先记录设计缺口或 reroute。
10. Repair Boundary：affected module、allowed files、forbidden files、blast radius、split-or-reroute decision。
11. Investigation Socratic Dialogue：记录哪些问题由 repo 证据回答、哪些现象缺口由用户回答、3 个隐含修复假设、过度工程 / 症状修补挑战、adversarial review finding、以及用户允许冻结修复任务的原话。

## Investigation Socratic Dialogue Protocol

问题现象调研必须先看现状。`cc-investigate` 可以在复现前问最小现象事实：触发入口、期望 / 实际、影响面、最近变化、可用日志或 artifact；但不能在读代码、日志、历史、反馈 loop 之前要求用户确认技术方案。

命名原则：允许使用通用、可理解、能稳定触发正确行为的方法词，例如 `Socratic Dialogue`、`Adversarial Review`、`surgical diagnosis`、`surgical repair`；不要使用项目外读者无法理解的内部暗语或个人化来源名。

现状查完后，如果根因、repair boundary、test seam 或方案取舍仍需要用户判断，启动一问一答确认：

1. 先报告已证实事实、最强假设、被证伪假设、仍缺的技术判断。
2. 每次只问一个 D<N> 问题；按 `../cc-dev/references/user-choice-output-protocol.md` 使用 Codex `request_user_input`、Claude Code 结构化输入或固定 A/B/C fallback，给推荐答案、repo 证据、选项和如果用户反对会改变的 repair boundary。
3. 能继续通过代码、日志、测试、历史或 artifact 查明的问题，先查，不问。
4. 在冻结 repair tasks 前必须挑战 3 个隐含修复假设：first bad state 是否真的最早、repair 是否只是 symptom guard、test seam 是否覆盖真实触发链。
5. 必须做一次 adversarial review：指出当前代码或修复方案的 bug 风险、耦合、过度工程、接口膨胀、测试假象和逃逸原因。
6. 用户没有明确说“足够详细，可以冻结根因 / 进入修复 / 进入下一个阶段”或等价表达时，只能继续追问、写 Evidence Request、diagnose-only 或 reroute，不能生成 repair tasks。

用户催促跳过时，最多保留 2 个 blocking 问题；不能跳过 current-state inspection、hidden assumptions、symptom-fix challenge 和 adversarial review。

### Dialogue Checkpoint

多轮追问会消耗上下文。每完成 10 轮 user-facing question round，必须先更新 `task.md#Root Cause Contract` 的 `Dialogue Checkpoints`，再问第 11 / 21 / 31 轮问题。checkpoint 不创建新文件，必须包含：

1. round range covered 和 next question number。
2. decisions made、rejected repair options with reasons、remaining open questions。
3. evidence sources read、user answers that changed the phenomenon or repair boundary、hidden assumptions / adversarial findings so far。
4. current release status：root-cause contract 是否足够详细、repair boundary 是否仍 blocked。

会话压缩或恢复后，先读最新 checkpoint 和 `Investigation Socratic Dialogue` 字段，再继续下一轮；不要依赖聊天记忆重建根因决策。

## ASCII Branch Chain Analysis

`task.md#Root Cause Contract` 必须包含 ASCII 分叉树代码块。调查要先向上追坏状态来源，再向下追影响面，最后把修复路径也画出来。

Language rule:

- Tree structure tokens must stay ASCII: `|--`, `` `-- ``, `|`, spaces, and plain punctuation.
- Node labels, placeholder text, explanations, and evidence summaries must follow `Output language` in `task.md`.
- If `Output language` is unset, use the current conversation language and record the assumption.
- Do not hard-code English labels such as `Problem Chain` when the configured output language is not English.
- Use the Label table as the shared source for chain titles, node labels, and placeholder text.

Label table:

| Semantic slot | en | zh-CN |
| --- | --- | --- |
| problemChain | Problem Chain | 问题链 |
| symptomMarker | SYMPTOM | 症状 |
| failureSite | Failure site | 失败位置 |
| directCaller | direct caller | 直接调用方 |
| badValueState | bad value/state | 错误值或状态 |
| upstreamOrigin | Upstream origin | 上游源头 |
| codeSource | code source | 代码来源 |
| promptSource | prompt source | 提示词来源 |
| trigger | trigger | 触发条件 |
| rejectedSymptomFix | Rejected symptom fix | 已拒绝的症状修补 |
| solutionChain | Solution Chain | 解决链 |
| fixMarker | FIX | 修复 |
| firstBadStateRepair | First bad state repair | 首个错误状态修复 |
| contractRestored | Contract restored | 恢复的合同 |
| regressionSeam | Regression seam | 回归缝隙 |
| escapePrevention | Escape prevention | 逃逸预防 |
| impactChain | Impact Chain | 影响链 |
| blastRadiusMarker | BLAST RADIUS | 影响范围 |
| upstreamPreserved | Upstream preserved | 保持不变的上游 |
| downstreamAffected | Downstream affected | 受影响下游 |
| riskBranch | Risk branch | 风险分支 |
| verificationBranch | Verification branch | 验证分支 |

```text
<problemChain>
<symptomMarker>: <observed failure>
|-- <failureSite>: <file / command / UI / artifact>
|   |-- <directCaller>: <caller>
|   `-- <badValueState>: <first observed bad state>
|-- <upstreamOrigin>: <earliest proven creator>
|   |-- <codeSource>: <file / function / config>
|   |-- <promptSource>: <prompt / instruction / provider contract, or N/A>
|   `-- <trigger>: <input / event / race / migration>
`-- <rejectedSymptomFix>: <why guard-at-failure is insufficient>

<solutionChain>
<fixMarker>: <minimal repair>
|-- <firstBadStateRepair>: <change>
|-- <contractRestored>: <invariant>
|-- <regressionSeam>: <test / harness / replay>
`-- <escapePrevention>: <guard / assertion / operator check>

<impactChain>
<blastRadiusMarker>: <affected behavior>
|-- <upstreamPreserved>: <contracts that must stay unchanged>
|-- <downstreamAffected>: <callers / artifacts / docs / release>
|-- <riskBranch>: <possible regression>
`-- <verificationBranch>: <commands / evidence>
```

规则：

- `Upstream origin` 必须追到最早被证据支持的制造点；如果最早点可能是提示词，必须写出精确 prompt / provider 合同位置。
- `Impact Chain` 必须覆盖下游调用方、artifact、operator 或用户可见行为；只列修复文件不合格。
- 缺 L2、L4 或 L5 时，树里写 `unknown -> Evidence Request`，并进入 diagnose-only / reroute。

## Root Cause Proof Ladder

- L1 Symptom Site
- L2 First Bad State
- L3 Violated Contract
- L4 Original Trigger
- L5 Counterfactual Proof
- L6 Escape Reason

缺 L2、L4 或 L5 时，只能写 Evidence Request、diagnose-only 或 reroute。

Escape reason 不能写成人工提醒；它必须变成 regression test、artifact guard、capability invariant、operator check 或明确 follow-up。

## Handoff

退出时只说清：

- change key 和分支
- `task.md` 路径
- 复现 / 证据命令
- Investigate commit hash
- 下一步 `cc-do` 或 reroute


## Default Output

After freezing investigation truth, answer with:

1. Change: FIX key and `task.md` path.
2. Symptom: reproduced or closest honest feedback loop.
3. Root cause: first bad state and violated contract.
4. Repair boundary: allowed files, forbidden files, and test seam.
5. Evidence gaps: none, diagnose-only boundary, or evidence request.
6. Route: `cc-do`, `cc-plan`, `roadmap`, or `stop`.

## Checklist Contract

Follow `references/checklist-contract.md` before each pause point. The checklist is the local do-confirm/read-do contract for this skill; skip only with an explicit blocker or route.
