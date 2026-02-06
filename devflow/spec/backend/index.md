# Backend Specifications Index

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

后端开发规范的单一真相源 (SSOT)。所有后端相关的 Skill 通过 context.jsonl 引用此目录。

## Specifications

| File | Purpose | Status |
|------|---------|--------|
| `index.md` | 规范索引 (本文件) | Active |
| `api.md` | API 设计规范 | Pending |
| `database.md` | 数据库规范 | Pending |
| `security.md` | 安全规范 | Pending |
| `testing.md` | 后端测试规范 | Pending |

## Quick Reference

### 文件命名
- 路由文件: `resource.routes.ts`
- 控制器: `resource.controller.ts`
- 服务: `resource.service.ts`
- 模型: `resource.model.ts`
- 测试: `resource.test.ts`

### 目录结构
```
src/
├── routes/         # API 路由
├── controllers/    # 请求处理
├── services/       # 业务逻辑
├── models/         # 数据模型
├── middleware/     # 中间件
└── utils/          # 工具函数
```

### 核心原则
1. **RESTful 设计**: 遵循 REST 规范
2. **输入验证**: 所有外部输入必须验证
3. **错误处理**: 统一错误响应格式
4. **日志记录**: 关键操作必须记录日志

## Integration

此规范被以下 Skill 引用:
- `flow-epic` (后端任务规划)
- `flow-dev` (后端开发执行)
- `flow-tech` (技术设计)

---

**Last Updated**: 2026-02-06
