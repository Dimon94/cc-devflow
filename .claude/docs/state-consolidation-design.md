# State Consolidation Design (Task #10 重新设计)

> **Version**: 1.0.0
> **Date**: 2026-03-12
> **Status**: Design Proposal

---

## 问题诊断

### 现象层
Task #10 原始设计要求创建统一的 `.harness/state.json`，合并：
- `orchestration_status.json`
- `session-checklist.json`
- `session-progress.md`
- `session-handoff.md`

### 本质层
这个设计与 v6.0 Harness-First 架构冲突：
- v6.0 已经实现了**关注点分离**
- 将所有状态塞入一个文件违反了单一职责原则
- 真正的问题是**旧文件未被废弃**，而非需要新的统一文件

### 哲学层
**单一真相源 ≠ 单一文件**

正确的架构：
```
harness-state.json     → 生命周期状态 (initialized/released)
task-manifest.json     → 任务定义与进度 (tasks[].status)
checkpoint.json        → 会话恢复点 (per task)
report-card.json       → 质量验证结果
resume-index.md        → 人和 Agent 共读的恢复入口
pr-brief.md            → review-ready handoff artifact
```

---

## v6.0 当前架构分析

### 1. harness-state.json (核心生命周期)
```json
{
  "changeId": "REQ-123",
  "goal": "Deliver REQ-123 safely",
  "status": "initialized|released",
  "initializedAt": "2026-03-12T10:00:00Z",
  "releasedAt": "2026-03-12T15:00:00Z",
  "updatedAt": "2026-03-12T15:00:00Z"
}
```

**职责**：
- 需求的生命周期状态
- 初始化和发布时间戳
- 不包含任务细节

### 2. task-manifest.json (任务定义与进度)
```json
{
  "changeId": "REQ-123",
  "goal": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "tasks": [
    {
      "id": "T001",
      "title": "...",
      "status": "pending|running|passed|failed",
      "attempts": 0,
      "maxRetries": 1,
      "dependsOn": [],
      "touches": [],
      "run": [],
      "checks": []
    }
  ],
  "metadata": {
    "source": "TASKS.md",
    "generatedBy": "harness:plan"
  }
}
```

**职责**：
- 任务定义（依赖、文件、命令）
- 任务执行状态（pending/running/passed/failed）
- 重试次数和错误信息
- **已经包含了 progress 信息**（completedTasks = tasks.filter(t => t.status === 'passed').length）

### 3. checkpoint.json (会话恢复)
```json
{
  "changeId": "REQ-123",
  "taskId": "T001",
  "sessionId": "session-abc123",
  "status": "passed",
  "summary": "Task completed successfully",
  "timestamp": "2026-03-12T10:30:00Z",
  "attempt": 0
}
```

**职责**：
- 每个任务的检查点
- 会话恢复信息
- 任务执行摘要

### 4. report-card.json (质量验证)
```json
{
  "changeId": "REQ-123",
  "overall": "pass|fail",
  "quickGates": [...],
  "strictGates": [...],
  "review": {...},
  "blockingFindings": [],
  "timestamp": "..."
}
```

**职责**：
- 质量门禁结果
- 阻塞性问题列表

---

## 旧文件映射分析

### orchestration_status.json → 降级为 compatibility mirror
```json
{
  "reqId": "REQ-006",
  "status": "released",                // ← 由 harness/team truth 镜像而来
  "phase": "release",                  // ← 由主链阶段归一后镜像而来
  "completedSteps": [...],             // → task-manifest.json: tasks[].status
  "documents": {...},                  // → 文件系统本身就是真相源
  "research": {...},                   // → 文件系统
  "createdAt": "...",                  // → harness-state.json: initializedAt
  "updatedAt": "...",                  // → harness-state.json: updatedAt
  "prUrl": "..."                       // → 不属于 harness 职责
}
```

**结论**：`orchestration_status.json` 不再是主状态源，但仍保留为兼容镜像，供旧脚本和平滑迁移使用。

### session-checklist.json → 已被替代
```json
{
  "flow:init": { "passes": true },
  "flow:spec": { "passes": false }
}
```

**映射**：
- `flow:init.passes` → harness-state.json: status === 'initialized'
- `flow:spec.passes` → task-manifest.json 存在且有效

**结论**：session-checklist.json 是冗余的。

### session-progress.md → 可生成
```markdown
## Progress
- Total Tasks: 6
- Completed: 2
- Failed: 0
```

**映射**：
```javascript
const manifest = readJson('task-manifest.json');
const totalTasks = manifest.tasks.length;
const completedTasks = manifest.tasks.filter(t => t.status === 'passed').length;
const failedTasks = manifest.tasks.filter(t => t.status === 'failed').length;
```

