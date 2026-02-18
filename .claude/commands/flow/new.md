---
name: flow-new
description: 'Deprecated. Use /flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release.'
---

# /flow:new (Deprecated)

`/flow:new` 已停止作为默认入口。

## Migration Path

```bash
/flow:init "REQ-123|Feature|URLs?"
/flow:spec "REQ-123"
/flow:dev "REQ-123"
/flow:verify "REQ-123" --strict
/flow:release "REQ-123"
```

## Why

- 旧一键编排耦合了已下线阶段（clarify/checklist/quality）。
- 新主链将复杂度收敛到 harness 引擎，支持 checkpoint 恢复与分层门禁。
