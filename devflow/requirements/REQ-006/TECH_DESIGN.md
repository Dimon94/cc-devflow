# Technical Design: REQ-006 - Adapter Compiler (RM-008)

**Status**: Final
**Created**: 2025-12-19T15:30:00+08:00
**Updated**: 2025-12-19T15:30:00+08:00
**Type**: Technical Design
**Milestone**: M4

---

## 1. System Architecture

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Adapter Compiler System                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   SOURCES (SSOT)                                                            │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│   │ .claude/commands/│  │.claude/skills/   │  │skill-rules.json  │         │
│   │ *.md             │  │*/skill.md        │  │                  │         │
│   └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘         │
│            │                     │                     │                    │
│            └─────────────────────┼─────────────────────┘                    │
│                                  ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      COMPILATION PIPELINE                            │  │
│   │  ┌─────────┐   ┌─────────────┐   ┌──────────┐   ┌────────────────┐  │  │
│   │  │ Parser  │ → │ Transformer │ → │ Registry │ → │ Rules Emitters │  │  │
│   │  │         │   │             │   │ Generator│   │                │  │  │
│   │  └─────────┘   └─────────────┘   └──────────┘   └────────────────┘  │  │
│   │       ↓                                                ↓             │  │
│   │  ┌─────────────────────────────────────────────────────────────────┐│  │
│   │  │                      Command Emitters                            ││  │
│   │  │  ┌───────┐  ┌───────┐  ┌──────┐  ┌─────────────┐               ││  │
│   │  │  │ Codex │  │Cursor │  │ Qwen │  │ Antigravity │               ││  │
│   │  │  └───────┘  └───────┘  └──────┘  └─────────────┘               ││  │
│   │  └─────────────────────────────────────────────────────────────────┘│  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                  ▼                                          │
│   OUTPUTS                                                                   │
│   ┌──────────────────┬──────────────────┬──────────────────┬────────────┐  │
│   │ .codex/          │ .cursor/         │ .qwen/           │ .agent/    │  │
│   │ skills/SKILL.md  │ rules/*.mdc      │ commands/*.toml  │ rules/*.md │  │
│   │ prompts/*.md     │ commands/*.md    │                  │workflows/* │  │
│   └──────────────────┴──────────────────┴──────────────────┴────────────┘  │
│                                  ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │               devflow/.generated/manifest.json (v2.0)                │  │
│   │               devflow/.generated/skills-registry.json                │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Module Breakdown

| Module | 位置 | 职责 |
|--------|------|------|
| **Parser** | `lib/compiler/parser.js` | 解析 Markdown + YAML frontmatter |
| **Transformer** | `lib/compiler/transformer.js` | 占位符展开、路径映射 |
| **Manifest** | `lib/compiler/manifest.js` | 增量编译追踪、漂移检测 |
| **Skills Registry** | `lib/compiler/skills-registry.js` | 技能注册表生成（重写） |
| **Platforms** | `lib/compiler/platforms.js` | 平台配置注册表（新增） |
| **Rules Emitters** | `lib/compiler/rules-emitters/` | 规则入口文件生成（新增） |
| **Command Emitters** | `lib/compiler/emitters/` | 命令文件生成（现有） |

### 1.3 Data Flow

```
1. CLI 调用: npm run adapt [options]
2. 参数解析: bin/adapt.js → {platforms, check, verbose, rules}
3. 源文件扫描:
   - .claude/commands/*.md → CommandIR[]
   - .claude/skills/**/skill.md → SkillMetadata[]
   - .claude/skills/skill-rules.json → TriggerRules
4. 技能注册表生成:
   - 合并 SkillMetadata + TriggerRules → skills-registry.json
5. 规则入口文件生成 (per platform):
   - PLATFORM_CONFIG[platform] → RulesEmitter → 平台规则文件
6. 命令文件生成 (per platform, per command):
   - needsRecompile() → Transform → Format → Emit
7. Manifest 更新:
   - 记录 source/target hash → manifest.json v2.0
8. 结果输出:
   - Success: 统计编译/跳过/复制数量
   - Check: 漂移报告 + exit code
