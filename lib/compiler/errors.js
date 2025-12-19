/**
 * T024: Compiler Error Types
 *
 * Custom error classes for Command Emitter:
 * - CompilerError: Base class
 * - MissingFrontmatterError: File lacks YAML frontmatter
 * - InvalidFrontmatterError: Frontmatter validation failed
 * - UnknownAliasError: {SCRIPT:alias} references undefined alias
 * - UnknownTemplateAliasError: {TEMPLATE:alias} references undefined alias
 * - UnknownGuideAliasError: {GUIDE:alias} references undefined alias
 * - WriteError: File write operation failed
 * - ContentTooLargeError: Content exceeds platform limit
 */

// ============================================================
// CompilerError - 基类
// ============================================================
class CompilerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CompilerError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================
// MissingFrontmatterError - 缺少 frontmatter
// ============================================================
class MissingFrontmatterError extends CompilerError {
  constructor(filePath) {
    super(`Missing YAML frontmatter in file: ${filePath}`);
    this.name = 'MissingFrontmatterError';
    this.filePath = filePath;
  }
}

// ============================================================
// InvalidFrontmatterError - frontmatter 格式错误
// ============================================================
class InvalidFrontmatterError extends CompilerError {
  constructor(filePath, reason) {
    super(`Invalid frontmatter in ${filePath}: ${reason}`);
    this.name = 'InvalidFrontmatterError';
    this.filePath = filePath;
    this.reason = reason;
  }
}

// ============================================================
// UnknownAliasError - 未知 script alias
// ============================================================
class UnknownAliasError extends CompilerError {
  constructor(filePath, alias) {
    super(`Unknown script alias '${alias}' in file: ${filePath}`);
    this.name = 'UnknownAliasError';
    this.filePath = filePath;
    this.alias = alias;
  }
}

// ============================================================
// UnknownTemplateAliasError - 未知 template alias
// ============================================================
class UnknownTemplateAliasError extends CompilerError {
  constructor(filePath, alias) {
    super(`Unknown template alias '${alias}' in file: ${filePath}`);
    this.name = 'UnknownTemplateAliasError';
    this.filePath = filePath;
    this.alias = alias;
  }
}

// ============================================================
// UnknownGuideAliasError - 未知 guide alias
// ============================================================
class UnknownGuideAliasError extends CompilerError {
  constructor(filePath, alias) {
    super(`Unknown guide alias '${alias}' in file: ${filePath}`);
    this.name = 'UnknownGuideAliasError';
    this.filePath = filePath;
    this.alias = alias;
  }
}

// ============================================================
// WriteError - 写入失败
// ============================================================
class WriteError extends CompilerError {
  constructor(filePath, cause) {
    super(`Failed to write file ${filePath}: ${cause}`);
    this.name = 'WriteError';
    this.filePath = filePath;
    this.cause = cause;
  }
}

// ============================================================
// ContentTooLargeError - 内容超限
// ============================================================
class ContentTooLargeError extends CompilerError {
  constructor(filePath, actualSize, limit) {
    super(`Content too large in ${filePath}: ${actualSize} chars exceeds limit of ${limit}`);
    this.name = 'ContentTooLargeError';
    this.filePath = filePath;
    this.actualSize = actualSize;
    this.limit = limit;
  }
}

module.exports = {
  CompilerError,
  MissingFrontmatterError,
  InvalidFrontmatterError,
  UnknownAliasError,
  UnknownTemplateAliasError,
  UnknownGuideAliasError,
  WriteError,
  ContentTooLargeError
};
