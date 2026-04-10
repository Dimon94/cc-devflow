# req-check/
> L2 | 父级: /Users/dimon/.codex/worktrees/e599/cc-devflow/.claude/skills/CLAUDE.md
>
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

成员清单
SKILL.md: Check 阶段协议，负责验证、质量门与完成判定。
PLAYBOOK.md: 验证剧本，约束 fresh evidence、三态 verdict 与 reroute。
assets/REPORT_CARD_TEMPLATE.json: `report-card.json` 的本地模板。
references/gate-contract.md: Check 阶段的证据字段、verdict 规则与 reroute 规则。
scripts/run-quality-gates.sh: 执行验证命令并输出结构化结果。
scripts/verify-gate.sh: 校验必需文件、命令和证据是否满足绿灯条件。

法则: 证据先于结论
