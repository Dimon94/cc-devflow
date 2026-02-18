---
name: flow-spec
description: 'Generate task-manifest from requirement context. Usage: /flow:spec "REQ-123" [--overwrite]'
skill: workflow/flow-spec
---

# Flow-Spec Command (Harness Planning)

> 触发入口：执行细节由 `.claude/skills/workflow/flow-spec/SKILL.md` 定义。

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

## Next Step

```bash
/flow:dev "<REQ_ID>"
```
