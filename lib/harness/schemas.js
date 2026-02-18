/**
 * [INPUT]: 依赖 zod 进行运行时 schema 校验，依赖调用方提供 manifest/report/checkpoint 原始对象。
 * [OUTPUT]: 对外提供 Manifest/Task/ReportCard/Checkpoint schema 与 parse 校验函数。
 * [POS]: harness 内核的类型边界层，被 planner/dispatcher/verifier/release 复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { z } = require('zod');

const CHANGE_ID_PATTERN = /^(REQ|BUG)-\d+$/;
const TASK_ID_PATTERN = /^[A-Z][A-Z0-9_-]{1,31}$/;

const ChangeIdSchema = z.string().regex(CHANGE_ID_PATTERN, 'Invalid changeId format');

const TaskStatusSchema = z.enum(['pending', 'running', 'passed', 'failed', 'skipped']);

const TaskSchema = z.object({
  id: z.string().regex(TASK_ID_PATTERN, 'Invalid task id'),
  title: z.string().min(1, 'Task title is required'),
  dependsOn: z.array(z.string().regex(TASK_ID_PATTERN)).default([]),
  touches: z.array(z.string().min(1)).default([]),
  run: z.array(z.string().min(1)).min(1, 'At least one run command is required'),
  checks: z.array(z.string().min(1)).default([]),
  status: TaskStatusSchema.default('pending'),
  attempts: z.number().int().min(0).default(0),
  maxRetries: z.number().int().min(0).default(1),
  lastError: z.string().optional()
});

const ManifestSchema = z.object({
  changeId: ChangeIdSchema,
  goal: z.string().min(1).default('Deliver planned requirement changes safely.'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tasks: z.array(TaskSchema),
  metadata: z.object({
    source: z.enum(['TASKS.md', 'default']).default('default'),
    generatedBy: z.string().min(1).default('harness:plan')
  }).default({ source: 'default', generatedBy: 'harness:plan' })
});

const CheckpointSchema = z.object({
  changeId: ChangeIdSchema,
  taskId: z.string().regex(TASK_ID_PATTERN),
  sessionId: z.string().min(1),
  status: TaskStatusSchema,
  summary: z.string().min(1),
  timestamp: z.string().datetime(),
  attempt: z.number().int().min(0).default(0)
});

const GateResultSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['pass', 'fail', 'skipped']),
  command: z.string().min(1),
  durationMs: z.number().int().min(0),
  details: z.string().default('')
});

const ReportCardSchema = z.object({
  changeId: ChangeIdSchema,
  overall: z.enum(['pass', 'fail']),
  quickGates: z.array(GateResultSchema),
  strictGates: z.array(GateResultSchema),
  review: z.object({
    status: z.enum(['pass', 'fail', 'skipped']),
    details: z.string().default('')
  }),
  blockingFindings: z.array(z.string()),
  timestamp: z.string().datetime()
});

function parseWithSchema(schema, input, label) {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }

  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
  throw new Error(`${label} validation failed: ${issues}`);
}

function parseManifest(input) {
  return parseWithSchema(ManifestSchema, input, 'Manifest');
}

function parseCheckpoint(input) {
  return parseWithSchema(CheckpointSchema, input, 'Checkpoint');
}

function parseReportCard(input) {
  return parseWithSchema(ReportCardSchema, input, 'ReportCard');
}

module.exports = {
  ChangeIdSchema,
  TaskSchema,
  TaskStatusSchema,
  ManifestSchema,
  CheckpointSchema,
  GateResultSchema,
  ReportCardSchema,
  parseManifest,
  parseCheckpoint,
  parseReportCard
};
