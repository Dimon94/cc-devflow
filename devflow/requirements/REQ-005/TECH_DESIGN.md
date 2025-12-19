# Technical Design: REQ-005 - Command Emitter (Multi-Platform Adapter Compiler)

**Status**: Draft
**Created**: 2025-12-18T18:30:00Z
**Updated**: 2025-12-18T18:30:00Z
**Type**: Technical Design
**Roadmap Item**: RM-007
**Milestone**: M4 (Q2-2026)

---

## 1. System Architecture

### 1.1 Architecture Overview

Command Emitter 是一个本地 CLI 编译工具，采用经典的三阶段编译管线架构：Parse -> Transform -> Emit。

```
                                      .claude/commands/*.md (SSOT)
                                               |
                                               v
                     +--------------------------------------------------+
                     |              PARSER MODULE                       |
                     |  gray-matter: Extract frontmatter + body         |
                     |  Output: Command IR (Intermediate Representation)|
                     +--------------------------------------------------+
                                               |
                                               v
                     +--------------------------------------------------+
                     |            TRANSFORMER MODULE                    |
                     |  - Resolve {SCRIPT:<alias>} from frontmatter     |
                     |  - Resolve {AGENT_SCRIPT} from agent_scripts     |
                     |  - Platform-specific $ARGUMENTS mapping          |
                     |  Output: Transformed content per platform        |
                     +--------------------------------------------------+
                                               |
                  +-------------+-------------+-------------+-------------+
                  |             |             |             |             |
                  v             v             v             v             v
          +-----------+  +-----------+  +-----------+  +-----------+  +-----------+
          |  Codex    |  |  Cursor   |  |   Qwen    |  |Antigravity|  | Manifest  |
          |  Emitter  |  |  Emitter  |  |  Emitter  |  |  Emitter  |  | Generator |
          +-----------+  +-----------+  +-----------+  +-----------+  +-----------+
                  |             |             |             |             |
                  v             v             v             v             v
          .codex/        .cursor/      .qwen/        .agent/       devflow/
          prompts/       commands/     commands/     workflows/    .generated/
          *.md           *.md          *.toml        *.md          manifest.json
```

### 1.2 Module Breakdown

- **Parser Module** (`lib/compiler/parser.js`):
  - 使用 gray-matter 解析 `.claude/commands/*.md`
  - 提取 YAML frontmatter (name, description, scripts, agent_scripts)
  - 提取 Markdown body
  - 输出结构化的 Command IR

- **Transformer Module** (`lib/compiler/transformer.js`):
  - 接收 Command IR 和目标平台标识
  - 展开 `{SCRIPT:<alias>}` 占位符
  - 展开 `{AGENT_SCRIPT}` 占位符
  - 映射 `$ARGUMENTS` 到平台特定语法
  - 输出展开后的内容字符串

- **Emitter Modules** (`lib/compiler/emitters/`):
  - `codex-emitter.js`: 生成 `.codex/prompts/*.md` (Markdown + YAML frontmatter)
  - `cursor-emitter.js`: 生成 `.cursor/commands/*.md` (纯 Markdown)
  - `qwen-emitter.js`: 生成 `.qwen/commands/*.toml` (TOML 格式)
  - `antigravity-emitter.js`: 生成 `.agent/workflows/*.md` (Markdown + YAML frontmatter, 12K 限制)

- **Manifest Module** (`lib/compiler/manifest.js`):
  - 生成 `devflow/.generated/manifest.json`
  - 记录 source/target/hash/timestamp/platform
  - 支持增量编译和漂移检测

- **CLI Entry** (`bin/adapt.js`):
  - 解析命令行参数 (`--platform`, `--all`, `--check`)
  - 协调编译管线执行
  - 输出编译结果摘要

### 1.3 Data Flow

**编译流程**:

1. CLI Entry 接收参数 (`npm run adapt -- --platform codex`)
2. CLI 调用 Parser 扫描 `.claude/commands/*.md`
3. Parser 对每个文件:
   - 使用 gray-matter 解析 frontmatter 和 body
   - 验证必需字段 (name, description)
   - 验证 scripts alias 存在性
   - 构建 Command IR
