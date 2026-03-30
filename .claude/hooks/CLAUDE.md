# hooks/
> L2 | 父级: /Users/dimon/.codex/worktrees/03a4/cc-devflow/.claude/CLAUDE.md

用途
`hooks/` 是 CC-DevFlow 的薄执行脊柱：在工具调用前后补上下文、守护写入边界、记录改动，并在需要时支持本地 Team 协调。

成员清单
inject-agent-context.ts: Task/subagent 上下文注入器，优先读取 `REQ context/*.jsonl`，回退到 `.claude/skills/<skill>/`.
inject-skill-context.ts: Skill 上下文注入器，按 `context.jsonl` 自动装配 Skill 所需文件。
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
1. 默认路径是上下文注入 + 守护 + 追踪，不依赖 Team。
2. Team hooks 只服务本地 Team/subagent 协调，不构成第二套主流程。
3. 上下文优先来自 `devflow/intent/<REQ>/` 与 `devflow/requirements/<REQ>/` 当前工件。
4. Team 真相源优先写入 `devflow/intent/<REQ>/artifacts/team-state.json`，旧 requirement 状态文件仅作镜像。
5. 验证失败必须阻断或回写明确原因，不能静默放过。

注册概览
`PreToolUse`: `inject-agent-context.ts`、`inject-skill-context.ts`、`pre-tool-use-guardrail.sh`
`PostToolUse`: `post-tool-use-tracker.sh`
`SubagentStop`: `ralph-loop.ts`
`TeammateIdle`: `teammate-idle-hook.ts`
`TaskCompleted`: `task-completed-hook.ts`

说明
- `inject-agent-context.ts` 依据 `subagent_type` 推断目标 Skill，并加载最贴近当前 REQ 的 JSONL。
- `inject-skill-context.ts` 让 Skill 保持 markdown-first，不需要把上下文硬编码进提示词。
- `ralph-loop.ts`、`teammate-idle-hook.ts`、`task-completed-hook.ts` 属于可选 Team 能力，默认主链仍然是 `autopilot -> init/spec/dev/verify/prepare-pr/release`。

法则: 上下文最小·守护前置·验证阻断·Team 可选

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
