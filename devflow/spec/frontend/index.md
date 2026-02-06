# Frontend Specifications Index

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

前端开发规范的单一真相源 (SSOT)。所有前端相关的 Skill 通过 context.jsonl 引用此目录。

## Specifications

| File | Purpose | Status |
|------|---------|--------|
| `index.md` | 规范索引 (本文件) | Active |
| `components.md` | 组件开发规范 | Pending |
| `styling.md` | 样式规范 | Pending |
| `state.md` | 状态管理规范 | Pending |
| `testing.md` | 前端测试规范 | Pending |

## Quick Reference

### 组件命名
- 组件文件: `PascalCase.tsx`
- 样式文件: `component-name.module.css`
- 测试文件: `ComponentName.test.tsx`

### 目录结构
```
src/
├── components/     # 可复用组件
├── pages/          # 页面组件
├── hooks/          # 自定义 Hooks
├── utils/          # 工具函数
└── styles/         # 全局样式
```

### 核心原则
1. **组件单一职责**: 每个组件只做一件事
2. **Props 类型安全**: 使用 TypeScript 定义 Props
3. **样式隔离**: 使用 CSS Modules 或 Styled Components
4. **测试覆盖**: 关键组件必须有测试

## Integration

此规范被以下 Skill 引用:
- `flow-epic` (前端任务规划)
- `flow-dev` (前端开发执行)
- `flow-ui` (UI 原型生成)

---

**Last Updated**: 2026-02-06