4. CLI 将 Command IR 传递给 Transformer
5. Transformer 对每个目标平台:
   - 展开占位符
   - 生成平台特定内容
6. CLI 将内容传递给对应 Emitter
7. Emitter 写入目标目录
8. Manifest Generator 更新 manifest.json

**错误处理流程**:

1. 文件不存在 -> Parser 抛出 FileNotFoundError
2. 缺少 frontmatter -> Parser 抛出 MissingFrontmatterError
3. 未知 script alias -> Transformer 抛出 UnknownAliasError
4. 写入失败 -> Emitter 抛出 WriteError
5. 所有错误 -> CLI 捕获并输出详细错误信息，返回非零退出码

### 1.4 Existing Codebase Integration

**复用现有代码**:

- `lib/adapters/adapter-interface.js`: 参考 `AgentAdapter` 的 `name`/`folder` 模式设计 Emitter 接口
- `lib/adapters/codex-adapter.js`: 参考 `detect()` 机制检测目标平台目录存在性
- `config/adapters.yml`: 参考配置结构设计平台配置

**遵循现有模式**:

- 文件命名: kebab-case (如 `codex-emitter.js`)
- 模块导出: CommonJS (`module.exports`)
- 错误处理: 抛出具体错误类型，CLI 统一捕获
- 日志输出: 使用现有 `lib/adapters/logger.js` 模式

**扩展点**:

- 新增 `lib/compiler/` 目录存放编译器模块
- 新增 `bin/adapt.js` 作为 CLI 入口
- 新增 `devflow/.generated/` 存放编译产物元数据

---

## 2. Technology Stack

### 2.1 Backend (Node.js CLI Tool)

- **Runtime**: Node.js >= 18 (ESM 支持)
  - **Justification**: 使用现有 cc-devflow 的 Node.js 环境，package.json 已声明 `"engines": {"node": ">=18"}`

- **Language**: JavaScript (ESM)
  - **Justification**: 与现有 `lib/adapters/*.js` 保持一致，避免引入 TypeScript 编译步骤

- **Frontmatter Parser**: gray-matter ^4.0.3
  - **Justification**: PRD 明确要求；de facto 标准库，97 code snippets，High reputation

- **YAML Serializer**: js-yaml ^4.1.0
  - **Justification**: 已在 package.json 中，用于输出 Codex/Antigravity 的 YAML frontmatter

- **TOML Serializer**: @iarna/toml ^2.2.5
  - **Justification**: PRD 明确要求；用于生成 Qwen TOML 格式

- **Hash Generator**: Node.js crypto (内置)
  - **Justification**: PRD 明确要求；用于生成 SHA-256 内容哈希

- **Validation**: Zod ^3.22.4
  - **Justification**: 已在 package.json 中，用于验证 frontmatter schema

### 2.2 Infrastructure

- **Build Tool**: 无需构建（直接运行 JavaScript）
  - **Justification**: 保持简单，避免引入 TypeScript/Babel 编译步骤

- **Package Manager**: npm
  - **Justification**: 使用现有 package.json 配置

- **Testing**: Jest ^29.7.0
  - **Justification**: 已在 devDependencies 中

### 2.3 Deviation from Baseline

| New Technology | PRD Requirement | Justification | Status |
|----------------|-----------------|---------------|--------|
| gray-matter ^4.0.3 | Story 1: frontmatter 解析 | PRD 明确要求，解析 YAML frontmatter 的标准库 | Approved |
| @iarna/toml ^2.2.5 | Story 3: Qwen TOML 输出 | PRD 明确要求，Qwen 平台使用 TOML 格式 | Approved |

**Note**: gray-matter 和 @iarna/toml 是 PRD 明确要求的新依赖，用于特定功能需求。

---

## 3. Data Model Design

### 3.1 Command IR (Intermediate Representation)

Command IR 是编译器内部的数据结构，不涉及数据库。