```

### 1.4 Existing Codebase Integration

**直接复用**:
- `parser.js`: gray-matter 解析，无需修改
- `transformer.js`: 占位符展开，无需修改
- `base-emitter.js`: Emitter 基类，无需修改
- 四个 Command Emitters: 继续使用
- `manifest.js`: 扩展 schema 即可

**需要扩展**:
- `skills-registry.js`: 重写以合并 skill-rules.json
- `manifest.js`: 扩展支持 skills/rulesEntry 字段

**新增模块**:
- `platforms.js`: PLATFORM_CONFIG 定义
- `rules-emitters/`: 四个平台的规则 emitter

---

## 2. Technology Stack

### 2.1 Runtime

- **Node.js**: >= 18.0.0
  - **Justification**: 现有项目依赖，ES Modules 支持
- **ES Modules**: import/export
  - **Justification**: 遵循现有代码风格

### 2.2 核心依赖

| 库 | 版本 | 用途 | Justification |
|----|------|------|---------------|
| `gray-matter` | ^4.0.3 | YAML frontmatter 解析 | 现有依赖，复用 |
| `@iarna/toml` | ^2.2.5 | TOML 序列化 (Qwen) | 现有依赖，复用 |
| `js-yaml` | ^4.1.0 | YAML 序列化 (Antigravity, Codex) | 现有依赖，复用 |
| `zod` | ^3.22.4 | Schema 验证 | 现有依赖，复用 |

### 2.3 开发依赖

| 库 | 版本 | 用途 | Justification |
|----|------|------|---------------|
| `jest` | ^29.7.0 | 单元测试 | 现有依赖，复用 |

### 2.4 Baseline Deviation Check

**Baseline Tech Stack** (from `package.json`):
- Node.js >= 18
- gray-matter ^4.0.3
- @iarna/toml ^2.2.5
- js-yaml ^4.1.0
- zod ^3.22.4
- jest ^29.7.0

**Deviations from Baseline**: **无**

本需求完全复用现有技术栈，无需引入新依赖。

---

## 3. Data Model Design

### 3.1 核心数据结构

#### PLATFORM_CONFIG (新增)

```javascript
// lib/compiler/platforms.js
const PLATFORM_CONFIG = {
  cursor: {
    name: "Cursor IDE",
    folder: ".cursor/",
    rulesEntry: {
      path: "rules/devflow.mdc",
      format: "mdc"
    },
    commandsDir: "commands/",
    commandExt: ".md",
    argumentPattern: "$ARGUMENTS",
    hasHooks: false,
    limits: {}
  },
  codex: {
    name: "Codex CLI",
    folder: ".codex/",
    rulesEntry: {
      path: "skills/cc-devflow/SKILL.md",
      format: "markdown"
    },
    commandsDir: "prompts/",
    commandExt: ".md",
    argumentPattern: "$ARGUMENTS",
    hasHooks: false,
    limits: {}
  },
  qwen: {
    name: "Qwen Code",
    folder: ".qwen/",
    rulesEntry: {
      path: "commands/devflow.toml",
      format: "toml"
    },
    commandsDir: "commands/",
    commandExt: ".toml",
    argumentPattern: "{{args}}",
    hasHooks: false,
    limits: {}
  },
  antigravity: {
    name: "Antigravity",
    folder: ".agent/",
    rulesEntry: {
      path: "rules/rules.md",
      format: "markdown"
    },
    commandsDir: "workflows/",
    commandExt: ".md",
    argumentPattern: "$ARGUMENTS",
    hasHooks: false,
    limits: {
      maxFileChars: 12000
    }
  }
};
```

#### Skills Registry (重构)

```javascript
// devflow/.generated/skills-registry.json
{
  "version": "1.0",
  "generatedAt": "ISO8601",
  "skills": [
    {
      "name": "cc-devflow-orchestrator",
      "description": "CC-DevFlow workflow router",
      "type": "domain",
      "enforcement": "suggest",
      "priority": "high",
      "skillPath": ".claude/skills/cc-devflow-orchestrator/skill.md",
      "triggers": {
        "prompt": {
          "keywords": ["devflow", "REQ-", ...],
          "intentPatterns": ["(run|execute).*flow"]
        },
        "file": {
          "pathPatterns": ["devflow/requirements/**/*.md"],
          "contentPatterns": []
        }
      }
    }
  ]
}
```

#### Manifest v2.0 (扩展)

```javascript
// devflow/.generated/manifest.json
{
  "version": "2.0",
  "generatedAt": "ISO8601",
  "entries": [
    // 命令编译记录 (现有)
    {
      "source": ".claude/commands/flow-init.md",
      "target": ".codex/prompts/flow-init.md",
      "hash": "sha256",
      "platform": "codex",
      "timestamp": "ISO8601"
    }
  ],
  "skills": [
    // 技能编译记录 (新增)
    {
      "name": "cc-devflow-orchestrator",
      "sourceHash": "sha256",
      "timestamp": "ISO8601"
    }
  ],
  "rulesEntry": {
    // 规则入口文件记录 (新增)
    "cursor": {
      "path": ".cursor/rules/devflow.mdc",
      "hash": "sha256",
      "timestamp": "ISO8601"
    },
    "codex": {
      "path": ".codex/skills/cc-devflow/SKILL.md",
      "hash": "sha256",
      "timestamp": "ISO8601"
    }
  }
}
```

### 3.2 平台输出格式

#### Cursor MDC (.mdc)

```markdown
---
description: "CC-DevFlow 工作流规则集"
globs: ["devflow/**/*", ".claude/**/*"]
alwaysApply: true
---

