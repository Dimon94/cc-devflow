---
name: flow-quality
description: 'Deprecated. Use /flow:verify for quick/strict quality gates.'
---

# /flow:quality (Deprecated)

`/flow:quality` 已废弃。

## Migration

```bash
/flow:verify "REQ-123"
/flow:verify "REQ-123" --strict
/flow:verify "REQ-123" --strict --skip-review
```

## Reason

- 质量验证统一收口到 harness verify。
- 门禁结果统一输出到 `report-card.json` 并作为 `/flow:release` 唯一准入条件。
