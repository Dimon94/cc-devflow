---
name: flow-release
description: 'Release requirement after verify pass. Usage: /flow:release "REQ-123" [--janitor-hours N]'
skill: workflow/flow-release
---

# Flow-Release Command (Harness Release)

> 触发入口：执行细节由 `.claude/skills/workflow/flow-release/SKILL.md` 定义。

## User Input

```text
$ARGUMENTS = "REQ_ID [--janitor-hours N]"
```

## Usage

```bash
/flow:release "REQ-123"
/flow:release "REQ-123" --janitor-hours 72
```

## Internal Execution

1. `npm run harness:release -- --change-id <REQ_ID>`
2. `npm run harness:janitor -- --hours <N>` (default: `72`)

## Output

- `devflow/requirements/<REQ_ID>/RELEASE_NOTE.md`
- `devflow/requirements/<REQ_ID>/harness-state.json` (`status: released`)

## Completion

- 主链闭环：`init → spec → dev → verify → release`
