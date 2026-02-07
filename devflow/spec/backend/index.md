# Backend Specifications Index

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

后端开发规范的单一真相源 (SSOT)。所有后端相关的 Skill 通过 context.jsonl 引用此目录。

## Specifications

| File | Purpose | Status |
|------|---------|--------|
| `index.md` | 规范索引 (本文件) | Active |
| `directory-structure.md` | 目录结构约定 | Active |
| `database-guidelines.md` | 数据库与 ORM 规范 | Active |
| `error-handling.md` | 错误处理策略 | Active |
| `logging-guidelines.md` | 日志规范 | Active |

## Quick Reference

### 文件命名
- 路由文件: `{resource}.routes.ts`
- 控制器: `{resource}.controller.ts`
- 服务: `{resource}.service.ts`
- 模型: `{resource}.model.ts`
- 测试: `{resource}.test.ts`

### 目录结构
```
src/
├── routes/         # API 路由
├── controllers/    # 请求处理
├── services/       # 业务逻辑
├── models/         # 数据模型
├── middleware/     # 中间件
├── utils/          # 工具函数
├── config/         # 配置
└── types/          # TypeScript 类型
```

### 核心原则
1. **分层架构**: 路由 → 控制器 → 服务 → 模型
2. **输入验证**: 所有外部输入必须验证
3. **错误处理**: 统一错误响应格式
4. **日志记录**: 关键操作必须记录日志

## Integration

此规范被以下 Skill 引用:
- `flow-spec` (后端任务规划)
- `flow-dev` (后端开发执行)
- `flow-tech` (技术设计)

## Related Guides

- [Cross-Layer Thinking Guide](../guides/cross-layer-thinking.md) - 跨层开发思考
- [Code Reuse Thinking Guide](../guides/code-reuse-thinking.md) - 代码复用思考

---

**Last Updated**: 2026-02-07