```javascript
/**
 * Command IR - 解析后的命令中间表示
 * @typedef {Object} CommandIR
 */
const CommandIRSchema = z.object({
  // 源文件信息
  source: z.object({
    path: z.string(),           // 源文件绝对路径
    filename: z.string(),       // 文件名 (不含扩展名)
    hash: z.string(),           // SHA-256 内容哈希
  }),

  // Frontmatter 字段
  frontmatter: z.object({
    name: z.string(),           // 命令名称 (必需)
    description: z.string(),    // 命令描述 (必需)
    scripts: z.record(z.string()).optional(), // alias -> path 映射
    agent_scripts: z.object({   // 可选的 agent 脚本
      sh: z.string().optional(),
      ps: z.string().optional(),
    }).optional(),
  }),

  // 正文内容
  body: z.string(),             // Markdown 正文

  // 占位符分析结果
  placeholders: z.object({
    scriptAliases: z.array(z.string()),    // 使用的 {SCRIPT:*} alias 列表
    hasAgentScript: z.boolean(),           // 是否使用 {AGENT_SCRIPT}
    hasArguments: z.boolean(),             // 是否使用 $ARGUMENTS
  }),
});
```

### 3.2 Manifest Schema

```javascript
/**
 * Manifest Entry - 单个编译产物记录
 * @typedef {Object} ManifestEntry
 */
const ManifestEntrySchema = z.object({
  source: z.string(),           // 源文件相对路径
  target: z.string(),           // 目标文件相对路径
  sourceHash: z.string(),       // 源文件 SHA-256
  targetHash: z.string(),       // 目标文件 SHA-256
  platform: z.enum(['codex', 'cursor', 'qwen', 'antigravity']),
  timestamp: z.string(),        // ISO 8601 UTC
});

/**
 * Manifest - 完整编译清单
 * @typedef {Object} Manifest
 */
const ManifestSchema = z.object({
  version: z.literal('1.0.0'),
  generated: z.string(),        // ISO 8601 UTC
  entries: z.array(ManifestEntrySchema),
});
```

### 3.3 Platform Config Schema

```javascript
/**
 * Platform Config - 平台配置
 * @typedef {Object} PlatformConfig
 */
const PlatformConfigSchema = z.object({
  name: z.string(),             // 平台标识 (codex, cursor, qwen, antigravity)
  outputDir: z.string(),        // 输出目录 (.codex/prompts, .cursor/commands, etc.)
  fileExtension: z.enum(['.md', '.toml']),
  format: z.enum(['markdown', 'markdown-yaml-frontmatter', 'toml']),
  argumentPlaceholder: z.string().optional(), // $ARGUMENTS 的替换值
  contentLimit: z.number().optional(),        // 内容字符数限制 (Antigravity: 12000)
  frontmatterFields: z.array(z.string()).optional(), // 需要的 frontmatter 字段
});
```

### 3.4 Entity Relationships

```
CommandIR (1) ----< (N) ManifestEntry
  |
  +--- source: 源文件信息
  +--- frontmatter: 解析的元数据
  +--- body: Markdown 正文
  +--- placeholders: 占位符分析

ManifestEntry (N) >---- (1) Manifest
  |
  +--- source: 源文件路径
  +--- target: 目标文件路径
  +--- sourceHash/targetHash: 内容哈希
  +--- platform: 目标平台
  +--- timestamp: 生成时间
```

---

## 4. API Design

### 4.1 Module Interfaces

由于 Command Emitter 是 CLI 工具而非 API 服务器，本节定义模块的函数接口。

#### Parser Module (`lib/compiler/parser.js`)

```javascript
/**
 * 解析单个命令文件
 * @param {string} filePath - 命令文件绝对路径
 * @returns {Promise<CommandIR>} 解析后的 Command IR
 * @throws {MissingFrontmatterError} 缺少 frontmatter
 * @throws {InvalidFrontmatterError} frontmatter 格式错误
 */
async function parseCommand(filePath) {}

/**
 * 批量解析命令目录
 * @param {string} dirPath - 命令目录路径 (.claude/commands/)
 * @returns {Promise<CommandIR[]>} Command IR 数组
 */
async function parseCommands(dirPath) {}

module.exports = { parseCommand, parseCommands };
```

