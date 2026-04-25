/**
 * [INPUT]: 依赖 zod 进行运行时 schema 校验，依赖调用方提供 manifest/report/checkpoint 原始对象。
 * [OUTPUT]: 对外提供 Manifest/Task/ReportCard/Checkpoint/Runtime approval schema 与 parse 校验函数。
 * [POS]: skill runtime 的类型边界层，被 planner/dispatcher/verifier/release 复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { z } = require('zod');
const { isTaskCompletedStatus } = require('./lifecycle');
const { CHANGE_ID_PATTERN } = require('./paths');

const TASK_ID_PATTERN = /^[A-Z][A-Z0-9_-]{1,31}$/;

const ChangeIdSchema = z.string().regex(CHANGE_ID_PATTERN, 'Invalid changeId format');

const TaskStatusSchema = z.enum(['pending', 'running', 'passed', 'failed', 'skipped']);
const ReviewDecisionStatusSchema = z.enum(['pending', 'pass', 'fail', 'blocked', 'skipped']);

const RuntimeStatusSchema = z.enum(['initialized', 'planned', 'in_progress', 'verified', 'released']);
const ApprovalStatusSchema = z.enum(['pending', 'approved']);
const ExecutionModeSchema = z.enum(['direct', 'delegate', 'team']);

const RuntimeApprovalSchema = z.object({
  status: ApprovalStatusSchema.default('pending'),
  executionMode: ExecutionModeSchema.default('delegate'),
  planVersion: z.number().int().min(1).optional(),
  approvedAt: z.string().datetime().optional()
});

const RuntimeStateSchema = z.object({
  changeId: ChangeIdSchema,
  changeKey: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  createdAt: z.string().datetime().optional(),
  goal: z.string().min(1),
  status: RuntimeStatusSchema,
  initializedAt: z.string().datetime(),
  plannedAt: z.string().datetime().optional(),
  verifiedAt: z.string().datetime().optional(),
  releasedAt: z.string().datetime().optional(),
  approval: RuntimeApprovalSchema.optional(),
  updatedAt: z.string().datetime()
});

const TaskContextSchema = z.object({
  readFiles: z.array(z.string().min(1)).default([]),
  commands: z.array(z.string().min(1)).default([]),
  notes: z.array(z.string().min(1)).default([])
}).default({
  readFiles: [],
  commands: [],
  notes: []
});

const TaskReviewStateSchema = z.object({
  spec: ReviewDecisionStatusSchema.default('pending'),
  code: ReviewDecisionStatusSchema.default('pending')
}).default({
  spec: 'pending',
  code: 'pending'
});

const TaskSchema = z.object({
  id: z.string().regex(TASK_ID_PATTERN, 'Invalid task id'),
  title: z.string().min(1, 'Task title is required'),
  type: z.enum(['TEST', 'IMPL', 'OTHER']).default('OTHER'),
  phase: z.number().int().min(1).default(1),
  parallel: z.boolean().default(false),
  dependsOn: z.array(z.string().regex(TASK_ID_PATTERN)).default([]),
  touches: z.array(z.string().min(1)).default([]),
  files: z.array(z.string().min(1)).default([]),
  run: z.array(z.string().min(1)).min(1, 'At least one run command is required'),
  checks: z.array(z.string().min(1)).default([]),
  acceptance: z.array(z.string().min(1)).default([]),
  verification: z.array(z.string().min(1)).default([]),
  evidence: z.array(z.string().min(1)).default([]),
  context: TaskContextSchema,
  reviews: TaskReviewStateSchema,
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
  currentTaskId: z.string().regex(TASK_ID_PATTERN).nullable().default(null),
  activePhase: z.number().int().min(1).nullable().default(null),
  tasks: z.array(TaskSchema),
  metadata: z.object({
    source: z.enum(['tasks.md', 'default']).default('default'),
    generatedBy: z.string().min(1).default('skill:cc-plan'),
    planVersion: z.number().int().min(1).default(1)
  }).default({ source: 'default', generatedBy: 'skill:cc-plan', planVersion: 1 })
}).superRefine((manifest, ctx) => {
  const taskIds = new Set();
  const taskMap = new Map();

  for (let index = 0; index < manifest.tasks.length; index += 1) {
    const task = manifest.tasks[index];

    if (taskIds.has(task.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tasks', index, 'id'],
        message: `Duplicate task id: ${task.id}`
      });
      continue;
    }

    taskIds.add(task.id);
    taskMap.set(task.id, task);
  }

  for (let index = 0; index < manifest.tasks.length; index += 1) {
    const task = manifest.tasks[index];

    for (const depId of task.dependsOn) {
      if (!taskMap.has(depId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tasks', index, 'dependsOn'],
          message: `Task ${task.id} depends on missing task ${depId}`
        });
      }

      if (depId === task.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tasks', index, 'dependsOn'],
          message: `Task ${task.id} cannot depend on itself`
        });
      }
    }
  }

  const unfinished = manifest.tasks.filter((task) => !isTaskCompletedStatus(task.status));
  const derivedActivePhase = unfinished.length > 0
    ? Math.min(...unfinished.map((task) => task.phase || 1))
    : null;

  if (manifest.activePhase !== null && manifest.activePhase !== derivedActivePhase) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['activePhase'],
      message: `activePhase ${manifest.activePhase} does not match derived active phase ${derivedActivePhase}`
    });
  }

  if (manifest.currentTaskId !== null) {
    const currentTask = taskMap.get(manifest.currentTaskId);
    if (!currentTask) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentTaskId'],
        message: `currentTaskId ${manifest.currentTaskId} is not present in tasks`
      });
    } else if (derivedActivePhase !== null && currentTask.phase !== derivedActivePhase) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentTaskId'],
        message: `currentTaskId ${manifest.currentTaskId} is not in active phase ${derivedActivePhase}`
      });
    }
  }

  const taskSourceIsTasksMarkdown = manifest.metadata?.source === 'tasks.md';

  for (let index = 0; index < manifest.tasks.length; index += 1) {
    const task = manifest.tasks[index];

    if (taskSourceIsTasksMarkdown && task.type !== 'OTHER') {
      if (task.acceptance.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tasks', index, 'acceptance'],
          message: `${task.id} must include acceptance criteria`
        });
      }

      if (task.verification.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tasks', index, 'verification'],
          message: `${task.id} must include verification commands`
        });
      }

      if (task.evidence.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tasks', index, 'evidence'],
          message: `${task.id} must include evidence expectations`
        });
      }

      if (task.context.readFiles.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tasks', index, 'context', 'readFiles'],
          message: `${task.id} must include readFiles for context injection`
        });
      }
    }
  }

  for (let leftIndex = 0; leftIndex < manifest.tasks.length; leftIndex += 1) {
    const left = manifest.tasks[leftIndex];
    if (!left.parallel) {
      continue;
    }

    const leftTouches = new Set([...(left.touches || []), ...(left.files || [])]);

    for (let rightIndex = leftIndex + 1; rightIndex < manifest.tasks.length; rightIndex += 1) {
      const right = manifest.tasks[rightIndex];

      if (!right.parallel || left.phase !== right.phase) {
        continue;
      }

      const dependsOnEachOther =
        left.dependsOn.includes(right.id) || right.dependsOn.includes(left.id);

      if (dependsOnEachOther) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tasks', rightIndex, 'parallel'],
          message: `Tasks ${left.id} and ${right.id} cannot both be parallel when one depends on the other`
        });
      }

      const sharedTouches = [...new Set([...(right.touches || []), ...(right.files || [])])]
        .filter((touch) => leftTouches.has(touch));

      if (sharedTouches.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tasks', rightIndex, 'touches'],
          message: `Parallel tasks ${left.id} and ${right.id} share touches: ${sharedTouches.join(', ')}`
        });
      }
    }
  }
});

const CheckpointSchema = z.object({
  changeId: ChangeIdSchema,
  taskId: z.string().regex(TASK_ID_PATTERN),
  sessionId: z.string().min(1),
  planVersion: z.number().int().min(1).default(1),
  status: TaskStatusSchema,
  summary: z.string().min(1),
  error: z.string().default(''),
  outputExcerpt: z.string().default(''),
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

const ReviewSeveritySchema = z.enum(['critical', 'important', 'minor', 'info']);
const ReviewActionSchema = z.enum(['fix_now', 'follow_up', 'cc-investigate', 'none']);
const ReviewFindingStatusSchema = z.enum(['open', 'resolved', 'accepted', 'informational']);

const ReviewEvidenceSchema = z.object({
  kind: z.enum(['command', 'file', 'note']),
  label: z.string().min(1),
  ref: z.string().default(''),
  observation: z.string().default('')
});

const ReviewFindingSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  scope: z.enum(['task', 'requirement']),
  category: z.string().min(1),
  severity: ReviewSeveritySchema,
  summary: z.string().min(1),
  details: z.string().default(''),
  file: z.string().optional(),
  line: z.number().int().min(1).optional(),
  action: ReviewActionSchema.default('none'),
  status: ReviewFindingStatusSchema.default('open'),
  fingerprint: z.string().optional()
});

const ReviewerResultSchema = z.object({
  key: z.string().min(1),
  scope: z.enum(['task', 'requirement']),
  mode: z.enum(['spec', 'code', 'coverage', 'structured', 'adversarial']),
  source: z.enum(['manifest', 'runtime', 'codex', 'shell']),
  status: ReviewDecisionStatusSchema,
  summary: z.string().default(''),
  evidence: z.array(ReviewEvidenceSchema).default([]),
  findings: z.array(ReviewFindingSchema).default([])
});

const ReviewSectionSchema = z.object({
  status: ReviewDecisionStatusSchema.default('skipped'),
  required: z.boolean().default(false),
  summary: z.string().default(''),
  reviewers: z.array(ReviewerResultSchema).default([]),
  findings: z.array(ReviewFindingSchema).default([])
});

const ReportReviewSchema = z.object({
  status: ReviewDecisionStatusSchema.default('skipped'),
  summary: z.string().default(''),
  details: z.string().default(''),
  taskReviews: ReviewSectionSchema.default({
    status: 'skipped',
    required: false,
    summary: '',
    reviewers: [],
    findings: []
  }),
  diffReview: ReviewSectionSchema.default({
    status: 'skipped',
    required: false,
    summary: '',
    reviewers: [],
    findings: []
  }),
  findings: z.array(ReviewFindingSchema).default([])
});

const ReportCardSchema = z.object({
  changeId: ChangeIdSchema,
  verdict: z.enum(['pass', 'fail', 'blocked']).optional(),
  overall: z.enum(['pass', 'fail']),
  summary: z.string().default(''),
  quickGates: z.array(GateResultSchema),
  strictGates: z.array(GateResultSchema),
  review: ReportReviewSchema,
  blockingFindings: z.array(z.string()),
  reroute: z.enum(['none', 'cc-do', 'cc-investigate', 'cc-plan']).default('none'),
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

function parseRuntimeState(input) {
  return parseWithSchema(RuntimeStateSchema, input, 'RuntimeState');
}

module.exports = {
  ChangeIdSchema,
  TaskSchema,
  TaskStatusSchema,
  RuntimeStatusSchema,
  ApprovalStatusSchema,
  ExecutionModeSchema,
  RuntimeApprovalSchema,
  RuntimeStateSchema,
  ManifestSchema,
  CheckpointSchema,
  GateResultSchema,
  ReviewDecisionStatusSchema,
  ReviewFindingSchema,
  ReviewerResultSchema,
  ReviewSectionSchema,
  ReportReviewSchema,
  ReportCardSchema,
  parseManifest,
  parseCheckpoint,
  parseReportCard,
  parseRuntimeState
};
