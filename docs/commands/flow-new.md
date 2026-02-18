# `/flow-new` - Deprecated Alias

[中文文档](./flow-new.zh-CN.md) | [English](./flow-new.md)

`/flow-new` is retained only for backward compatibility and should not be used for new workflows.

## Canonical Mainline

Use the explicit 5-stage chain:

```bash
/flow:init "REQ-123|Feature Title|https://plan.example.com"
/flow:spec "REQ-123"
/flow:dev "REQ-123"
/flow:verify "REQ-123" --strict
/flow:release "REQ-123"
```

## Why `/flow-new` Is Deprecated

- Hidden one-shot behavior made failure recovery hard.
- Stage boundaries were unclear for long-running agent execution.
- Quality gate and resume behavior are now standardized in `/flow:verify` and `/flow:dev --resume`.

## Legacy to Current Mapping

| Legacy | Current |
|--------|---------|
| `/flow-new` | `/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release` |
| `/flow-restart` | `/flow:dev --resume` or `/flow:status` guided recovery |
| `/flow-quality` | `/flow:verify` |

## Related Commands

- [`/flow:init`](./flow-init.md)
- [`/flow:spec`](../../.claude/commands/flow/spec.md)
- [`/flow:dev`](../../.claude/commands/flow/dev.md)
- [`/flow:verify`](../../.claude/commands/flow/verify.md)
- [`/flow:release`](../../.claude/commands/flow/release.md)