**Validation Rules**:
- `filePath`: 必须是 `.md` 文件
- `frontmatter.name`: 必需，非空字符串
- `frontmatter.description`: 必需，非空字符串
- `frontmatter.scripts`: 如存在，每个值必须是有效路径

**Errors**:
- `MissingFrontmatterError`: 文件缺少 YAML frontmatter
- `InvalidFrontmatterError`: frontmatter 格式错误或缺少必需字段
- `FileReadError`: 文件读取失败

#### Transformer Module (`lib/compiler/transformer.js`)

```javascript
/**
 * 转换 Command IR 为目标平台内容
 * @param {CommandIR} ir - Command IR
 * @param {string} platform - 目标平台 (codex, cursor, qwen, antigravity)
 * @returns {string} 转换后的内容
 * @throws {UnknownAliasError} 引用了未定义的 script alias
 */
function transform(ir, platform) {}

/**
 * 展开 {SCRIPT:<alias>} 占位符
 * @param {string} content - 原始内容
 * @param {Object} scripts - alias -> path 映射
 * @returns {string} 展开后的内容
 */
function expandScriptPlaceholders(content, scripts) {}

/**
 * 展开 {AGENT_SCRIPT} 占位符
 * @param {string} content - 原始内容
 * @param {Object} agentScripts - { sh, ps } 脚本内容
 * @param {string} platform - 目标平台
 * @returns {string} 展开后的内容
 */
function expandAgentScript(content, agentScripts, platform) {}

/**
 * 映射 $ARGUMENTS 到平台语法
 * @param {string} content - 原始内容
 * @param {string} platform - 目标平台
 * @returns {string} 映射后的内容
 */
function mapArguments(content, platform) {}

module.exports = { transform, expandScriptPlaceholders, expandAgentScript, mapArguments };
```

**Platform Argument Mapping**:

| Source | Codex | Cursor | Qwen | Antigravity |
|--------|-------|--------|------|-------------|
| `$ARGUMENTS` | `$ARGUMENTS` (保持) | `$ARGUMENTS` (保持) | `{{args}}` | `[arguments]` |

**Errors**:
- `UnknownAliasError`: `{SCRIPT:xxx}` 引用了 frontmatter.scripts 中不存在的 alias

#### Emitter Interface (`lib/compiler/emitters/base-emitter.js`)

```javascript
/**
 * 基础 Emitter 接口
 * @abstract
 */
class BaseEmitter {
  /**
   * @returns {string} 平台名称
   */
  get name() { throw new Error('Not implemented'); }

  /**
   * @returns {string} 输出目录
   */
  get outputDir() { throw new Error('Not implemented'); }

  /**
   * @returns {string} 文件扩展名
   */
  get fileExtension() { throw new Error('Not implemented'); }

  /**
   * 格式化输出内容
   * @param {CommandIR} ir - Command IR
   * @param {string} transformedContent - 转换后的正文
   * @returns {string} 最终输出内容
   */
  format(ir, transformedContent) { throw new Error('Not implemented'); }

  /**
   * 写入文件
   * @param {string} filename - 文件名 (不含扩展名)
   * @param {string} content - 文件内容
   * @returns {Promise<string>} 写入的文件路径
   */
  async emit(filename, content) {}
}

module.exports = BaseEmitter;
```

#### Codex Emitter (`lib/compiler/emitters/codex-emitter.js`)

```javascript
const BaseEmitter = require('./base-emitter');
const yaml = require('js-yaml');

class CodexEmitter extends BaseEmitter {
  get name() { return 'codex'; }
  get outputDir() { return '.codex/prompts'; }
  get fileExtension() { return '.md'; }

  /**
   * 格式化为 Codex 格式 (Markdown + YAML frontmatter)
   * Frontmatter 字段: description, argument-hint
   */
  format(ir, transformedContent) {
    const frontmatter = {
      description: ir.frontmatter.description,
      'argument-hint': ir.frontmatter.scripts ? Object.keys(ir.frontmatter.scripts).join(', ') : undefined,
    };
    const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
    return `---\n${yamlStr}---\n\n${transformedContent}`;
  }
}

module.exports = CodexEmitter;
```

