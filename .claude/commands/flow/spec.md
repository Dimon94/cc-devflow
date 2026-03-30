---
name: flow-spec
description: 'Generate task-manifest from requirement context. Usage: /flow:spec "REQ-123" [--overwrite]'
skill: flow-spec
---

# Flow-Spec Command (Harness Planning)

> 触发入口：执行细节由 `.claude/skills/flow-spec/SKILL.md` 定义。

## User Input

```text
$ARGUMENTS = "REQ_ID [--overwrite]"
```

## Usage

```bash
/flow:spec "REQ-123"
/flow:spec "REQ-123" --overwrite
```

## Internal Execution

- `npm run harness:plan -- --change-id <REQ_ID> [--overwrite]`

## Output

- `devflow/requirements/<REQ_ID>/task-manifest.json`
- planner 直接输入优先来自 `TASKS.md`；若没有显式任务源码，当前 harness 只会生成最小 bootstrap task
- 计划语义应优先沉淀在 `devflow/intent/<REQ_ID>/summary.md` / `facts.md` / `plan.md`

## Next Step

```bash
/flow:dev "<REQ_ID>"
```
