# Gate Contract

## Verdict

- `pass`: 本次验证输出足够支持完成结论
- `fail`: 本次验证给出了明确失败证据
- `blocked`: 缺少条件，暂时无法得出 pass / fail

## Evidence

每条 evidence 至少写清：

- command
- exit code
- key observation

所有通过结论都必须来自本次新鲜证据；旧输出只能当线索，不能直接继承 verdict。

## QA Feedback Loop

行为变更和 bugfix 的 evidence 还必须说明反馈环：

- `mode`：failing test、curl / HTTP、CLI fixture、browser、trace replay、bisect、differential loop 等
- `determinism`：反馈是否稳定，flaky 时复现率是多少
- `signalSharpness`：失败是否指向目标行为，而不是语法、fixture 或 mock 问题
- `blockedReason`：无法建立 loop 时缺少什么 artifact、权限、服务或输入

没有可信 loop 的 bugfix 默认不能 `pass`。

## Reroute

- `none`
- `cc-do`
- `cc-investigate`
- `cc-plan`

## Clean-Room Rule

- 如果当前 verdict 依赖聊天叙事而不是规范工件和新鲜命令输出，先重置上下文再做裁决
- `cc-check` 是独立 evaluator，不继承 `cc-do` 的“看起来已经好了”