# CC-DevFlow Rules

## Identity
You are working with CC-DevFlow development workflow system.

## Available Skills
- **cc-devflow-orchestrator**: Route to correct /flow-* commands
- **devflow-tdd-enforcer**: Enforce TDD order
- **constitution-guardian**: Constitution compliance

## Key Commands
| Command | Description |
|---------|-------------|
| /flow-init | Initialize requirement |
| /flow-prd | Generate PRD |
| /flow-tech | Generate technical design |
| /flow-epic | Generate Epic and Tasks |
| /flow-dev | Execute development |

## Hook Compatibility
Hooks are not natively supported in Cursor. The following behaviors
are encoded as static rules:
- UserPromptSubmit: Skill activation check (manual)
- PreToolUse: TDD order validation (manual)
```

#### Codex SKILL.md

```markdown
---
name: cc-devflow
description: CC-DevFlow development workflow system
type: domain
---

# cc-devflow

CC-DevFlow is a comprehensive development workflow system.

## Skills

### cc-devflow-orchestrator
**Triggers**: devflow, REQ-, /flow-*
**Enforcement**: suggest

### devflow-tdd-enforcer
**Triggers**: TASKS.md edits
**Enforcement**: block

### constitution-guardian
**Triggers**: PRD.md, TECH_DESIGN.md edits
**Enforcement**: block

## Commands

| Command | Description |
|---------|-------------|
| flow-init | Initialize requirement structure |
| flow-prd | Generate PRD document |
| flow-tech | Generate technical design |
| flow-epic | Generate Epic and Tasks |
| flow-dev | Execute development tasks |
```

#### Qwen TOML

```toml
[skill]
name = "cc-devflow"
description = "CC-DevFlow development workflow system"
version = "1.0.0"

[skills.cc-devflow-orchestrator]
description = "Workflow router"
type = "domain"
enforcement = "suggest"
triggers = ["devflow", "REQ-", "flow-"]

[skills.devflow-tdd-enforcer]
description = "TDD order enforcement"
type = "guardrail"
enforcement = "block"

[commands]
flow-init = { description = "Initialize requirement" }
flow-prd = { description = "Generate PRD" }
flow-tech = { description = "Generate technical design" }
flow-epic = { description = "Generate Epic and Tasks" }
flow-dev = { description = "Execute development" }
```

#### Antigravity Rules

```markdown
---
description: "CC-DevFlow Rules (Part 1/1)"
---

# CC-DevFlow Rules

You are working with CC-DevFlow development workflow system.

## Skills

- **cc-devflow-orchestrator**: Route to /flow-* commands
  - Triggers: devflow, REQ-, flow-init, flow-prd

- **devflow-tdd-enforcer**: Enforce TDD order
  - Triggers: TASKS.md file changes

- **constitution-guardian**: Constitution compliance
  - Triggers: PRD.md, TECH_DESIGN.md changes

## Commands

| Command | Description |
|---------|-------------|
| /flow-init | Initialize requirement |
| /flow-prd | Generate PRD |

## Workflow Notes

This content is limited to 12,000 characters per file.
```

---

## 4. API Design

### 4.1 CLI Interface

```bash
# 基本用法
npm run adapt                           # 编译所有平台
npm run adapt -- --platform cursor      # 单平台编译
npm run adapt -- --check                # 漂移检测
npm run adapt -- --verbose              # 详细输出

