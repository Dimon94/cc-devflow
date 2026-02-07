# Frontend Specifications Index

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

前端开发规范的单一真相源 (SSOT)。所有前端相关的 Skill 通过 context.jsonl 引用此目录。

## Specifications

| File | Purpose | Status |
|------|---------|--------|
| `index.md` | 规范索引 (本文件) | Active |
| `directory-structure.md` | 目录结构约定 | Active |
| `component-guidelines.md` | 组件设计规范 | Active |
| `state-management.md` | 状态管理规范 | Active |
| `quality-guidelines.md` | 代码质量标准 | Active |
| `type-safety.md` | 类型安全规范 | Active |

## Quick Reference

### 组件命名
- 组件文件: `PascalCase.tsx` 或 `kebab-case/` 目录
- 样式文件: `ComponentName.module.css`
- 测试文件: `ComponentName.test.tsx`

### 目录结构
```
src/
├── pages/          # 页面组件
├── components/     # 可复用组件
│   ├── common/     # 通用 UI 组件
│   └── business/   # 业务组件
├── hooks/          # 自定义 Hooks
├── services/       # API 服务层
├── stores/         # 状态管理
├── utils/          # 工具函数
├── types/          # TypeScript 类型
└── constants/      # 常量定义
```

### 核心原则
1. **组件单一职责**: 每个组件只做一件事
2. **Props 类型安全**: 使用 TypeScript 定义 Props
3. **本地状态优先**: 能用本地状态解决的，不用全局状态
4. **测试覆盖**: 关键组件必须有测试

## Integration

此规范被以下 Skill 引用:
- `flow-spec` (前端任务规划)
- `flow-dev` (前端开发执行)
- `flow-ui` (UI 原型生成)

## Related Guides

- [Cross-Layer Thinking Guide](../guides/cross-layer-thinking.md) - 跨层开发思考
- [Code Reuse Thinking Guide](../guides/code-reuse-thinking.md) - 代码复用思考

---

**Last Updated**: 2026-02-07