#### Cursor Emitter (`lib/compiler/emitters/cursor-emitter.js`)

```javascript
class CursorEmitter extends BaseEmitter {
  get name() { return 'cursor'; }
  get outputDir() { return '.cursor/commands'; }
  get fileExtension() { return '.md'; }

  /**
   * 格式化为 Cursor 格式 (纯 Markdown，无 frontmatter)
   */
  format(ir, transformedContent) {
    return transformedContent;
  }
}

module.exports = CursorEmitter;
```

#### Qwen Emitter (`lib/compiler/emitters/qwen-emitter.js`)

```javascript
const toml = require('@iarna/toml');

class QwenEmitter extends BaseEmitter {
  get name() { return 'qwen'; }
  get outputDir() { return '.qwen/commands'; }
  get fileExtension() { return '.toml'; }

  /**
   * 格式化为 Qwen TOML 格式
   */
  format(ir, transformedContent) {
    const tomlObj = {
      description: ir.frontmatter.description,
      prompt: transformedContent,
    };
    return toml.stringify(tomlObj);
  }
}

module.exports = QwenEmitter;
```

#### Antigravity Emitter (`lib/compiler/emitters/antigravity-emitter.js`)

```javascript
const yaml = require('js-yaml');

const CONTENT_LIMIT = 12000;

class AntigravityEmitter extends BaseEmitter {
  get name() { return 'antigravity'; }
  get outputDir() { return '.agent/workflows'; }
  get fileExtension() { return '.md'; }

  /**
   * 格式化为 Antigravity 格式 (Markdown + YAML frontmatter)
   * 单文件限制 12,000 字符
   */
  format(ir, transformedContent) {
    const frontmatter = {
      description: ir.frontmatter.description.substring(0, 250), // max 250 chars
    };
    const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
    let content = `---\n${yamlStr}---\n\n${transformedContent}`;

    // 如果超过 12K，需要拆分
    if (content.length > CONTENT_LIMIT) {
      return this.splitContent(ir, content);
    }
    return content;
  }

  /**
   * 拆分超长内容为多个文件
   * @param {CommandIR} ir - Command IR
   * @param {string} content - 超长内容
   * @returns {Array<{filename: string, content: string}>} 拆分后的文件列表
   */
  splitContent(ir, content) {
    // 实现: 按章节拆分，使用命名约定关联
    // 例如: flow-prd.md, flow-prd-part2.md, flow-prd-part3.md
  }
}

module.exports = AntigravityEmitter;
```

#### Manifest Module (`lib/compiler/manifest.js`)

```javascript
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const MANIFEST_PATH = 'devflow/.generated/manifest.json';

/**
 * 生成内容 SHA-256 哈希
 * @param {string} content - 文件内容
 * @returns {string} SHA-256 哈希 (hex)
 */
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * 加载现有 manifest
 * @returns {Promise<Manifest|null>}
 */
async function loadManifest() {}

/**
 * 保存 manifest
 * @param {Manifest} manifest
 * @returns {Promise<void>}
 */
async function saveManifest(manifest) {}

/**
 * 检查源文件是否需要重新编译
 * @param {string} sourcePath - 源文件路径
 * @param {string} sourceHash - 源文件哈希
 * @param {Manifest} manifest - 现有 manifest
 * @returns {boolean} true 如果需要编译
 */
function needsRecompile(sourcePath, sourceHash, manifest) {}

/**
 * 添加编译记录
 * @param {Manifest} manifest
 * @param {ManifestEntry} entry
 */
function addEntry(manifest, entry) {}

/**
 * 检查漂移 (目标文件与 manifest 不一致)
 * @param {Manifest} manifest
 * @returns {Promise<Array<{source: string, issue: string}>>}
 */
async function checkDrift(manifest) {}

module.exports = {
  hashContent,
  loadManifest,
  saveManifest,
  needsRecompile,
  addEntry,
  checkDrift,
  MANIFEST_PATH,
};
```

