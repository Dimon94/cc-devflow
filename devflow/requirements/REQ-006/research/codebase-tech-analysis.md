# REQ-006 技术细化分析

**Generated**: 2025-12-19
**Purpose**: 深入分析现有代码库技术栈，支撑 TECH_DESIGN.md 决策

---

## 1. 数据模型模式

### 1.1 CommandIR (Intermediate Representation)

```javascript
// lib/compiler/schemas.js
const CommandIR = {
  source: {
    path: string,       // 绝对路径
    filename: string,   // 文件名（无扩展名）
    hash: string        // SHA-256 源文件哈希
  },
  frontmatter: {
    description: string,
    scripts?: object,
    templates?: object,
    guides?: object
  },
  body: string,         // Markdown 内容
  placeholders: {
    scripts: string[],  // {SCRIPT:xxx} 占位符
    templates: string[],
    guides: string[]
  }
}
```

### 1.2 Manifest Schema

```javascript
// devflow/.generated/manifest.json
{
  "version": "1.0.0",
  "generatedAt": "ISO8601",
  "entries": [
    {
      "source": ".claude/commands/flow-init.md",
      "target": ".codex/prompts/flow-init.md",
      "hash": "sha256",
      "timestamp": "ISO8601",
      "platform": "codex"
    }
  ]
}
```

### 1.3 Skill Registry 当前结构

```javascript
// lib/compiler/skills-registry.js 输出
[
  {
    name: "cc-devflow-orchestrator",
    description: "Workflow router",
    type: "domain",
    path: "/abs/path/to/skill",
    triggers: []
  }
]
```

**问题**: 当前 `skills-registry.js` 仅扫描 `SKILL.md`，未合并 `skill-rules.json` 中的触发规则。

---

## 2. API 模式

### 2.1 编译器公开接口

```javascript
// lib/compiler/index.js
compile(options = {
  sourceDir,      // 默认 .claude/commands/
  outputBaseDir,  // 默认 .
  platforms,      // ['codex', 'cursor', 'qwen', 'antigravity']
  verbose,
  check           // 漂移检测模式
})
→ {
  success: boolean,
  filesCompiled: number,
  filesSkipped: number,
  resourcesCopied: number,
  drift?: DriftReport[] // check 模式返回
}
```

### 2.2 Emitter 接口

```javascript
// lib/compiler/emitters/base-emitter.js
class BaseEmitter {
  get name()          // 平台名
  get outputDir()     // 输出目录
  get fileExtension() // 文件扩展名
  format(ir, content) // 格式化为平台格式
  emit(filename, content) // 写入文件
}
```

### 2.3 Manifest API

```javascript
// lib/compiler/manifest.js
hashContent(content)           // SHA-256
loadManifest(path)            // 加载
saveManifest(manifest, path)  // 保存
needsRecompile(src, hash, manifest, platform)  // 增量判断
addEntry(manifest, entry)     // 添加条目
checkDrift(manifest)          // 漂移检测
```

---

## 3. 认证与安全

### 3.1 安全约束

| 控制点 | 实现 | 文件位置 |
|--------|------|----------|
| 输出大小限制 | 2MB | `base-emitter.js:18` |
| 目录权限 | 0o755 | `base-emitter.js:57` |
| 文件权限 | 0o644 | `base-emitter.js:60` |
| 无网络请求 | 约定 | PRD 约束 |

### 3.2 敏感数据处理

- **不涉及**: 编译器不处理认证凭据
- **输入验证**: Zod schema 验证 frontmatter

---

## 4. 数据库/存储

### 4.1 存储模式

| 类型 | 位置 | 格式 | 用途 |
|------|------|------|------|
| 源文件 | `.claude/commands/` | Markdown | SSOT |
| 技能规则 | `.claude/skills/skill-rules.json` | JSON | 触发配置 |
| 编译清单 | `devflow/.generated/manifest.json` | JSON | 增量追踪 |
| 平台输出 | `.codex/`, `.cursor/`, etc. | 多格式 | 生成物 |

### 4.2 增量编译机制

```
Source Hash → Manifest Lookup → Skip or Recompile
                  ↓
              Target Hash → Drift Detection
```

---

## 5. 可复用组件清单

### 5.1 直接复用

| 组件 | 位置 | 复用方式 |
|------|------|----------|
| `parser.js` | 解析器 | 扩展支持技能文件 |
| `transformer.js` | 转换器 | 无需修改 |
| `manifest.js` | 清单管理 | 扩展 schema |
| `base-emitter.js` | 基类 | 继承 |
| `skills-registry.js` | 技能注册 | 重写核心逻辑 |

### 5.2 需要扩展

| 组件 | 扩展内容 |
|------|----------|
| `emitters/` | 新增规则入口 emitter |
| `manifest.js` | 添加 skills/rulesEntry 字段 |
| `bin/adapt.js` | 添加 `--rules` 选项 |

### 5.3 新增组件

| 组件 | 用途 |
|------|------|
| `lib/compiler/platforms.js` | PLATFORM_CONFIG 注册表 |
| `lib/compiler/rules-emitter.js` | 规则入口文件生成 |

---

## 6. 测试基础设施

### 6.1 现有测试

```
.claude/tests/
├── hooks/
│   ├── validate-checklist-gate.test.js
│   └── validate-tdd-order.test.js
└── (unit tests for hooks)
```

### 6.2 测试框架

- **Jest** (`devDependencies`)
- **配置**: `npm run test`

### 6.3 REQ-006 测试需求

| 测试类型 | 覆盖范围 |
|----------|----------|
| 单元测试 | `skills-registry.js`, `rules-emitter.js` |
| 集成测试 | 编译管线 E2E |
| 格式验证 | MDC/TOML lint |
| 漂移测试 | `--check` 模式 |

