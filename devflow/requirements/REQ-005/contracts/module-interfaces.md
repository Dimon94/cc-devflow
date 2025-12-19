# Module Interfaces: REQ-005 - Command Emitter

**Generated from**: TECH_DESIGN.md Section 4
**Type**: JavaScript Module Contracts

---

## 1. Parser Module

**File**: `lib/compiler/parser.js`

### parseCommand(filePath: string): CommandIR

解析单个命令文件，返回 Command IR。

```javascript
/**
 * @param {string} filePath - 命令文件绝对路径
 * @returns {CommandIR} - 解析后的命令 IR
 * @throws {MissingFrontmatterError} - 文件缺少 YAML frontmatter
 * @throws {InvalidFrontmatterError} - frontmatter 格式错误或缺少必需字段
 */
export function parseCommand(filePath) { ... }
```

### parseAllCommands(directory: string): CommandIR[]

扫描目录下所有命令文件，返回 Command IR 数组。

```javascript
/**
 * @param {string} directory - 命令目录路径 (默认 .claude/commands/)
 * @returns {CommandIR[]} - 所有命令的 IR 数组
 * @throws {DirectoryNotFoundError} - 目录不存在
 */
export function parseAllCommands(directory) { ... }
```

---

## 2. Transformer Module

**File**: `lib/compiler/transformer.js`

### transformForPlatform(ir: CommandIR, platform: Platform): TransformedContent

为指定平台转换命令内容。

```javascript
/**
 * @param {CommandIR} ir - 命令 IR
 * @param {Platform} platform - 目标平台 ('codex' | 'cursor' | 'qwen' | 'antigravity')
 * @returns {TransformedContent} - 转换后的内容
 * @throws {UnknownAliasError} - 引用了不存在的 script alias
 */
export function transformForPlatform(ir, platform) { ... }
```

### TransformedContent

```typescript
interface TransformedContent {
  frontmatter: object | null;  // 转换后的 frontmatter (Cursor 为 null)
  body: string;                // 占位符展开后的正文
  metadata: {
    source: string;            // 源文件路径
    platform: Platform;        // 目标平台
    charCount: number;         // 字符数 (用于 Antigravity 12K 限制检查)
  };
}
```

---

## 3. Emitter Interface

**Base**: `lib/compiler/emitters/base-emitter.js`

### Emitter 接口

所有平台 Emitter 必须实现以下接口：

```javascript
/**
 * @interface Emitter
 */
export class BaseEmitter {
  /**
   * @param {string} outputDir - 输出目录根路径
   */
  constructor(outputDir) { ... }

  /**
   * 获取平台标识
   * @returns {Platform}
   */
  get platform() { ... }

  /**
   * 获取输出目录
   * @returns {string}
   */
  get targetDir() { ... }

  /**
   * 发射单个命令到目标目录
   * @param {TransformedContent} content - 转换后的内容
   * @returns {EmitResult}
   * @throws {WriteError} - 写入失败
   */
  emit(content) { ... }

  /**
   * 格式化输出内容
   * @param {TransformedContent} content - 转换后的内容
   * @returns {string} - 格式化后的文件内容
   */
  format(content) { ... }
}
```

### EmitResult

```typescript
interface EmitResult {
  success: boolean;
  targetPath: string;
  hash: string;
  timestamp: string;
  error?: Error;
}
```

---

## 4. Platform Emitters

### 4.1 Codex Emitter

**File**: `lib/compiler/emitters/codex-emitter.js`

```javascript
export class CodexEmitter extends BaseEmitter {
  platform = 'codex';
  targetDir = '.codex/prompts/';

  format(content) {
    // 输出: YAML frontmatter + Markdown body
    // frontmatter: { description, argument-hint }
  }
}
```

### 4.2 Cursor Emitter

**File**: `lib/compiler/emitters/cursor-emitter.js`

```javascript
export class CursorEmitter extends BaseEmitter {
  platform = 'cursor';
  targetDir = '.cursor/commands/';

  format(content) {
    // 输出: 纯 Markdown (无 frontmatter)
  }
}
```

### 4.3 Qwen Emitter

**File**: `lib/compiler/emitters/qwen-emitter.js`

```javascript
export class QwenEmitter extends BaseEmitter {
  platform = 'qwen';
  targetDir = '.qwen/commands/';

  format(content) {
    // 输出: TOML 格式 { description, prompt }
  }
}
```

### 4.4 Antigravity Emitter

**File**: `lib/compiler/emitters/antigravity-emitter.js`

```javascript
export class AntigravityEmitter extends BaseEmitter {
  platform = 'antigravity';
  targetDir = '.agent/workflows/';
  maxChars = 12000;

  format(content) {
    // 输出: YAML frontmatter + Markdown body
    // 如果超过 12K 字符，自动拆分
  }

  splitIfNeeded(content) {
    // 超过 12K 时拆分为多个文件
  }
}
```

---

## 5. Manifest Module

**File**: `lib/compiler/manifest.js`

### loadManifest(): Manifest | null

加载现有 manifest 文件。

```javascript
/**
 * @returns {Manifest | null} - manifest 对象或 null (不存在时)
 */
export function loadManifest() { ... }
```

### updateManifest(entries: ManifestEntry[]): void

更新 manifest 文件。

```javascript
/**
 * @param {ManifestEntry[]} entries - 新的 manifest 条目
 */
export function updateManifest(entries) { ... }
```

### checkDrift(): DriftReport

检查生成物是否与 manifest 一致。

```javascript
/**
 * @returns {DriftReport} - 漂移报告
 */
export function checkDrift() { ... }

interface DriftReport {
  hasDrift: boolean;
  driftedFiles: string[];
  missingFiles: string[];
  orphanedFiles: string[];
}
```

---

## 6. CLI Entry

**File**: `bin/adapt.js`

### 命令行接口

```bash
npm run adapt -- [options]

Options:
  --platform <name>   编译指定平台 (codex, cursor, qwen, antigravity)
  --all               编译所有平台 (默认)
  --check             检查漂移，不执行编译
  --verbose           详细输出
  --help              显示帮助
```

### 退出码

| Code | Description |
|------|-------------|
| 0 | 成功 |
| 1 | 编译错误 (解析失败、写入失败等) |
| 2 | 漂移检测失败 (--check 模式) |
| 3 | 参数错误 |

---

## 7. Error Types

**File**: `lib/compiler/errors.js`

```javascript
export class CompilerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

export class MissingFrontmatterError extends CompilerError {
  constructor(filePath) {
    super(`Missing required YAML frontmatter: ${filePath}`, 'MISSING_FRONTMATTER');
  }
}

export class InvalidFrontmatterError extends CompilerError {
  constructor(filePath, issues) {
    super(`Invalid frontmatter in ${filePath}: ${issues.join(', ')}`, 'INVALID_FRONTMATTER');
  }
}

export class UnknownAliasError extends CompilerError {
  constructor(alias, filePath) {
    super(`Unknown script alias: ${alias} in ${filePath}`, 'UNKNOWN_ALIAS');
  }
}

export class WriteError extends CompilerError {
  constructor(targetPath, cause) {
    super(`Failed to write ${targetPath}: ${cause.message}`, 'WRITE_ERROR');
    this.cause = cause;
  }
}

export class ContentTooLargeError extends CompilerError {
  constructor(filePath, charCount, maxChars) {
    super(`Content too large for Antigravity: ${filePath} (${charCount} > ${maxChars})`, 'CONTENT_TOO_LARGE');
  }
}
```

---

**Generated by**: /flow-tech
**Template Version**: 1.0.0