### 4.2 CLI Interface

```
Usage: npm run adapt [options]

Options:
  --platform <name>   Compile for specific platform (codex, cursor, qwen, antigravity)
  --all               Compile for all platforms (default if no --platform)
  --check             Check for drift without compiling
  --verbose           Show detailed compilation output
  --help              Show help

Examples:
  npm run adapt                        # Compile for all platforms
  npm run adapt -- --platform codex    # Compile for Codex only
  npm run adapt -- --all               # Compile for all platforms (explicit)
  npm run adapt -- --check             # Check for drift
```

**Exit Codes**:
- `0`: Success
- `1`: Compilation error (parsing, transformation, or writing failed)
- `2`: Drift detected (with --check)
- `3`: Invalid arguments

### 4.3 Error Response Format

CLI 错误输出格式:

```
[ERROR] <ErrorType>: <Message>
  File: <file_path>
  Line: <line_number> (if applicable)
  Details: <additional_info>
```

示例:

```
[ERROR] MissingFrontmatterError: Missing required YAML frontmatter
  File: .claude/commands/flow-test.md
  Details: File must start with --- delimited YAML frontmatter

[ERROR] UnknownAliasError: Unknown script alias: unknown_alias
  File: .claude/commands/flow-prd.md
  Line: 45
  Details: Referenced {SCRIPT:unknown_alias} but frontmatter.scripts does not define 'unknown_alias'
```

---

## 5. Security Design

### 5.1 Input Validation

由于 Command Emitter 是本地 CLI 工具，安全重点在于输入验证和路径安全。

- **Frontmatter Validation**: 使用 Zod schema 验证所有 frontmatter 字段
- **Path Traversal Prevention**: 验证 scripts 路径不包含 `../` 或绝对路径
- **File Type Validation**: 仅处理 `.md` 文件

### 5.2 Secret Management

- **NO HARDCODED SECRETS**: 编译器不涉及任何密钥或敏感信息
- 编译器仅读取 `.claude/commands/*.md` 文件内容
- 输出为纯文本 Markdown/TOML 文件

### 5.3 File System Security

- **Output Directory Isolation**: 仅写入指定的目标目录 (`.codex/`, `.cursor/`, `.qwen/`, `.agent/`)
- **Overwrite Protection**: 默认覆盖已存在的目标文件（因为它们是可重建的生成物）
- **Permission Preservation**: 使用 Node.js 默认文件权限

---

## 6. Performance Design

### 6.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Single File Compilation | < 100ms | console.time() |
| Full Compilation (~50 commands, 4 platforms) | < 5s | console.time() |
| Incremental Compilation (1 changed file) | < 200ms | console.time() |
| Memory Usage | < 100MB | process.memoryUsage() |

### 6.2 Optimization Strategy

**Incremental Compilation**:
- 使用 manifest.json 记录源文件哈希
- 比较当前哈希与 manifest，仅编译变更文件
- 实现: `manifest.needsRecompile(sourcePath, sourceHash, manifest)`

**Parallel Processing**:
- 使用 `Promise.all()` 并行处理多个源文件
- 每个平台的 emit 操作可并行执行
- 但写入同一目录时需要 await 确保顺序

**Memory Efficiency**:
- 流式处理大文件（如果单个命令文件超过 1MB）
- 使用 gray-matter 的默认解析（不加载整个文件到内存）
- 生成 manifest 时分批写入

### 6.3 Caching Strategy

**Manifest-Based Caching**:
- `devflow/.generated/manifest.json` 作为编译缓存
- 存储: source path, source hash, target path, target hash, timestamp
- 增量编译: 比较 source hash，跳过未变更文件

**无需额外缓存层**:
- 编译操作是 CPU-bound（字符串处理），不是 I/O-bound
- 文件数量有限（~50 个命令），无需复杂缓存机制

---

## 7. Constitution Check (Phase -1 Gates)