---

## 7. 平台格式规范

### 7.1 Cursor MDC

```markdown
---
description: "CC-DevFlow 工作流规则"
globs: ["devflow/**/*"]
alwaysApply: true
---

# CC-DevFlow Rules

规则内容...

## Skills & Commands

- /flow-init: 初始化需求
```

### 7.2 Codex SKILL.md

```markdown
---
name: cc-devflow
description: CC-DevFlow 开发工作流
type: domain
---

# cc-devflow Skill

## Commands

| Command | Description |
|---------|-------------|
| /flow-init | 初始化需求 |
```

### 7.3 Qwen TOML

```toml
[skill]
name = "cc-devflow"
description = "CC-DevFlow 开发工作流"

[commands]
flow-init = { description = "初始化需求" }
```

### 7.4 Antigravity Rules

```markdown
---
description: "CC-DevFlow Rules"
---

# CC-DevFlow

规则内容...不超过 12,000 字符
```

---

## 8. 关键代码示例

### 8.1 现有 Emitter 模式

```javascript
// cursor-emitter.js
class CursorEmitter extends BaseEmitter {
  get name() { return 'cursor'; }
  get outputDir() { return '.cursor/commands'; }
  get fileExtension() { return '.md'; }

  format(ir, transformedContent) {
    return transformedContent;  // 纯 Markdown
  }
}
```

### 8.2 Antigravity 分块逻辑

```javascript
// antigravity-emitter.js
const CONTENT_LIMIT = 12000;

splitContent(ir, content) {
  // 1. 按 ## 标题拆分
  // 2. 贪心合并小章节
  // 3. 超大章节硬拆分
  // 4. 返回 [{ filename, content }]
}
```

### 8.3 技能规则结构

```javascript
// skill-rules.json 示例
{
  "cc-devflow-orchestrator": {
    "type": "domain",
    "enforcement": "suggest",
    "promptTriggers": {
      "keywords": ["devflow", "REQ-"],
      "intentPatterns": ["(run|execute).*flow"]
    },
    "fileTriggers": {
      "pathPatterns": ["devflow/requirements/**/*.md"]
    }
  }
}
```

---

## 9. 识别的技术挑战

### 9.1 技能注册表合并

**问题**: `skills-registry.js` 与 `skill-rules.json` 数据分散

**方案**: 重写 `generateSkillsRegistry()` 合并两个数据源

```javascript
function generateSkillsRegistry(skillsDir, rulesPath) {
  const fromSKILL = parseSkillMdFiles(skillsDir);
  const fromRules = parseSkillRulesJson(rulesPath);
  return mergeRegistries(fromSKILL, fromRules);
}
```

### 9.2 规则入口文件路径

| 平台 | 当前输出目录 | 规则入口目标 |
|------|--------------|--------------|
| Cursor | `.cursor/commands/` | `.cursor/rules/devflow.mdc` |
| Codex | `.codex/prompts/` | `.codex/skills/cc-devflow/SKILL.md` |
| Qwen | `.qwen/commands/` | `.qwen/commands/devflow.toml` |
| Antigravity | `.agent/workflows/` | `.agent/rules/rules.md` |

### 9.3 Manifest Schema 扩展

```javascript
// 新增字段
{
  "version": "2.0",
  "skills": [
    { "name": "...", "hash": "..." }
  ],
  "rulesEntry": {
    "cursor": { "path": "...", "hash": "..." },
    "codex": { "path": "...", "hash": "..." }
  }
}
```

---

## 10. 实现建议

### 10.1 模块职责划分

| 模块 | 职责 |
|------|------|
| `platforms.js` | PLATFORM_CONFIG 定义 |
| `skills-registry.js` | 技能注册表生成（重写） |
| `rules-emitter.js` | 规则入口文件生成 |
| `cursor-rules-emitter.js` | Cursor MDC 格式 |
| `codex-skills-emitter.js` | Codex SKILL.md 格式 |
| `qwen-config-emitter.js` | Qwen TOML 格式 |
| `antigravity-rules-emitter.js` | Antigravity 格式 + 12K 分块 |

### 10.2 CLI 扩展

```bash
# 新增选项
npm run adapt -- --rules       # 生成规则入口文件
npm run adapt                  # 全量编译（含规则）
npm run adapt -- --check       # 漂移检测（含规则）
```

### 10.3 开发顺序建议

1. `platforms.js` - 平台注册表（基础）
2. `skills-registry.js` - 重写合并逻辑
3. 规则 emitters - 逐平台实现
4. `manifest.js` - schema 扩展
5. `bin/adapt.js` - CLI 集成
6. 测试 + 文档

---

## 11. 技术债务识别

| 债务 | 影响 | 优先级 |
|------|------|--------|
| skills-registry.js 不读取 skill-rules.json | 触发规则丢失 | HIGH |
| 无规则入口文件生成 | 其他平台功能缺失 | HIGH |
| manifest schema 仅 v1.0 | 无法追踪技能/规则 | MEDIUM |

---

## 12. 结论

### 可直接复用
- 整体编译管线架构 (Parse → Transform → Emit)
- 增量编译机制
- 安全控制 (大小限制、权限)
- Antigravity 12K 分块算法

### 需要扩展
- skills-registry.js 合并 skill-rules.json
- manifest.json schema v2.0
- 各平台规则 emitter

### 风险点
- Cursor MDC 格式可能变更（需监控）
- Antigravity 限制可能调整（已有分块算法）

---

**Document Status**: Complete
**Next Phase**: TECH_DESIGN.md 生成
