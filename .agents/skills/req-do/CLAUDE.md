# req-do/
> L2 | 父级: /Users/dimon/.codex/worktrees/e599/cc-devflow/.claude/skills/CLAUDE.md
>
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

成员清单
SKILL.md: Do 阶段协议，负责实现、调试、恢复与 review 回改。
PLAYBOOK.md: 执行剧本，约束当前任务锁定、根因纪律与恢复信息。
references/execution-recovery.md: checkpoint、resume-index、handoff 的最小契约。
scripts/recover-workflow.sh: 从 requirement 目录推断当前阶段、阻塞与下一步。
scripts/check-task-status.sh: 从 `TASKS.md` 读取总体进度或单任务状态。
scripts/mark-task-complete.sh: 把 `TASKS.md` 中的任务标记为完成。
scripts/detect-file-conflicts.sh: 识别并行任务是否命中相同文件。
scripts/run-problem-analysis.sh: 生成 bug 根因分析骨架。

法则: 沿计划执行·先根因后修复
