/**
 * T023: Zod Schemas for Command Emitter
 *
 * Defines validation schemas for:
 * - PlaceholderSchema: {SCRIPT:*}, {AGENT_SCRIPT}, $ARGUMENTS
 * - FrontmatterSchema: YAML frontmatter fields
 * - CommandIRSchema: Intermediate Representation
 * - ManifestEntrySchema: Single compilation record
 * - ManifestSchema: Complete manifest file
 */
const { z } = require('zod');

// ============================================================
// PlaceholderSchema - 占位符定义
// ============================================================
const PlaceholderSchema = z.object({
  type: z.enum(['SCRIPT', 'AGENT_SCRIPT', 'ARGUMENTS']),
  raw: z.string(),
  alias: z.string().optional(),
  position: z.object({
    start: z.number(),
    end: z.number()
  })
});

// ============================================================
// AgentScriptsSchema - 跨平台脚本定义
// ============================================================
const AgentScriptsSchema = z.object({
  sh: z.string().optional(),
  ps: z.string().optional()
}).optional();

// ============================================================
// FrontmatterSchema - YAML frontmatter 验证
// ============================================================
const FrontmatterSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().min(1, 'description is required'),
  scripts: z.record(z.string()).optional(),
  agent_scripts: AgentScriptsSchema
});

// ============================================================
// SourceSchema - 源文件信息
// ============================================================
const SourceSchema = z.object({
  path: z.string(),
  filename: z.string(),
  hash: z.string()
});

// ============================================================
// CommandIRSchema - 命令中间表示
// ============================================================
const CommandIRSchema = z.object({
  source: SourceSchema,
  frontmatter: FrontmatterSchema,
  body: z.string(),
  placeholders: z.array(PlaceholderSchema)
});

// ============================================================
// ManifestEntrySchema - 单条编译记录
// ============================================================
const ManifestEntrySchema = z.object({
  source: z.string(),
  target: z.string(),
  hash: z.string(),
  timestamp: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'timestamp must be a valid ISO 8601 date' }
  ),
  platform: z.enum(['codex', 'cursor', 'qwen', 'antigravity'])
});

// ============================================================
// ManifestSchema - 完整 manifest 文件
// ============================================================
const ManifestSchema = z.object({
  version: z.string(),
  generatedAt: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'generatedAt must be a valid ISO 8601 date' }
  ),
  entries: z.array(ManifestEntrySchema)
});

module.exports = {
  PlaceholderSchema,
  AgentScriptsSchema,
  FrontmatterSchema,
  SourceSchema,
  CommandIRSchema,
  ManifestEntrySchema,
  ManifestSchema
};
