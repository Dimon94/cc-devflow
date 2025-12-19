# RM-008 Adapter Compiler - Research Summary

**Requirement**: REQ-006 / RM-008: Adapter Compiler (Dynamic Context Compiler)
**Generated**: 2025-12-19T13:50:00+08:00
**Research Phase**: Stage 2.5 Complete

---

## Executive Summary

RM-008 的核心目标是将 `.claude/` 目录作为单一事实源 (SSOT)，编译生成四个目标平台的规则和工作流产物。研究表明：

1. **RM-007 Command Emitter 已完成** - 完整的 Parse → Transform → Emit 管线已实现
2. **各平台规范差异明显** - Cursor 迁移到 `.mdc` 格式，Codex 使用 `SKILL.md`，Antigravity 使用 `rules.md`
3. **技能分发是核心挑战** - 需要 Registry + Loader 模式实现渐进加载
4. **平台规则入口文件缺失** - 这是 RM-008 的主要交付物

---

## Research Sources

### Internal Analysis
| Source | Content |
|--------|---------|
| [codebase-overview.md](internal/codebase-overview.md) | 189 个 `.claude/` 文件分析，编译管线详解 |

### External Research (MCP)
| Source | Content |
|--------|---------|
| [cursor-rules-spec.md](mcp/20251219/official/cursor-rules-spec.md) | Cursor `.mdc` 格式规范，`.cursorrules` 迁移路径 |
| [codex-cli-config.md](mcp/20251219/official/codex-cli-config.md) | Codex CLI 配置结构，`SKILL.md` 发现规则 |
| [antigravity-rules-workflows.md](mcp/20251219/official/antigravity-rules-workflows.md) | Antigravity Rules/Workflows 机制 |
| [context-engineering-best-practices.md](mcp/20251219/guides/context-engineering-best-practices.md) | 2025 上下文工程最佳实践 |
| [gray-matter-usage.md](mcp/20251219/tutorials/gray-matter-usage.md) | YAML frontmatter 解析库使用 |

---

## Key Research Decisions

### Decision 1: Platform Rule Entry Files

| Platform | Entry File | Format | Status |
|----------|-----------|--------|--------|
| **Cursor** | `.cursor/rules/*.mdc` | MDC (YAML frontmatter + Markdown) | NEW - 迁移自 `.cursorrules` |
| **Codex** | `.codex/prompts/*.md` + `skills/*/SKILL.md` | Markdown + YAML | Existing pattern |
| **Antigravity** | `.agent/rules/rules.md` + `.agent/workflows/*.md` | Markdown | 200K token limit |
| **Qwen** | `.qwen/commands/*.toml` | TOML | TBD - 需进一步研究 |

**Rationale**: 各平台官方文档明确了推荐格式，RM-008 应遵循这些规范。

**Alternatives Considered**:
- 统一使用 Markdown：简化编译逻辑，但违反平台约定
- 仅生成 `.cursorrules`：Cursor 已宣布弃用

### Decision 2: Skills Registry + Loader Pattern

**决策**: 采用两阶段加载模式

```
Stage 1: Compile Time
  skill-rules.json → skills-registry.json (metadata only)
  ↓
Stage 2: Runtime
  load_skill(name) → full SKILL.md content
```

**Rationale**:
- 最小化初始上下文大小
- 遵循 Context Engineering 最佳实践：只暴露相关片段
- Codex 原生支持此模式（`~/.codex/skills/**/SKILL.md`）

**Alternatives Considered**:
- 全量注入所有技能：简单但浪费 token
- MCP 动态加载：增加复杂度，非所有平台支持

### Decision 3: Hook Degradation Strategy

| Platform | Hook Support | Degradation Strategy |
|----------|-------------|---------------------|
| Claude Code | ✅ 原生支持 | 直接使用 |
| Cursor | ❌ 无 hook | 转换为 `.mdc` 规则 |
| Codex | ❌ 无 hook | 转换为 `instructions.md` |
| Antigravity | ⚠️ 有限支持 | 转换为 Workflow |

**Rationale**: 无法在所有平台实现完整 hook 语义，降级为静态规则或显式脚本调用。

### Decision 4: Incremental Compilation

**决策**: 扩展现有 manifest.json 机制

