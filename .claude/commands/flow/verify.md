---
name: flow-verify
description: 'Run layered quality gates and produce report-card. Usage: /flow:verify "REQ-123" [--strict] [--skip-review]'
skill: workflow/flow-verify
---

# Flow-Verify Command (Harness Gates)

> 触发入口：执行细节由 `.claude/skills/workflow/flow-verify/SKILL.md` 定义。

## User Input

```text
$ARGUMENTS = "REQ_ID [--strict] [--skip-review]"
```

## Usage

```bash
/flow:verify "REQ-123"
/flow:verify "REQ-123" --strict
/flow:verify "REQ-123" --strict --skip-review
```

## Internal Execution

- `npm run harness:verify -- --change-id <REQ_ID> [--strict] [--skip-review]`

## Output

- `devflow/requirements/<REQ_ID>/report-card.json`

## Next Step

```bash
/flow:release "<REQ_ID>"
```
