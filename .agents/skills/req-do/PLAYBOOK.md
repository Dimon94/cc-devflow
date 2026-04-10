# Req-Do Playbook

## Execution Loop

1. 读取 `task-manifest.json`，锁定当前任务。
2. 如果是 bug，先写 `ANALYSIS.md`，建立证据链。
3. 做最小改动，不偷带“顺手重构”。
4. 更新 checkpoint / 事件记录，保证别人能接上。
5. 为 `req-check` 留下可验证的现实证据。

## Local Kit

- 恢复时看 `references/execution-recovery.md`
- 需要判断当前任务时用 `scripts/check-task-status.sh`
- 需要勾选任务时用 `scripts/mark-task-complete.sh`
- 需要确认并行安全时用 `scripts/detect-file-conflicts.sh`
- bug 分析从 `scripts/run-problem-analysis.sh` 起手

## Root Cause Protocol

- 先复现，再猜原因
- 先看最近变化，再改代码
- 先加证据点，再下结论
- 两次失败后回看证据
- 三次失败后质疑架构，退回 `req-plan`

## Recovery Standard

至少留下这些恢复信息：

- 当前任务 ID
- 已完成什么
- 卡在哪里
- 下一步唯一动作
- 相关文件 / 命令 / 观察
