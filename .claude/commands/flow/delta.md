---
name: flow-delta
description: Optional delta tracking for requirement evolution. Usage: /flow:delta create|list|status|apply ...
version: 6.2.0
---

# /flow:delta

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

`/flow:delta` 是一个可选的增量记录命令，不是当前主链的默认规划方式。

当前默认：

- 模糊变化 -> `/flow:autopilot --resume`
- 变化已清晰 -> `/flow:upgrade --analyze`
- 需要重建执行图 -> `/flow:spec`

只有当需求确实需要单独维护变更切片时，才使用 `/flow:delta`。

## Usage

```bash
/flow:delta create "REQ-123" "add-2fa"
/flow:delta list "REQ-123"
/flow:delta status "REQ-123" "add-2fa"
/flow:delta apply "REQ-123" "add-2fa"
```

## Delta Scope

delta 资产通常位于：

```text
devflow/requirements/REQ-123/deltas/
```

这些资产可以继续存在，但不是当前主状态面。当前主状态面依然是：

- `devflow/intent/<REQ>/plan.md`
- `devflow/intent/<REQ>/decision-log.md`
- `devflow/requirements/<REQ>/task-manifest.json`

## Apply Rule

若必须应用 delta：

1. 先确认 delta 已 approved
2. 将它视为“附加输入”
3. 应用后回写到当前 planning artifacts
4. 必要时重新运行 `/flow:spec`

## Warning

不要把 `/flow:delta` 当成当前默认规格来源。
它只是变更切片工具，主线依然是 autopilot-first。
