---
name: flow-clarify
description: 'Deprecated. Clarification step removed from default workflow. Use /flow:spec directly.'
---

# /flow:clarify (Deprecated)

`/flow:clarify` 已从默认主链移除。

## Migration

- 直接执行：`/flow:spec "REQ-123"`
- 如需补充澄清，请将澄清结果写入：`devflow/requirements/<REQ_ID>/context-package.md`

## Reason

- 独立澄清阶段导致链路变长且可恢复点分散。
- 主链改为 `init -> spec -> dev -> verify -> release`。
