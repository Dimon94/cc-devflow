---
name: flow-dev
description: 'Execute task-manifest with checkpointed parallel dispatch. Usage: /flow:dev "REQ-123" [--parallel 3] [--resume] [--max-retries N]'
skill: workflow/flow-dev
---

# Flow-Dev Command (Harness Dispatch)

> 触发入口：执行细节由 `.claude/skills/workflow/flow-dev/SKILL.md` 定义。

## User Input

```text
$ARGUMENTS = "REQ_ID [--parallel N] [--resume] [--max-retries N]"
```

## Usage

```bash
/flow:dev "REQ-123"
/flow:dev "REQ-123" --parallel 3
/flow:dev "REQ-123" --resume --max-retries 2
```

## Internal Execution

- Normal: `npm run harness:dispatch -- --change-id <REQ_ID> --parallel <N> [--max-retries <N>]`
- Resume: `npm run harness:resume -- --change-id <REQ_ID> --parallel <N> [--max-retries <N>]`

## Output

- `devflow/requirements/<REQ_ID>/task-manifest.json` (状态更新)
- `.harness/runtime/<REQ_ID>/<TASK_ID>/events.jsonl`
- `.harness/runtime/<REQ_ID>/<TASK_ID>/checkpoint.json`

## Next Step

```bash
/flow:verify "<REQ_ID>"
```
