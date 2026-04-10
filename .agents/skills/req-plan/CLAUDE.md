# req-plan/
> L2 | 父级: /Users/dimon/.codex/worktrees/e599/cc-devflow/.claude/skills/CLAUDE.md
>
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

成员清单
SKILL.md: Plan 阶段协议，负责 requirement 澄清、方案冻结与任务拆解。
PLAYBOOK.md: Plan 剧本，约束输出物、placeholder 红线与过关条件。
assets/: 本地模板包，包含 brainstorm、design、tasks、manifest、context、resume 与 clarification 模板。
references/planning-contract.md: Plan 阶段的边界、任务字段和禁词契约。
scripts/parse-task-dependencies.js: 解析 `TASKS.md` 里的 phase、并行标记和文件触点。
scripts/generate-clarification-questions.sh: 从草案中提取高优先级待澄清点。
scripts/generate-clarification-report.sh: 汇总澄清结论并生成报告。
scripts/validate-scope.sh: 检查计划是否超出已声明边界。

法则: 先想清楚·再动手