**结论**：session-progress.md 可从 task-manifest.json 实时生成，无需存储。

### session-handoff.md → 可生成
```markdown
## Next Steps
- Continue from Task T003
- Review checkpoint at ...
```

**映射**：
```javascript
const manifest = readJson('task-manifest.json');
const nextTask = manifest.tasks.find(t => t.status === 'pending');
const lastCheckpoint = readJson(`checkpoint-${lastTaskId}.json`);
```

**结论**：session-handoff.md 可从 task-manifest.json + checkpoint.json 生成。

---

## 正确的实现策略

### Phase 1: 废弃旧文件（不破坏兼容性）

1. **标记为 compatibility only**：
   - 在 flow-init/flow-spec skills 中移除对 session-* 文件的主流程依赖
   - 检测到旧文件时输出 compatibility warning，而不是把它们当成 canonical source

2. **迁移脚本**（可选）：
   ```bash
   # .claude/scripts/migrate-legacy-state.sh
   # 将旧状态收敛为 harness-state.json + resume-index.md，并保留 compatibility mirror
   ```

### Phase 2: 增强 harness-state.json（最小化扩展）

当前 harness-state.json 已经足够简洁，只需添加一个可选字段：

```json
{
  "changeId": "REQ-123",
  "goal": "...",
  "status": "initialized|planned|in_progress|verified|released",
  "initializedAt": "...",
  "plannedAt": "...",      // 新增：plan 完成时间
  "verifiedAt": "...",     // 新增：verify 完成时间
  "releasedAt": "...",
  "updatedAt": "..."
}
```

**新增状态**：
- `planned` - harness:plan 完成后
- `in_progress` - harness:dispatch 开始后
- `verified` - harness:verify 通过后

### Phase 3: 提供查询工具

创建辅助函数从分散的文件中聚合信息：

```javascript
// lib/harness/query.js

async function getProgress(repoRoot, changeId) {
  const manifest = await readJson(getTaskManifestPath(repoRoot, changeId));
  return {
    totalTasks: manifest.tasks.length,
    completedTasks: manifest.tasks.filter(t => t.status === 'passed').length,
    failedTasks: manifest.tasks.filter(t => t.status === 'failed').length,
    pendingTasks: manifest.tasks.filter(t => t.status === 'pending').length
  };
}

async function getNextTask(repoRoot, changeId) {
  const manifest = await readJson(getTaskManifestPath(repoRoot, changeId));
  return manifest.tasks.find(t => t.status === 'pending');
}

async function getFullState(repoRoot, changeId) {
  const state = await readJson(getHarnessStatePath(repoRoot, changeId));
  const manifest = await readJson(getTaskManifestPath(repoRoot, changeId));
  const report = await readJson(getReportCardPath(repoRoot, changeId), null);

  return {
    lifecycle: state,
    progress: await getProgress(repoRoot, changeId),
    nextTask: await getNextTask(repoRoot, changeId),
    quality: report
  };
}
```

---

## 实施计划

### Task #10 重新定义

**目标**：废弃旧状态文件，增强 harness-state.json，提供查询工具

**步骤**：

1. **更新 harness-state.json schema**：
   - 添加 `plannedAt`, `verifiedAt` 字段
   - 扩展 status 枚举：`initialized|planned|in_progress|verified|released`

2. **更新 operations**：
   - `plan.js`: 写入 `plannedAt`
   - `dispatch.js`: 写入 `status: 'in_progress'`
   - `verify.js`: 写入 `verifiedAt`

3. **创建查询工具**：
   - `lib/harness/query.js`: getProgress, getNextTask, getFullState

4. **废弃旧文件引用**：
   - 更新 flow-init/flow-spec skills
   - 移除 session-* 文件的生成逻辑
   - 添加 deprecation warnings

5. **文档更新**：
   - 更新 CLAUDE.md 说明新架构
   - 添加迁移指南

---

## 验证标准

- [ ] harness-state.json 包含完整生命周期状态
- [ ] task-manifest.json 包含任务进度
- [ ] query.js 可以聚合所有状态信息
- [ ] flow-init/flow-spec 不再引用 session-* 文件
- [ ] 旧需求（REQ-004/005/006）可以继续工作（向后兼容）

---

## 总结

**核心原则**：
1. 不创建新的臃肿文件
2. 保持 v6.0 的关注点分离
3. 通过查询工具聚合信息
4. 优雅地废弃旧文件

**哲学**：
> 单一真相源通过**职责分离 + 查询聚合**实现，而非将所有数据塞入一个文件。

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