### 7.0 Baseline Deviation Check (ANTI-TECH-CREEP)

**Baseline Tech Stack** (from package.json):
- **Runtime**: Node.js >= 18
- **Language**: JavaScript (CommonJS/ESM)
- **YAML**: js-yaml ^4.1.0
- **Validation**: Zod ^3.22.4
- **Testing**: Jest ^29.7.0

**Deviation Analysis**:
- [x] **All baseline technologies reused**: js-yaml, Zod, Jest 均复用
- [x] **All new technologies justified**: gray-matter 和 @iarna/toml 是 PRD 明确要求
- [x] **No unnecessary refactoring**: 保持现有 lib/adapters/ 结构，新增 lib/compiler/
- [x] **No unfamiliar third-party libraries**: gray-matter 和 @iarna/toml 都是成熟的单一职责库

**Deviations from Baseline**:

| New Technology | PRD Requirement | Justification | Status |
|----------------|-----------------|---------------|--------|
| gray-matter ^4.0.3 | Story 1: 解析 frontmatter | PRD 明确要求 "gray-matter (frontmatter 解析)" | Approved |
| @iarna/toml ^2.2.5 | Story 3: Qwen TOML 格式 | PRD 明确要求 "@iarna/toml (TOML 序列化)" | Approved |

**Status**: Deviations Approved (PRD 明确要求)

### 7.1 Simplicity Gate (Article VII)

- [x] **<=3 projects/modules**: 1 个模块 (lib/compiler/)，包含 Parser, Transformer, Emitters, Manifest
- [x] **No future-proofing**: 仅实现 PRD 中明确的 4 个平台，无 "Plugin System" 或 "Custom Platform Support"
- [x] **Minimal dependencies**: 仅添加 PRD 要求的 2 个依赖 (gray-matter, @iarna/toml)

**Status**: Passed

### 7.2 Anti-Abstraction Gate (Article VIII)

- [x] **Direct framework usage**: 直接使用 gray-matter, js-yaml, @iarna/toml，无自定义封装
- [x] **Single data model**: Command IR 是唯一的数据表示，各 Emitter 直接消费
- [x] **No unnecessary interfaces**: BaseEmitter 是轻量接口，仅定义 4 个必需方法

**Status**: Passed

### 7.3 Integration-First Gate (Article IX)

- [x] **Contracts defined first**: Section 4 定义了所有模块接口和 CLI 参数
- [x] **Contract tests planned**: 将在 TASKS.md 中规划单元测试和集成测试
- [x] **Real environment testing**: 使用真实的 `.claude/commands/` 文件测试，不 mock

**Status**: Passed

### 7.4 Complexity Tracking

| Violation Type | Potential Violation | Justification | Approved? |
|----------------|---------------------|---------------|-----------|
| None | N/A | N/A | N/A |

---

## 8. Validation Checklist

- [x] **Section 1**: System Architecture (Overview, Modules, Data Flow) - Complete
- [x] **Section 2**: Technology Stack (Backend, Infrastructure) - Complete with versions and justifications
- [x] **Section 3**: Data Model Design (IR Schema, Manifest Schema) - Complete
- [x] **Section 4**: API Design (Module Interfaces, CLI Interface, Errors) - Complete
- [x] **Section 5**: Security Design (Input Validation, Secret Mgmt, File Security) - Complete
- [x] **Section 6**: Performance Design (Targets, Optimization, Caching) - Complete
- [x] **Section 7**: Constitution Check (Phase -1 Gates) - Complete
- [x] **No placeholders**: No {{PLACEHOLDER}} patterns remaining
- [x] **Specific technologies**: All technologies have versions
- [x] **Complete schema**: Command IR and Manifest schemas fully defined
- [x] **Complete API**: All module interfaces defined with signatures and errors
- [x] **NO HARDCODED SECRETS**: Compiler does not handle secrets
- [x] **Constitution compliance**: All Phase -1 Gates passed

**Ready for Epic Planning**: YES

---

## Appendix A: File Structure After Implementation

