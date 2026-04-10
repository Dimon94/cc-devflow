# hooks/
> L2 | 父级: /Users/dimon/.codex/worktrees/a474/cc-devflow/.claude/CLAUDE.md

用途
`hooks/` 是 CC-DevFlow 的薄执行脊柱：提示 Skill、守住写入边界、记录改动、提醒验证责任。

成员清单
inject-agent-context.ts: 可选的 agent 上下文注入工具，当前默认不注册。
inject-skill-context.ts: 可选的 skill 上下文注入工具，当前默认不注册。
pre-tool-use-guardrail.sh: Edit/Write 前置守护，阻止越界或高风险修改。
post-tool-use-tracker.sh: Edit/Write 后置追踪，记录修改过的文件。
skill-activation-prompt.sh: 在用户触发 Skill 时补充激活提示。
error-handling-reminder.sh: 停止阶段提醒错误处理与验证责任。
ralph-loop.ts: SubagentStop 程序化验证器，负责本地循环验证与停止闸门。
teammate-idle-hook.ts: TeammateIdle 调度器，给本地 Team 分派下一步任务或等待。
task-completed-hook.ts: TaskCompleted 验证器，任务完成时跑质量检查并写回 Team 状态。
checklist-gate.js: Checklist 质量门，执行定制检查表规则。
types/team-types.d.ts: Team 协议相关类型定义。

主协议
1. 默认路径是激活提示 + 守护 + 追踪，不依赖上下文注入。
2. 真正需要的上下文应由 agent 显式读取，而不是暗中预加载。
3. 默认主链是 `roadmap` 与 `req-plan -> req-do -> req-check -> req-act`。
4. 验证失败必须阻断或回写明确原因，不能静默放过。

注册概览
`UserPromptSubmit`: `skill-activation-prompt.sh`
`PreToolUse`: `pre-tool-use-guardrail.sh`
`PostToolUse`: `post-tool-use-tracker.sh`
`Stop`: `error-handling-reminder.sh`
`SubagentStop`: `ralph-loop.ts`

说明
- `inject-agent-context.ts` 与 `inject-skill-context.ts` 仍可作为显式工具使用，但不再是默认工作流的一部分。

法则: 默认白盒·守护前置·验证阻断

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