# 新增选项
npm run adapt -- --rules                # 仅生成规则入口文件
npm run adapt -- --skills               # 仅生成技能注册表
```

### 4.2 程序接口

#### compile(options)

```javascript
// lib/compiler/index.js (扩展)
async function compile(options = {}) {
  const {
    sourceDir = '.claude/commands/',
    skillsDir = '.claude/skills/',
    outputBaseDir = '.',
    platforms = PLATFORMS,
    verbose = false,
    check = false,
    rules = true,      // 新增: 是否生成规则入口
    skills = true      // 新增: 是否生成技能注册表
  } = options;

  // ... 返回类型
  return {
    success: boolean,
    filesCompiled: number,
    filesSkipped: number,
    resourcesCopied: number,
    rulesGenerated: number,    // 新增
    skillsRegistered: number,  // 新增
    errors: string[],
    drift?: DriftReport[]
  };
}
```

#### generateSkillsRegistry(skillsDir, rulesPath)

```javascript
// lib/compiler/skills-registry.js (重写)
function generateSkillsRegistry(skillsDir, rulesPath) {
  // 输入:
  //   skillsDir: .claude/skills/
  //   rulesPath: .claude/skills/skill-rules.json
  // 输出:
  //   SkillRegistry[] (合并 SKILL.md + skill-rules.json)
}
```

#### RulesEmitter Interface

```javascript
// lib/compiler/rules-emitters/base-rules-emitter.js
class BaseRulesEmitter {
  get platform()    // 平台名
  get outputPath()  // 规则文件输出路径

  format(registry, commands)  // 格式化规则内容
  emit(content)               // 写入文件
}
```

### 4.3 Exit Codes

| Code | 含义 |
|------|------|
| 0 | 成功 |
| 1 | 编译错误 |
| 2 | 漂移检测失败 (--check) |
| 3 | 参数错误 |

---

## 5. Security Design

### 5.1 文件系统安全

| 控制点 | 实现 | 位置 |
|--------|------|------|
| 输出大小限制 | 2MB | `base-emitter.js:18` |
| 目录权限 | 0o755 | `base-emitter.js:57` |
| 文件权限 | 0o644 | `base-emitter.js:60` |
| 路径验证 | path.resolve + 边界检查 | emitter 层 |

### 5.2 输入验证

| 输入类型 | 验证方式 |
|----------|----------|
| Markdown frontmatter | Zod schema |
| skill-rules.json | JSON.parse + Zod |
| CLI 参数 | 白名单验证 |

### 5.3 Secret Management

**本需求不涉及敏感数据处理**:
- 无网络请求
- 无认证凭据
- 无用户数据
- 纯本地文件操作

---

## 6. Performance Design

### 6.1 增量编译策略

```
Source Change Detection:
  1. 计算源文件 SHA-256 hash
  2. 与 manifest.entries 比较
  3. 仅重编译变更文件

Skills Registry:
  1. 比较 skill-rules.json hash
  2. 比较各 skill.md hash
  3. 任一变更则重新生成

Rules Entry:
  1. 依赖 skills-registry.json
  2. skills-registry 变更则重新生成规则
