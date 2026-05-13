---
name: cc-investigate
version: 1.6.0
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
  - Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require query workflow-context next-change-key config`.
  - Assign a FIX change key through `next-change-key --prefix FIX --description "<short bug name>"`.
  - Enforce the Worktree Branch Contract before writing `task.md`.
  - Reproduce or build the closest honest feedback loop before naming root cause.
  - Search relevant code, logs, recent history, and project postmortems before declaring the bug novel.
exit_criteria:
  - "`task.md#Root Cause Contract` proves symptom site, first bad state, violated contract, original trigger, counterfactual proof, and escape reason."
  - "`task.md` contains the repair tasks needed by `cc-do`."
  - "No process JSON, analysis side-doc, review ledger, status file, resume file, or principles file is created."
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

不要生成 `process JSON`、`planning/analysis.md`、review 文件、status 文件、resume 文件或原则文件。Git commit 是阶段历史，`task.md` 是根因合同。

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

## Root Cause Proof Ladder

- L1 Symptom Site
- L2 First Bad State
- L3 Violated Contract
- L4 Original Trigger
- L5 Counterfactual Proof
- L6 Escape Reason

缺 L2、L4 或 L5 时，只能写 Evidence Request、diagnose-only 或 reroute。

## Handoff

退出时只说清：

- change key 和分支
- `task.md` 路径
- 复现 / 证据命令
- Investigate commit hash
- 下一步 `cc-do` 或 reroute
