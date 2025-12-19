# REQ-006: Adapter Compiler (RM-008)

**Status**: Initialized - Research Complete
**Type**: Requirement
**Created**: 2025-12-19T13:44:57+08:00
**Branch**: `feature/REQ-006-adapter-compiler`
**Milestone**: M4 (Multi-Platform)
**Dependencies**: RM-006 (Agent Adapter), RM-007 (Command Emitter)

---

## Overview

实现编译式多平台适配入口：扫描 `.claude/`（commands/agents/hooks/scripts/skills/rules/constitution/guides），生成目标平台目录产物（`.codex/.cursor/.qwen/.agent` 等），并以 Skills Registry + Loader 实现渐进加载。

---

## Research Summary

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| D01: Platform Entry Files | Per-platform format | 遵循各平台官方规范 |
| D02: Skills Distribution | Registry + Loader | 渐进加载，最小化 token |
| D03: Hook Degradation | 静态规则/脚本 | 平台限制 |
| D04: Incremental Compilation | Extend manifest.json | 复用现有基础设施 |
| D05: User Distribution | npm scripts | 无额外依赖 |

### Platform Output Mapping

| Platform | Entry File | Format |
|----------|-----------|--------|
| Cursor | `.cursor/rules/*.mdc` | MDC (YAML + Markdown) |
| Codex | `.codex/skills/*/SKILL.md` | Markdown + YAML |
| Antigravity | `.agent/rules/rules.md` | Markdown |
| Qwen | `.qwen/config.yaml` | YAML |

---

## Documents

### Planning Phase
- [x] Research Complete - [research/research.md](research/research.md)
- [ ] PRD.md - Product Requirements Document
- [ ] EPIC.md - Epic Planning
- [ ] TASKS.md - Task Breakdown

### Execution Phase
- [ ] TEST_PLAN.md - Test Plan
- [ ] SECURITY_PLAN.md - Security Plan
- [x] EXECUTION_LOG.md - Event Log

### Review Phase
- [ ] TEST_REPORT.md - Test Report
- [ ] SECURITY_REPORT.md - Security Report
- [ ] RELEASE_PLAN.md - Release Plan

---

## Research Materials

### Internal Analysis
- [codebase-overview.md](research/internal/codebase-overview.md) - 189 个 `.claude/` 文件分析

### External Research (MCP)
- [cursor-rules-spec.md](research/mcp/20251219/official/cursor-rules-spec.md) - Cursor MDC 格式规范
- [codex-cli-config.md](research/mcp/20251219/official/codex-cli-config.md) - Codex CLI 配置结构
- [antigravity-rules-workflows.md](research/mcp/20251219/official/antigravity-rules-workflows.md) - Antigravity Rules/Workflows
- [context-engineering-best-practices.md](research/mcp/20251219/guides/context-engineering-best-practices.md) - 上下文工程最佳实践
- [gray-matter-usage.md](research/mcp/20251219/tutorials/gray-matter-usage.md) - YAML frontmatter 解析

---

## Acceptance Criteria

- [ ] CLI 入口 `npm run adapt -- --platform <name>` / `--all` / `--check`
- [ ] 生成平台规则入口文件（Cursor/Codex/Antigravity/Qwen）
- [ ] Skills 渐进加载（Registry + `load_skill` 脚本）
- [ ] Cursor 脚本入口（`.vscode/tasks.json`）
- [ ] 增量更新（manifest hash）
- [ ] Antigravity 12K 字符限制处理
- [ ] 用户快捷使用方式（README 文档）

---

## Workflow

1. **Planning**: `/flow-prd` → `/flow-checklist` → `/flow-tech` → `/flow-epic`
2. **Development**: `/flow-dev` (TDD approach)
3. **Quality**: `/flow-qa` (Test + Security)
4. **Release**: `/flow-release` (PR + Merge)

---

## Next Step

```bash
/flow-prd "REQ-006"
```

---

**Last Updated**: 2025-12-19T13:55:00+08:00
