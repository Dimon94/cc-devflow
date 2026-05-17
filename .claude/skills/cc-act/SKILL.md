---
name: cc-act
version: 1.9.3
description: Use when verified work must be committed, handed off, pushed, or turned into a PR with the smallest durable delivery surface.
triggers:
  - 准备提 PR
  - 帮我发版
  - 收尾
  - ship this
  - handoff
  - close this requirement
reads:
  - PLAYBOOK.md
  - references/closure-contract.md
  - references/git-commit-guidelines.md
  - assets/PR_BRIEF_TEMPLATE.md
  - assets/PROJECT_POSTMORTEM_TEMPLATE.md
  - assets/PROJECT_POSTMORTEM_INDEX_TEMPLATE.md
  - docs/guides/project-postmortem.md
  - ../cc-dev/scripts/resolve-cc-devflow.sh
  - scripts/ensure-ship-branch.sh
  - scripts/evaluate-postmortem-trigger.sh
writes:
  - path: devflow/changes/<change-key>/handoff/pr-brief.md
    durability: durable
    required: false
    when: creating or updating a PR
  - path: devflow/postmortems/INDEX.md
    durability: durable
    required: false
    when: closing a FIX or recurring AI/process/engineering failure
  - path: devflow/postmortems/incidents/<date>-<change-key>.md
    durability: durable
    required: false
    when: closing a FIX or recurring AI/process/engineering failure
effects:
  - final Git commits
  - optional push or PR creation
  - archive completed change after merge when requested
entry_gate:
  - "Resolve the CLI with `../cc-dev/scripts/resolve-cc-devflow.sh require config`."
  - "Read `task.md`, Git status, latest commits, validation evidence, and current PR state when relevant."
  - "Run `scripts/evaluate-postmortem-trigger.sh --dir <change-dir>` before deciding no incident postmortem is needed."
  - "If verification changed during Act, return to `cc-check`."
  - "Pick one mode: `create-pr`, `update-pr`, `local-handoff`, or `post-merge-closeout`."
exit_criteria:
  - "All completed work is committed with coherent Conventional Commit messages."
  - "PR mode writes or refreshes only `handoff/pr-brief.md`."
  - "Postmortem trigger gate is explicit: either `POSTMORTEM_REQUIRED=no` is reported, or the incident postmortem path is written."
  - "No process file is created beyond the allowed durable outputs."
  - "Push, PR, or local handoff status is explicit."
reroutes:
  - when: Verification is stale, incomplete, or changed during Act.
    target: cc-check
  - when: Act reveals unfinished implementation or unresolved findings.
    target: cc-do
tool_budget:
  read_files: 8
  search_steps: 5
  shell_commands: 11
---

# CC-Act

`cc-act` 把已经验证的现实落地。它不再制造收尾文档农场。

允许保留的 durable 输出只有：

- `devflow/changes/<change-key>/handoff/pr-brief.md`
- `devflow/postmortems/INDEX.md`
- `devflow/postmortems/incidents/<date>-<change-key>.md`

其余状态和历史交给 Git。不要写额外过程文件。

## Ship Modes

- `create-pr`: feature branch 可推送且没有现有 PR。
- `update-pr`: 已有 PR，需要更新提交或 body。
- `local-handoff`: 不推远端，但本地 commit 和下一步清楚。
- `post-merge-closeout`: 已合并后的验证、归档、尸检。

## PR Brief

`pr-brief.md` 只服务 PR / handoff，内容来自当前 Git diff、commits、`task.md` 和验证命令。不要继承旧 PR body；每次创建或更新 PR 前重建。

## Postmortem

先运行：

```bash
scripts/evaluate-postmortem-trigger.sh --dir devflow/changes/<change-key>
```

只在这些情况写 incident postmortem：

1. change key 是 `FIX-*`。
2. 暴露重复 AI、流程、测试、release、Git 或架构错误。
3. 用户明确要求记录教训。

如果本轮会话出现了返工、reroute、三次修补仍失败、发布/Git/验证工具异常，但这些信号还没有进入 `task.md` 或 Git history，调用脚本时用 `--trigger <short-label>` 把会话证据纳入本次 gate。没有触发时，最终响应也必须写明 `POSTMORTEM_REQUIRED=no`。

尸检报告必须基于 Git 证据和验证命令。不要把教训拆成额外原则文件。

## Commit Rule

PDCA / IDCA 每个阶段或执行环境完成后都提交 Git commit。Git history 是过程记录，不再用过程文件模拟状态机。

## Exit

最终响应说明 commit、验证、PR 或本地 handoff 状态，以及是否写了 incident postmortem。
