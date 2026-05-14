---
name: cc-investigate
version: 1.6.2
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
  - ../cc-roadmap/scripts/locate-roadmap-item.sh
  - ../cc-roadmap/scripts/sync-roadmap-progress.sh
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
  - Enforce the Worktree Branch Contract before writing `task.md`.
  - Reproduce or build the closest honest feedback loop before naming root cause.
  - Classify the investigation mode before tracing: reproduce-first, diff-trace, boundary-probe, backward-trace, reference-compare, condition-wait, workflow-forensics, performance, or diagnose-only.
  - Search relevant code, logs, recent history, and project postmortems before declaring the bug novel.
  - Record hypotheses with falsification methods; do not collapse first intuition into root cause.
exit_criteria:
  - "`task.md#Root Cause Contract` proves symptom site, first bad state, violated contract, original trigger, counterfactual proof, and escape reason."
  - "`task.md#Root Cause Contract` records investigation mode, feedback loop, evidence chain, tested hypotheses, boundary/backward/reference evidence when applicable, correct test seam, and diagnose-only boundary when applicable."
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
2. Reproduce：用测试、脚本、日志、浏览器路径或最小 harness 证明同一个症状。
3. Trace：找到 first bad state，而不是只给 symptom guard。
4. Hypothesize：列候选，写证伪方法，逐个打掉。
5. Prove：完成 Root Cause Proof Ladder。
6. Freeze：把根因、修复边界、测试 seam、allowed/forbidden files 写进 `task.md`。
7. Commit：提交 Investigate 阶段，再交给 `cc-do`。

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
