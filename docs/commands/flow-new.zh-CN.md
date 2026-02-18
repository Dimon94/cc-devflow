# `/flow-new` - 已废弃别名

[English](./flow-new.md) | [中文文档](./flow-new.zh-CN.md)

`/flow-new` 仅为兼容保留，不再作为主流程入口。

## 当前主链

请使用显式的 5 阶段主链：

```bash
/flow:init "REQ-123|功能标题|https://plan.example.com"
/flow:spec "REQ-123"
/flow:dev "REQ-123"
/flow:verify "REQ-123" --strict
/flow:release "REQ-123"
```

## 废弃原因

- 一键黑盒执行不利于中断恢复。
- 长时运行时阶段边界不清晰。
- 质量闸与恢复策略已统一到 `/flow:verify` 与 `/flow:dev --resume`。

## 旧命令映射

| 旧命令 | 新命令 |
|--------|--------|
| `/flow-new` | `/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release` |
| `/flow-restart` | `/flow:dev --resume` 或结合 `/flow:status` 恢复 |
| `/flow-quality` | `/flow:verify` |

## 相关命令

- [`/flow:init`](./flow-init.zh-CN.md)
- [`/flow:spec`](../../.claude/commands/flow/spec.md)
- [`/flow:dev`](../../.claude/commands/flow/dev.md)
- [`/flow:verify`](../../.claude/commands/flow/verify.md)
- [`/flow:release`](../../.claude/commands/flow/release.md)
