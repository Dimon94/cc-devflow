# hooks/ - Claude Code Hooks

> L2 | 父级: `.claude/CLAUDE.md`

## Purpose

Claude Code CLI 钩子脚本，在工具调用前后执行自定义逻辑。

## Members

| File | Purpose | Trigger |
|------|---------|---------|
| `inject-agent-context.ts` | Task 工具上下文注入 [v4.4] | PreToolUse(Task) |
| `inject-skill-context.ts` | Skill 上下文注入 | PreToolUse(Skill) |
| `pre-tool-use-guardrail.sh` | Edit/Write 前置检查 | PreToolUse(Edit\|Write) |
| `post-tool-use-tracker.sh` | 文件修改追踪 | PostToolUse(Edit\|Write) |
| `skill-activation-prompt.sh` | Skill 激活提示 | UserPromptSubmit |
| `error-handling-reminder.sh` | 错误处理提醒 | Stop |
| `ralph-loop.ts` | Ralph Loop 程序化验证 [v4.4] | SubagentStop |
| `teammate-idle-hook.ts` | Team 任务调度器 [v4.7] | TeammateIdle |
| `task-completed-hook.ts` | 任务完成验证器 [v4.7] | TaskCompleted |
| `checklist-gate.js` | Checklist 质量门 | Custom |
| `types/team-types.d.ts` | Team 状态 TypeScript 类型定义 [v4.7] | N/A |

## Hook Registration (settings.json)

```json
{
  "hooks": {
    "PreToolUse": [
      {"matcher": "Edit|Write", "command": "pre-tool-use-guardrail.sh"},
      {"matcher": "Task", "command": "inject-agent-context.ts"}
    ],
    "PostToolUse": [
      {"matcher": "Edit|Write", "command": "post-tool-use-tracker.sh"}
    ],
    "SubagentStop": [
      {"command": "ralph-loop.ts"}
    ],
    "TeammateIdle": [
      {"command": "teammate-idle-hook.ts"}
    ],
    "TaskCompleted": [
      {"command": "task-completed-hook.ts"}
    ]
  }
}
```

## inject-agent-context.ts (v4.4)

借鉴 Trellis 的 `inject-subagent-context.py` 实现。

### 工作流程

```
Task(subagent_type="dev-implementer", prompt="...")
    ↓
Hook 检测到 Task 工具调用
    ↓
获取 REQ-ID (环境变量 > .current-task > 分支名)
    ↓
查找 JSONL 文件:
  1. devflow/requirements/{REQ}/context/dev-implementer.jsonl
  2. .claude/skills/workflow/flow-dev/dev-implementer.jsonl
  3. .claude/skills/workflow/flow-dev/context.jsonl
    ↓
解析 JSONL，读取文件内容
    ↓
注入到 prompt 参数中
```

### JSONL 格式 (Trellis 风格)

```jsonl
{"file": "devflow/requirements/{REQ}/TASKS.md", "reason": "Task list"}
{"file": "devflow/spec/frontend/index.md", "reason": "Frontend conventions", "optional": true}
{"file": "src/components/", "type": "directory", "reason": "Existing patterns"}
```

### Agent 映射

| subagent_type | Skill Directory | JSONL File |
|---------------|-----------------|------------|
| dev-implementer | flow-dev | dev-implementer.jsonl |
| prd-writer | flow-spec | prd-writer.jsonl |
| tech-architect | flow-spec | tech-architect.jsonl |
| planner | flow-spec | planner.jsonl |
| qa-tester | flow-quality | qa-tester.jsonl |

## teammate-idle-hook.ts (v4.7)

Team 模式下的任务调度器，在 Teammate 空闲时触发。

### 工作流程

```
TeammateIdle Event
    ↓
验证 hook_event_name === 'TeammateIdle'
    ↓
如果有 last_task_id，执行 idle_checks 验证
    ↓
验证失败 → 返回 assign_task (继续修复)
验证通过 → 标记任务完成
    ↓
查找下一个未分配任务
    ↓
有任务 → 返回 assign_task
无任务 + 所有 Teammate 空闲 → 返回 shutdown
无任务 + 有 Teammate 工作中 → 返回 wait
```

### 输入格式 (TeammateIdleInput)

```typescript
{
  hook_event_name: 'TeammateIdle',
  teammate_id: string,
  teammate_role: string,
  last_task_id?: string,
  idle_reason: 'task_complete' | 'waiting_dependency' | 'no_tasks' | 'error',
  cwd: string,
  session_id: string
}
```

### 输出格式 (TeammateIdleOutput)

```typescript
{
  action: 'assign_task' | 'wait' | 'shutdown',
  task_id?: string,
  message?: string
}
```

### 配置 (quality-gates.yml)

```yaml
teammate_idle:
  idle_checks:
    - npm run lint --if-present
    - npm run typecheck --if-present
    - npm test -- --passWithNoTests
  assignment_strategy: priority_first
```

## task-completed-hook.ts (v4.7)

任务完成时的质量验证钩子。

### 工作流程

```
TaskCompleted Event
    ↓
验证 hook_event_name === 'TaskCompleted'
    ↓
加载 quality-gates.yml 配置
    ↓
执行 task_completed.verify 命令
    ↓
    ├── 通过 → accept + 更新 Team 状态
    └── 失败 → block_on_failure?
                ├── true → reject
                └── false → accept (with warning)
    ↓
记录失败到 ERROR_LOG.md
    ↓
检查阶段转换
```

### 配置 (quality-gates.yml)

```yaml
task_completed:
  verify:
    - npm run lint --if-present
    - npm run typecheck --if-present
    - npm test -- --passWithNoTests
  block_on_failure: true
  max_retries: 3
```

### 输入格式

```typescript
interface TaskCompletedInput {
  hook_event_name: 'TaskCompleted';
  task_id: string;
  task_subject: string;
  completed_by: string;
  completion_time: string;
  cwd: string;
  session_id: string;
}
```

### 输出格式

```typescript
interface TaskCompletedOutput {
  decision: 'accept' | 'reject';
  reason: string;
  next_actions?: string[];
}
```

## types/ - TypeScript 类型定义 (v4.7)

### team-types.d.ts

Team 集成的核心类型定义，被 teammate-idle-hook.ts 和 task-completed-hook.ts 消费。

**主要类型**:

| Type | Purpose |
|------|---------|
| `TeammateState` | Teammate 状态 (id, role, status, currentTask, completedTasks) |
| `TeamState` | Team 状态 (mode, lead, teammates, taskAssignments) |
| `RalphLoopTeamState` | Ralph Loop Team 模式状态 |
| `OrchestrationStatus` | 扩展的 orchestration_status.json 类型 |
| `TeammateIdleInput/Output` | TeammateIdle Hook 输入/输出 |
| `TaskCompletedInput/Output` | TaskCompleted Hook 输入/输出 |
| `QualityGatesTeamConfig` | quality-gates.yml Team 配置 |

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