```
cc-devflow/
├── lib/
│   ├── adapters/           # 现有适配器 (保持不变)
│   │   ├── adapter-interface.js
│   │   ├── claude-adapter.js
│   │   ├── codex-adapter.js
│   │   └── ...
│   │
│   └── compiler/           # 新增: Command Emitter
│       ├── parser.js                    # Story 1
│       ├── transformer.js               # Story 2
│       ├── manifest.js                  # Story 4
│       ├── emitters/
│       │   ├── base-emitter.js          # Story 3
│       │   ├── codex-emitter.js         # Story 3
│       │   ├── cursor-emitter.js        # Story 3
│       │   ├── qwen-emitter.js          # Story 3
│       │   └── antigravity-emitter.js   # Story 3
│       └── index.js                     # 编译器入口
│
├── bin/
│   └── adapt.js            # 新增: CLI 入口 (Story 5)
│
├── devflow/
│   └── .generated/
│       └── manifest.json   # 编译清单 (Story 4)
│
├── .codex/
│   └── prompts/            # Codex 输出目录
│       └── *.md
│
├── .cursor/
│   └── commands/           # Cursor 输出目录
│       └── *.md
│
├── .qwen/
│   └── commands/           # Qwen 输出目录
│       └── *.toml
│
├── .agent/
│   └── workflows/          # Antigravity 输出目录
│       └── *.md
│
└── package.json            # 更新: 添加 gray-matter, @iarna/toml, adapt script
```

## Appendix B: Platform Output Format Examples

### B.1 Source (`.claude/commands/flow-prd.md`)

```yaml
---
name: flow-prd
description: Generate Product Requirements Document. Usage: /flow-prd "REQ-123" or /flow-prd
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  validate_research: .claude/scripts/validate-research.sh
---

# Flow-PRD - PRD Generation Command

## User Input
$ARGUMENTS = "REQ_ID?"

## Execution Flow
1. Run {SCRIPT:prereq} --json --paths-only
2. Validate with {SCRIPT:validate_research}
...
```

### B.2 Codex Output (`.codex/prompts/flow-prd.md`)

```yaml
---
description: Generate Product Requirements Document. Usage: /flow-prd "REQ-123" or /flow-prd
argument-hint: prereq, validate_research
---

# Flow-PRD - PRD Generation Command

## User Input
$ARGUMENTS = "REQ_ID?"

## Execution Flow
1. Run bash .claude/scripts/check-prerequisites.sh --json --paths-only
2. Validate with bash .claude/scripts/validate-research.sh
...
```

### B.3 Cursor Output (`.cursor/commands/flow-prd.md`)

```markdown
# Flow-PRD - PRD Generation Command

## User Input
$ARGUMENTS = "REQ_ID?"

## Execution Flow
1. Run bash .claude/scripts/check-prerequisites.sh --json --paths-only
2. Validate with bash .claude/scripts/validate-research.sh
...
```

### B.4 Qwen Output (`.qwen/commands/flow-prd.toml`)

```toml
description = "Generate Product Requirements Document. Usage: /flow-prd \"REQ-123\" or /flow-prd"
prompt = """
# Flow-PRD - PRD Generation Command

## User Input
{{args}} = "REQ_ID?"

## Execution Flow
1. Run bash .claude/scripts/check-prerequisites.sh --json --paths-only
2. Validate with bash .claude/scripts/validate-research.sh
...
"""
```

### B.5 Antigravity Output (`.agent/workflows/flow-prd.md`)

```yaml
---
description: Generate Product Requirements Document. Usage: /flow-prd "REQ-123" or /flow-prd
---

# Flow-PRD - PRD Generation Command

## User Input
[arguments] = "REQ_ID?"

## Execution Flow
1. Run bash .claude/scripts/check-prerequisites.sh --json --paths-only
2. Validate with bash .claude/scripts/validate-research.sh
...
```

---

**Generated by**: tech-architect agent (research-type)
**Template Version**: 1.0.0
**Constitution Version**: v2.0.0
**Next Step**: Run planner agent to generate EPIC.md and TASKS.md
