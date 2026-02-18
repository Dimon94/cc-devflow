# 📋 命令参考文档

## 🎯 需求命令

| 命令 | 用途 | 快速示例 |
|------|------|----------|
| `/flow:init` | 📦 初始化需求上下文 | `/flow:init "REQ-123|功能"` → [详细文档](../../.claude/commands/flow/init.md) |
| `/flow:spec` | 📋 生成可执行任务清单 | `/flow:spec "REQ-123"` → [详细文档](../../.claude/commands/flow/spec.md) |
| `/flow:dev` | 🛠️ 分发/恢复任务执行 | `/flow:dev "REQ-123" --resume` → [详细文档](../../.claude/commands/flow/dev.md) |
| `/flow:verify` | ✅ 执行快速/严格质量闸 | `/flow:verify "REQ-123" --strict` → [详细文档](../../.claude/commands/flow/verify.md) |
| `/flow:release` | 🚢 发布并清理运行时 | `/flow:release "REQ-123"` → [详细文档](../../.claude/commands/flow/release.md) |
| `/flow:status` | 📊 查询开发进度 | `/flow:status REQ-123` → [详细文档](../../.claude/commands/flow/status.md) |
| `/flow:restart` | 🔄 恢复中断工作流 | `/flow:restart "REQ-123" --from=dev` → [详细文档](../../.claude/commands/flow/restart.md) |
| `/flow:update` | ✅ 更新任务进度 | `/flow:update "REQ-123" "T001"` → [详细文档](../../.claude/commands/flow/update.md) |
| `/flow:fix` | 🐛 Bug 修复流程 | `/flow:fix "BUG-001\|描述"` → [详细文档](../../.claude/commands/flow/fix.md) |

## ⚠️ 已废弃命令

| 废弃命令 | 迁移路径 |
|----------|----------|
| `/flow:new` | `/flow:init -> /flow:spec -> /flow:dev -> /flow:verify -> /flow:release` |
| `/flow:clarify` | 使用 `/flow:spec` |
| `/flow:checklist` | 使用 `/flow:verify --strict` |
| `/flow:quality` | 使用 `/flow:verify` |

## 🏗️ 核心命令

| 命令 | 用途 | 快速示例 |
|------|------|----------|
| `/core:roadmap` | 🗺️ 生成产品路线图 | `/core:roadmap` → [详细文档](./core-roadmap.md) |
| `/core:architecture` | 🏛️ 生成系统架构 | `/core:architecture` → [详细文档](./core-architecture.md) |
| `/core:guidelines` | 📘 生成项目规范 | `/core:guidelines` → [详细文档](./core-guidelines.md) |
| `/core:style` | 🎨 生成设计风格指南 | `/core:style` → [详细文档](./core-style.md) |

## 🎯 快速选择指南

```text
你的场景：
├─ 启动需求交付？ → /flow:init "REQ-123|功能|URLs"
├─ 生成可执行计划？ → /flow:spec "REQ-123"
├─ 执行或恢复开发？ → /flow:dev "REQ-123" [--resume]
├─ 进行发布门禁？ → /flow:verify "REQ-123" --strict
├─ 准备发布上线？ → /flow:release "REQ-123"
├─ 检查进度？ → /flow:status REQ-123
├─ 修复生产 Bug？ → /flow:fix "BUG-001|描述"
└─ 做项目级规划？ → /core:roadmap /core:architecture /core:guidelines
```

## 📚 相关文档

- [快速开始](../guides/getting-started.md)
- [工作流指南](../guides/workflow-guide.md)
- [最佳实践](../guides/best-practices.md)
