# skills/
> L2 | 父级: /Users/dimon/.codex/worktrees/e599/cc-devflow/AGENTS.md
>
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

成员清单
roadmap/: `.claude/skills/roadmap` 的镜像包，包含模板、参考和脚本。
req-plan/: `.claude/skills/req-plan` 的镜像包，包含计划模板与澄清工具。
req-do/: `.claude/skills/req-do` 的镜像包，包含恢复与执行工具。
req-check/: `.claude/skills/req-check` 的镜像包，包含验证模板与 gate 工具。
req-act/: `.claude/skills/req-act` 的镜像包，包含交付模板与归档工具。

镜像约束
- `.agents/skills/**` 只负责分发与触发，不拥有独立流程设计权。
- canonical 变更必须先改 `.claude/skills/**`，再同步镜像。

法则: 镜像同构 canonical·镜像不生思想