```json
{
  "version": "2.0",
  "entries": [
    {
      "source": ".claude/commands/flow-init.md",
      "sourceHash": "abc123",
      "targets": [
        { "platform": "cursor", "path": ".cursor/rules/flow-init.mdc", "hash": "def456" },
        { "platform": "codex", "path": ".codex/prompts/flow-init.md", "hash": "ghi789" }
      ]
    }
  ],
  "skills": [
    { "name": "cc-devflow-orchestrator", "hash": "jkl012" }
  ],
  "rulesEntry": {
    "cursor": { "path": ".cursor/rules/devflow.mdc", "hash": "..." },
    "codex": { "path": ".codex/skills/cc-devflow/SKILL.md", "hash": "..." }
  }
}
```

**Rationale**: 复用现有增量编译基础设施，扩展以支持 Skills 和 Rules Entry。

### Decision 5: User Distribution & Update

**决策**: npm 脚本 + README 文档

```bash
# 编译所有平台
npm run adapt

# 单平台编译
npm run adapt -- --platform cursor

# 漂移检测
npm run adapt -- --check

# 清理生成物
npm run adapt -- --clean
```

**用户更新流程**:
1. `git pull` 获取最新 `.claude/` 源
2. `npm run adapt` 重新编译
3. 或使用 `npm run adapt -- --check` 检测漂移

**Rationale**: 符合现有工具链，无需额外依赖。

---

## Platform Output Specifications

### Cursor (.cursor/)

```
.cursor/
├── rules/
│   ├── devflow.mdc           # Main rules entry (generated)
│   ├── flow-init.mdc         # Command rules
│   └── ...
├── commands/                  # Legacy (deprecated)
├── scripts/                   # Copied from .claude/scripts/
└── docs/                      # Copied from .claude/docs/
```

**MDC Format**:
```markdown
---
description: "CC-DevFlow workflow rules"
alwaysApply: true
---

# CC-DevFlow Rules

## Skills
- cc-devflow-orchestrator: Route /flow-* commands
- constitution-guardian: Enforce Constitution

## Commands
- /flow-init: Initialize requirement
- /flow-prd: Generate PRD
...
```

### Codex (.codex/)

```
.codex/
├── prompts/
│   ├── flow-init.md
│   └── ...
├── skills/
│   └── cc-devflow/
│       └── SKILL.md           # Main skill entry (generated)
├── scripts/
└── docs/
```

**SKILL.md Format**:
```markdown
---
name: cc-devflow
description: CC-DevFlow development workflow system
---

# CC-DevFlow Skill

## Available Commands
- flow-init: Initialize requirement structure
- flow-prd: Generate PRD document
...

## Skills Registry
[Skill metadata table]
```

### Antigravity (.agent/)

```
.agent/
├── rules/
│   └── rules.md               # Main rules entry (generated)
├── workflows/
│   ├── flow-init.md
│   └── ...
├── scripts/
└── docs/
```

### Qwen (.qwen/)

```
.qwen/
├── commands/
│   ├── flow-init.toml
│   └── ...
├── config.yaml                # Main config entry (generated)
├── scripts/
└── docs/
```

---

## Implementation Priorities

### Priority 1: Core Infrastructure (Week 1)
- [ ] Extend `lib/compiler/` for rules entry generation
- [ ] Implement Skills Registry JSON generator
- [ ] Add platform-specific rules emitters

### Priority 2: Platform Outputs (Week 2)
- [ ] Cursor `.mdc` emitter
- [ ] Codex `SKILL.md` emitter
- [ ] Antigravity `rules.md` emitter
- [ ] Qwen config emitter

### Priority 3: Integration (Week 3)
- [ ] `load_skill()` script utility
- [ ] VSCode tasks.json generation
- [ ] README documentation update
- [ ] Integration tests

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Cursor `.mdc` format changes | High | Medium | Abstract emitter, monitor Cursor changelog |
| Antigravity 12K limit stricter than expected | Medium | Low | Already implemented chapter splitting |
| Qwen format undocumented | Low | High | Design flexible, TBD placeholder |
| Hook degradation insufficient | Medium | Medium | Document limitations clearly |

---

## Open Questions

1. **Qwen 官方配置格式？** - 需进一步研究或用户反馈
2. **Cursor `.mdc` 的 `globs` 字段用于技能触发？** - 需实验验证
3. **Antigravity 12K 字符限制来源？** - 研究未发现明确文档，可能需要实际测试

---

## Next Steps

1. 进入 Stage 2.6: Research Consolidation
2. 生成 `research/research.md`（决策汇总）
3. 创建功能分支
4. 更新 README 工作流

---

**Research Completed**: 2025-12-19T13:50:00+08:00
**Researcher**: Claude (flow-init agent)
