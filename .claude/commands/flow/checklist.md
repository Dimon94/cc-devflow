---
name: flow-checklist
description: 'Deprecated. Checklist stage merged into /flow:verify gates.'
---

# /flow:checklist (Deprecated)

`/flow:checklist` 已废弃。

## Migration

- 使用：`/flow:verify "REQ-123"`
- 严格模式：`/flow:verify "REQ-123" --strict`

## Reason

- Checklist 功能已并入 report-card 门禁模型。
- 统一 gate 输出为 `devflow/requirements/<REQ_ID>/report-card.json`。
