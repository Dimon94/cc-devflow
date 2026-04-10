# skills/
> L2 | 父级: /Users/dimon/.codex/worktrees/e599/cc-devflow/.claude/CLAUDE.md
>
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

成员清单
roadmap/: 项目路线图入口；内含路线图模板、对话参考和回写脚本。
req-plan/: Plan 阶段入口；内含 brainstorm/design/tasks 模板与 scope/clarification 工具。
req-do/: Do 阶段入口；内含恢复、任务勾选、冲突检测和问题分析工具。
req-check/: Check 阶段入口；内含 report-card 模板与质量门工具。
req-act/: Act 阶段入口；内含 PR/release 模板、状态摘要与归档工具。

架构说明
- `.claude/skills/**` 是唯一真相源。
- 每个 skill 都拥有自己的 `SKILL.md + PLAYBOOK.md + assets/references/scripts`。
- `.agents/skills/**` 只允许做镜像分发，不允许拥有独立流程设计。

法则: 真相源只在 canonical skill 包·分发镜像必须同构