```

### 6.2 性能目标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 全量编译 (189 文件) | < 5 秒 | `time npm run adapt` |
| 增量编译 (单文件变更) | < 1 秒 | `time npm run adapt` |
| 内存占用 | < 100 MB | process.memoryUsage() |

### 6.3 优化措施

- **并行处理**: 各平台独立编译，可并行
- **缓存**: manifest 缓存避免重复计算
- **延迟加载**: 按需读取 skill 文件

---

## 7. Constitution Check (Phase -1 Gates)

### 7.0 Baseline Deviation Check (ANTI-TECH-CREEP)

**Baseline Tech Stack** (from `package.json`):
- Node.js >= 18.0.0
- gray-matter ^4.0.3
- @iarna/toml ^2.2.5
- js-yaml ^4.1.0
- zod ^3.22.4
- jest ^29.7.0

**Deviation Analysis**:
- [x] **All baseline technologies reused**: 无任何替换
- [x] **All new technologies justified**: 无新增依赖
- [x] **No unnecessary refactoring**: 扩展而非重写
- [x] **No unfamiliar third-party libraries**: 无新库

**Deviations from Baseline**: **无**

**Status**: ✅ Passed

### 7.1 Simplicity Gate (Article VII)

- [x] **≤3 major modules**:
  - Parser/Transformer (现有)
  - Skills Registry (扩展)
  - Rules Emitters (新增)
- [x] **No future-proofing**: 仅实现 PRD 明确需求
- [x] **Minimal dependencies**: 零新增依赖

**Status**: ✅ Passed

### 7.2 Anti-Abstraction Gate (Article VIII)

- [x] **Direct framework usage**: 直接使用 Node.js fs/path
- [x] **Single data model**: skill-rules.json 为唯一触发规则源
- [x] **No unnecessary interfaces**: BaseEmitter 是必要抽象（多平台）

**Status**: ✅ Passed

### 7.3 Integration-First Gate (Article IX)

- [x] **Contracts defined first**: PLATFORM_CONFIG 定义在前
- [x] **Contract tests planned**: 将在 TASKS.md Phase 2 编写
- [x] **Real environment testing**: 使用真实文件系统测试

**Status**: ✅ Passed

### 7.4 Complexity Tracking

| Violation Type | Potential Violation | Justification | Approved? |
|----------------|---------------------|---------------|-----------|
| None | N/A | N/A | N/A |

---

## 8. Implementation Phases

### Phase 1: Core Infrastructure (P1)

| Task | 描述 | 依赖 |
|------|------|------|
| T01 | 创建 `platforms.js` 定义 PLATFORM_CONFIG | - |
| T02 | 重写 `skills-registry.js` 合并 skill-rules.json | T01 |
| T03 | 扩展 `manifest.js` schema 到 v2.0 | - |

### Phase 2: Rules Emitters (P1)

| Task | 描述 | 依赖 |
|------|------|------|
| T04 | 创建 `base-rules-emitter.js` | T01 |
| T05 | 实现 `cursor-rules-emitter.js` (MDC) | T04, T02 |
| T06 | 实现 `codex-rules-emitter.js` (SKILL.md) | T04, T02 |
| T07 | 实现 `qwen-rules-emitter.js` (TOML) | T04, T02 |
| T08 | 实现 `antigravity-rules-emitter.js` (12K split) | T04, T02 |

### Phase 3: Integration (P2)

| Task | 描述 | 依赖 |
|------|------|------|
| T09 | 扩展 `index.js` 集成规则生成 | T05-T08 |
| T10 | 扩展 `bin/adapt.js` 添加 --rules 选项 | T09 |
| T11 | 实现漂移检测扩展（含规则文件） | T03 |

### Phase 4: Testing & Documentation (P2-P3)

| Task | 描述 | 依赖 |
|------|------|------|
| T12 | 单元测试: skills-registry.js | T02 |
| T13 | 单元测试: rules emitters | T05-T08 |
| T14 | 集成测试: 完整编译流程 | T09 |
| T15 | 格式验证测试 (MDC/TOML lint) | T14 |
| T16 | Hook 降级文档 | T05-T08 |

---

## 9. Validation Checklist

- [x] **Section 1**: System Architecture - Complete
- [x] **Section 2**: Technology Stack - Complete (无新增依赖)
- [x] **Section 3**: Data Model Design - Complete
- [x] **Section 4**: API Design - Complete
- [x] **Section 5**: Security Design - Complete
- [x] **Section 6**: Performance Design - Complete
- [x] **Section 7**: Constitution Check - All gates passed
- [x] **No placeholders**: 无 {{PLACEHOLDER}}
- [x] **Specific technologies**: 所有技术有版本号
- [x] **Constitution compliance**: Phase -1 Gates 全部通过

**Ready for Epic Planning**: ✅ YES

---

## 10. References

### Internal
- [codebase-overview.md](research/internal/codebase-overview.md)
- [codebase-tech-analysis.md](research/codebase-tech-analysis.md)
- [research.md](research/research.md)

### External
- [Cursor Rules Spec](research/mcp/20251219/official/cursor-rules-spec.md)
- [Codex CLI Config](research/mcp/20251219/official/codex-cli-config.md)
- [Antigravity Docs](research/mcp/20251219/official/antigravity.md)
- [spec-kit Analysis](research/mcp/20251219/examples/spec-kit-analysis.md)

---

**Generated by**: tech-architect agent
**Template Version**: 1.0.0
**Constitution Version**: v2.0.0
**Next Step**: Run `/flow-epic` to generate Epic and Tasks
