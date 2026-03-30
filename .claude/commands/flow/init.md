---
name: flow-init
description: 'Initialize requirement context via harness engine. Usage: /flow:init "REQ-123|Title|URLs?"'
skill: flow-init
---

# Flow-Init Command (Harness Bootstrap Entry)

> 触发入口：执行细节由 `.claude/skills/flow-init/SKILL.md` 定义。

## User Input

```text
$ARGUMENTS = "REQ_ID|TITLE|PLAN_URLS?"
```

## Usage

```bash
/flow:init "REQ-123|User Auth"
/flow:init "REQ-124|订单导出|https://plan.example.com/req-124"
```

## Internal Execution

1. `npm run harness:init -- --change-id <REQ_ID> --goal "Deliver <REQ_ID>: <TITLE>"`
2. `npm run harness:pack -- --change-id <REQ_ID>`

## Output

- `devflow/requirements/<REQ_ID>/context-package.md` (`bootstrap bridge artifact`)
- `devflow/requirements/<REQ_ID>/harness-state.json`
- 若此需求先经过 `/flow:autopilot`，继续沿用 `devflow/intent/<REQ_ID>/summary.md` / `plan.md` 作为长期语义记忆

## Next Step

```bash
/flow:spec "<REQ_ID>"
```
