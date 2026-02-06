/**
 * [INPUT]: 依赖 Node.js 内置类型
 * [OUTPUT]: 对外提供 ContextEntry, AgentContext, ContextInjectionConfig 接口
 * [POS]: hooks/types 的核心类型定义，被 inject-agent-context.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================================
// Context Entry Types
// ============================================================================

/**
 * Type of context entry in JSONL file
 */
export type ContextEntryType = 'file' | 'directory' | 'spec';

/**
 * Single entry in a context JSONL file
 *
 * @example
 * {"type": "file", "path": "PRD.md", "purpose": "Product requirements"}
 * {"type": "directory", "path": "contracts/", "purpose": "API contracts", "depth": 1}
 * {"type": "spec", "path": "devflow/spec/backend/api.md", "purpose": "API conventions"}
 */
export interface ContextEntry {
  /** Type of the entry */
  type: ContextEntryType;

  /** Path relative to requirement directory (for file/directory) or absolute (for spec) */
  path: string;

  /** Human-readable purpose for this context */
  purpose: string;

  /** Whether this entry is optional (default: false) */
  optional?: boolean;

  /** For directory type: max depth to traverse (default: 1) */
  depth?: number;
}

// ============================================================================
// Agent Context Types
// ============================================================================

/**
 * Supported agent types that can receive context injection
 */
export type AgentType =
  | 'research'
  | 'prd'
  | 'tech'
  | 'epic'
  | 'dev'
  | 'review'
  | 'qa'
  | 'release';

/**
 * Resolved context for an agent
 */
export interface AgentContext {
  /** Agent type */
  agentType: AgentType;

  /** Requirement ID (e.g., "REQ-007") */
  reqId: string;

  /** Resolved file contents */
  files: ResolvedFile[];

  /** Total token estimate */
  estimatedTokens: number;

  /** Timestamp of context resolution */
  resolvedAt: string;
}

/**
 * A resolved file with its content
 */
export interface ResolvedFile {
  /** Original path from JSONL */
  path: string;

  /** Resolved absolute path */
  absolutePath: string;

  /** File content (truncated if too large) */
  content: string;

  /** Purpose from JSONL entry */
  purpose: string;

  /** Whether file was found */
  found: boolean;

  /** Whether content was truncated */
  truncated: boolean;

  /** Original size in bytes */
  originalSize: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Context injection configuration
 */
export interface ContextInjectionConfig {
  /** Base path for requirement directories */
  requirementsBasePath: string;

  /** Path to context templates */
  templatesPath: string;

  /** Maximum content size per file (bytes) */
  maxFileSize: number;

  /** Maximum total context size (bytes) */
  maxTotalSize: number;

  /** Whether to include optional entries */
  includeOptional: boolean;

  /** Enable verbose logging */
  verbose: boolean;
}

/**
 * Default configuration values
 */
export declare const DEFAULT_CONFIG: ContextInjectionConfig;

// ============================================================================
// Hook Types
// ============================================================================

/**
 * PreToolUse hook input for Task tool
 */
export interface TaskToolInput {
  tool_name: 'Task';
  tool_input: {
    subagent_type: string;
    prompt: string;
    description?: string;
    [key: string]: unknown;
  };
}

/**
 * PreToolUse hook result
 */
export interface HookResult {
  /** Whether to proceed with the tool call */
  proceed: boolean;

  /** Modified tool input (if any) */
  modifiedInput?: TaskToolInput['tool_input'];

  /** Reason for blocking (if proceed is false) */
  blockReason?: string;

  /** Additional context to inject into prompt */
  contextInjection?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Result of parsing a JSONL file
 */
export interface ParseResult {
  entries: ContextEntry[];
  errors: ParseError[];
}

/**
 * Parse error details
 */
export interface ParseError {
  line: number;
  content: string;
  error: string;
}

/**
 * Environment detection result
 */
export interface EnvironmentInfo {
  /** Current requirement ID (from env or branch) */
  reqId: string | null;

  /** Current git branch */
  branch: string | null;

  /** Whether in a requirement context */
  inRequirementContext: boolean;

  /** Requirement directory path */
  requirementPath: string | null;
}
