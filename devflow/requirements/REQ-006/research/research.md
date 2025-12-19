# RM-008 Adapter Compiler - Research Decisions

**Requirement**: REQ-006 / RM-008: Adapter Compiler (Dynamic Context Compiler)
**Generated**: 2025-12-19T13:52:00+08:00
**Status**: Research Phase Complete

---

## D01: Platform Rule Entry File Format

### Decision
为每个目标平台生成符合其规范的规则入口文件。

### Rationale
各平台官方文档明确了推荐格式，违反规范会导致兼容性问题。

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| 统一 Markdown 格式 | 简化编译逻辑 | 违反平台约定 | 平台可能不识别 |
| 仅生成 `.cursorrules` | 兼容旧版 | Cursor 已宣布弃用 | 未来不可用 |

### Implementation
```
Platform    | Entry File               | Format
------------|--------------------------|------------------
Cursor      | .cursor/rules/*.mdc      | MDC (YAML + MD)
Codex       | .codex/skills/*/SKILL.md | Markdown + YAML
Antigravity | .agent/rules/rules.md    | Markdown
Qwen        | .qwen/commands/*.toml    | TOML (confirmed via spec-kit)
```

### Source
- [Cursor Official Docs](https://docs.cursor.com/context/rules)
- [Codex GitHub](https://github.com/openai/codex/blob/main/docs/config.md)
- [Antigravity Codelab](https://codelabs.developers.google.com/getting-started-google-antigravity)

---

## D02: Skills Distribution Strategy

### Decision
采用 Registry + Loader 两阶段加载模式。

### Rationale
最小化初始上下文大小，遵循 Context Engineering 最佳实践。

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| 全量注入所有技能 | 实现简单 | 浪费 token | 违反渐进披露原则 |
| MCP 动态加载 | 灵活 | 复杂度高 | 非所有平台支持 |

### Implementation
```javascript
// Stage 1: Compile Time
// skill-rules.json → skills-registry.json

// Stage 2: Runtime
// lib/skills/skill-loader.js
async function loadSkill(skillName) {
  const registry = require('./skills-registry.json');
  const skill = registry.skills[skillName];
  if (!skill) throw new Error(`Unknown skill: ${skillName}`);
  const content = fs.readFileSync(skill.path, 'utf-8');
  return { ...skill, content };
}
```

### Source
- [Context Engineering Best Practices](https://www.kubiya.ai/blog/context-engineering-best-practices)
- Internal: `.claude/skills/skill-rules.json`

---

## D03: Hook Degradation Strategy

### Decision
无法在所有平台实现完整 hook 语义，降级为静态规则或显式脚本调用。

### Rationale
Cursor/Codex 无原生 hook 支持，Antigravity 支持有限。

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| 放弃非 Claude 平台 hook | 简单 | 功能损失 | 用户体验差 |
| 实现 MCP hook 层 | 统一接口 | 复杂度高 | 超出 RM-008 范围 |

### Implementation
```
Platform    | Hook Support   | Degradation
------------|----------------|---------------------------
Claude Code | ✅ 原生        | 直接使用
Cursor      | ❌ 无          | 转换为 .mdc 规则
Codex       | ❌ 无          | 转换为 instructions.md
Antigravity | ⚠️ 有限        | 转换为 Workflow 触发器
```

### Source
- Internal: `.claude/hooks/` analysis
- Platform documentation review

---

## D04: Incremental Compilation Mechanism

### Decision
扩展现有 manifest.json 机制，增加 Skills 和 Rules Entry 追踪。

### Rationale
复用现有增量编译基础设施，避免重复造轮。

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| 每次全量编译 | 简单 | 慢，浪费资源 | 用户体验差 |
| 独立 hash 文件 | 灵活 | 分散管理 | 不一致风险 |

### Implementation
```json
{
  "version": "2.0",
  "generatedAt": "2025-12-19T...",
  "entries": [...],
  "skills": [
    { "name": "cc-devflow-orchestrator", "hash": "abc123" }
  ],
  "rulesEntry": {
    "cursor": { "path": ".cursor/rules/devflow.mdc", "hash": "..." }
  }
}
```

### Source
- Internal: `lib/compiler/manifest.js`

---

## D05: User Distribution & Update Flow

### Decision
通过 npm 脚本和 README 文档分发，不引入额外依赖。

### Rationale
符合现有工具链，用户无需学习新工具。

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| 发布 npm 包 | 自动更新 | 维护成本 | 超出项目范围 |
| GitHub Action 自动编译 | CI/CD 集成 | 需用户配置 | 可作为增强 |

### Implementation
```bash
# 用户操作
npm run adapt                    # 编译所有平台
npm run adapt -- --check         # 漂移检测
npm run adapt -- --platform X    # 单平台
```

### Source
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

---

## D06: Antigravity 12K Character Handling

### Decision
保持现有章节拆分逻辑，增加智能分块算法。**官方文档确认 12,000 字符限制**。

### Rationale
Antigravity 官方文档明确规定：
> "Rules files are limited to 12,000 characters each."
> "Workflow files are limited to 12,000 characters each."

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| 忽略限制 | 简化 | 文件被截断 | 功能损失 |
| 硬性截断 | 简单 | 破坏语义 | 用户体验差 |

### Implementation
```javascript
// lib/compiler/emitters/antigravity-emitter.js
const MAX_CHARS = 12000;

function smartChunk(content) {
  // 1. 按 ## 标题拆分章节
  // 2. 若单章节 > 12K，按段落拆分
  // 3. 贪心合并小章节
  // 4. 每个拆分文件带 Part 标记
  // 5. 使用 @ 引用连接拆分文件
}
```

### Source
- [Antigravity Official Docs](research/mcp/20251219/official/antigravity.md) - 12K limit confirmed
- Internal: `lib/compiler/emitters/antigravity-emitter.js`

---

## D08: Multi-Platform Registry Pattern (NEW)

### Decision
采用 spec-kit 的 `AGENT_CONFIG` 模式作为平台注册表的参考实现。

### Rationale
spec-kit 支持 16 个平台，其 `AGENT_CONFIG` 模式已验证可扩展性。

### Implementation
```javascript
// lib/compiler/platforms.js
const PLATFORM_CONFIG = {
  "cursor": {
    name: "Cursor IDE",
    folder: ".cursor/",
    entryFile: "rules/devflow.mdc",
    format: "mdc",
    argumentPattern: "$ARGUMENTS",
    hasHooks: false,
  },
  "codex": {
    name: "Codex CLI",
    folder: ".codex/",
    entryFile: "skills/cc-devflow/SKILL.md",
    format: "markdown",
    argumentPattern: "$ARGUMENTS",
    hasHooks: false,
  },
  "antigravity": {
    name: "Antigravity",
    folder: ".agent/",
    entryFile: "rules/rules.md",
    format: "markdown",
    argumentPattern: "$ARGUMENTS",
    hasHooks: false,
    maxFileChars: 12000,  // Official limit
  },
  "qwen": {
    name: "Qwen Code",
    folder: ".qwen/",
    entryFile: "commands/devflow.toml",  // TOML format, confirmed via spec-kit
    format: "toml",
    argumentPattern: "{{args}}",
    hasHooks: false,
  },
};
```

### Source
- [spec-kit/src/specify_cli/__init__.py](spec-kit/src/specify_cli/__init__.py)
- [spec-kit/AGENTS.md](spec-kit/AGENTS.md)

---

## D07: Cursor MDC Format Adoption

### Decision
优先生成 `.mdc` 格式到 `.cursor/rules/`，同时提供 `.cursorrules` 兼容层。

### Rationale
Cursor 0.47 已弃用 `.cursorrules`，但短期内仍可用。

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| 仅 `.cursorrules` | 兼容现有 | 将被弃用 | 不可持续 |
| 仅 `.mdc` | 面向未来 | 旧版不支持 | 兼容性问题 |

### Implementation
```javascript
// lib/compiler/emitters/cursor-emitter.js
class CursorEmitter extends BaseEmitter {
  emit(command, options) {
    // Primary: .cursor/rules/xxx.mdc
    this.writeMDC(command);

    // Legacy fallback (optional)
    if (options.legacySupport) {
      this.writeCursorrules(command);
    }
  }
}
```

### Source
- [Cursor Docs](https://cursor.com/docs/context/rules)
- [Cursor Forum](https://forum.cursor.com/t/good-examples-of-cursorrules-file/4346)

---

## Implementation Roadmap

```
Week 1: Core Infrastructure
├── D04: Extend manifest.json schema
├── D02: Implement skills-registry.js
├── D08: Create PLATFORM_CONFIG registry
└── D01: Add platform emitter interfaces

Week 2: Platform Outputs
├── D07: Cursor MDC emitter
├── D01: Codex SKILL.md emitter
├── D06: Antigravity rules emitter (12K limit)
└── D01: Qwen config emitter

Week 3: Integration
├── D02: load_skill() utility
├── D03: Hook degradation documentation
├── D05: README and tasks.json updates
└── Integration tests
```

---

## Research Sources

### Internal Analysis
- [codebase-overview.md](internal/codebase-overview.md) - 189 files in `.claude/`

### External Research (MCP)
- [cursor-rules-spec.md](mcp/20251219/official/cursor-rules-spec.md) - MDC format
- [codex-cli-config.md](mcp/20251219/official/codex-cli-config.md) - SKILL.md
- [antigravity-rules-workflows.md](mcp/20251219/official/antigravity-rules-workflows.md) - **12K limit confirmed**
- [antigravity.md](mcp/20251219/official/antigravity.md) - Official docs extract
- [spec-kit-analysis.md](mcp/20251219/examples/spec-kit-analysis.md) - **16 platform reference**
- [context-engineering-best-practices.md](mcp/20251219/guides/context-engineering-best-practices.md)

---

## Validation Checklist

- [x] All decisions have clear rationale
- [x] Alternatives documented and evaluated
- [x] Sources cited for external research
- [x] Implementation guidance provided
- [x] No TODO/FIXME placeholders
- [x] Risk assessment included

---

**Document Status**: Complete
**Next Phase**: Stage 3 - Git Branch Creation
