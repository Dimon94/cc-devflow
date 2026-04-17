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

## Reroute

- `none`
- `cc-do`
- `cc-investigate`
- `cc-plan`

## Clean-Room Rule

- 如果当前 verdict 依赖聊天叙事而不是规范工件和新鲜命令输出，先重置上下文再做裁决
- `cc-check` 是独立 evaluator，不继承 `cc-do` 的“看起来已经好了”
