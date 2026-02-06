# Shared Specifications Index

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

跨前后端的共享规范。包含代码质量、Git 工作流、TypeScript 等通用规范。

## Specifications

| File | Purpose | Status |
|------|---------|--------|
| `index.md` | 规范索引 (本文件) | Active |
| `typescript.md` | TypeScript 规范 | Pending |
| `git.md` | Git 工作流规范 | Pending |
| `code-quality.md` | 代码质量规范 | Pending |
| `testing.md` | 通用测试规范 | Pending |

## Quick Reference

### TypeScript 规范
- 严格模式: `strict: true`
- 显式类型: 避免 `any`
- 接口优先: 优先使用 `interface` 而非 `type`

### Git 规范
- 分支命名: `feature/REQ-XXX-description`
- 提交格式: `type(scope): message`
- PR 模板: 必须填写完整

### 代码质量
- ESLint: 必须通过
- Prettier: 统一格式化
- 测试覆盖: ≥80%

## Integration

此规范被所有 Skill 引用。

---

**Last Updated**: 2026-02-06
