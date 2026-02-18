# workflow/
> L2 | 父级: /Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/.claude/CLAUDE.md

成员清单
flow-init/SKILL.md: 需求初始化入口，调用 harness:init + harness:pack。
flow-init/context.jsonl: flow-init 的上下文注入定义。
flow-spec/SKILL.md: 计划生成入口，调用 harness:plan 产出 task-manifest。
flow-spec/context.jsonl: flow-spec 的上下文注入定义。
flow-spec/team-config.json: 旧 Team 配置资产（兼容保留，当前主链不依赖）。
flow-dev/SKILL.md: 执行入口，调用 harness:dispatch/resume 并写 checkpoint/events。
flow-dev/context.jsonl: flow-dev 的上下文注入定义。
flow-dev/dev-implementer.jsonl: 旧 dev-implementer 上下文（兼容保留）。
flow-verify/SKILL.md: 质量门禁入口，调用 harness:verify 输出 report-card。
flow-verify/context.jsonl: flow-verify 的上下文注入定义。
flow-release/SKILL.md: 发布入口，调用 harness:release + harness:janitor。
flow-release/context.jsonl: flow-release 的上下文注入定义。
flow-quality/SKILL.md: 旧质量流程技能（迁移过渡保留）。
flow-quality/context.jsonl: 旧质量流程上下文（迁移过渡保留）。
flow-fix/SKILL.md: Bug 修复流程技能。
flow-fix/context.jsonl: flow-fix 的上下文注入定义。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
