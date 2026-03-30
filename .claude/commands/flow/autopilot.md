---
name: flow-autopilot
description: 'Run the skill-first autopilot protocol. Usage: /flow:autopilot "REQ-123|模糊目标" [--resume] [--from=stage]'
skill: autopilot
---

# Flow-Autopilot Command

> 触发入口：执行细节由 `.claude/skills/autopilot/SKILL.md` 定义。

## User Input

```text
$ARGUMENTS = "REQ_ID|模糊目标 [--resume] [--from=discover|converge|delegate|execute|verify|document|prepare-pr]"
```

## Usage

```bash
/flow:autopilot "REQ-123|把当前聊天和模糊目标沉淀成可自动执行的计划"
/flow:autopilot "REQ-123|继续当前自动驾驶" --resume
/flow:autopilot "REQ-123|从验证阶段恢复" --from=verify
/flow:autopilot "REQ-123|继续当前自动驾驶" --worker-provider codex
```

## Output

- `devflow/intent/<REQ_ID>/summary.md`
- `devflow/intent/<REQ_ID>/facts.md`
- `devflow/intent/<REQ_ID>/decision-log.md`
- `devflow/intent/<REQ_ID>/plan.md`
- `devflow/intent/<REQ_ID>/delegation-map.md`
- `devflow/intent/<REQ_ID>/resume-index.md`
- `devflow/intent/<REQ_ID>/artifacts/pr-brief.md` (verify pass 后自动生成)

## Notes

- 这是总编排入口，不是新 runtime
- 计划批准后，按需调用 `flow-init / flow-spec / flow-dev / flow-verify / flow-release`
- 默认执行梯：`direct -> delegate -> team`
- 当前最薄实现已接到 `harness autopilot`，可顺序推进 `init -> pack -> plan -> delegate -> dispatch/resume -> verify -> prepare-pr`
- delegate worker 的 handoff 准备入口是 `node bin/harness.js worker --change-id <REQ> --worker <id>`
- delegate worker 的本地执行入口是 `node bin/harness.js worker-run --change-id <REQ> --worker <id> [--task <TASK>] --command "<local agent command>"`
- provider launcher 入口是 `node bin/harness.js worker-run --change-id <REQ> --worker <id> [--task <TASK>] --provider codex|claude`
- 当传入 `--worker-provider` 或 `--worker-command` 时，autopilot 会在 execute 阶段自动消费 delegated workers，再回到 controller dispatch / verify
