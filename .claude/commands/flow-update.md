---
name: flow-update
description: Update task progress for cc-devflow requirements. Usage: /flow-update "REQ-123" "T012" [OPTIONS]
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  check_tasks: .claude/scripts/check-task-status.sh
  mark_complete: .claude/scripts/mark-task-complete.sh
  sync_marks: .claude/scripts/sync-task-marks.sh
---

# Flow-Update - 任务进度更新命令

## User Input
```text
$ARGUMENTS = "REQ_ID TASK_ID [--status=STATE] [--progress=PCT] [--estimate=HRS] [--comment='...'] [--auto] [--test]"
```

## 命令格式
```text
/flow-update "REQ_ID" "TASK_ID" [OPTIONS]
```

### 支持选项
- `--status=planning|in_progress|blocked|review|completed`
- `--progress=0-100`
- `--estimate=<hours>`
- `--comment="text"`
- `--auto`：基于 git diff + quickstart 测试估算进度
- `--test`：运行 quickstart 中相关测试命令
- `--no-sync`：跳过 TASKS.md 复选框同步

## 执行流程

### 阶段 1: Entry Gate
```
1. 参数解析
   → 解析 REQ_ID、TASK_ID 与选项；校验格式 (REQ-\d+, T### 或 TASK_###)。

2. 环境校验
   → Run: {SCRIPT:prereq} --json --require-tasks
   → 确认需求目录、TASKS.md、orchestration_status.json 存在。
   → 确认当前分支对应 REQ_ID（feature/REQ-*）。

3. 任务校验
   → Run: {SCRIPT:check_tasks} --json --task "${TASK_ID}"
   → 阻止更新已完成任务（除非 --status=completed 再次同步）。

4. 快速一致性检查
   → 若 TASKS.md 中该任务未标记 [ ] → [x]，记录当前状态以便后续同步。
```

### 阶段 2: 进度采集与验证
```
1. --auto 模式
   → 分析 git diff 涉及的文件。
   → 检查对应测试文件是否存在。
   → 估算 progress / status 值（默认阈值：代码 ≥1 文件 → in_progress；测试通过 → review）。

2. --test 模式
   → 从 quickstart.md 中解析目标测试命令（匹配任务所属阶段）。
   → 运行并捕获退出码；失败则阻断更新。

3. DoD 对照
   → 若 --status=completed：
      • 测试必须通过（或显式跳过 --test 与 --auto）；
      • `git status --short` 应为空。
```

### 阶段 3: 状态更新
```
1. 更新任务元数据
   → 在 devflow/requirements/${REQ_ID}/tasks/${TASK_ID}.json 写入最新 status/progress/estimate/comment。
   → 若任务目录不存在，则创建 tasks/ 并生成 JSON 框架。

2. Mark script
   → 对已完成任务调用 {SCRIPT:mark_complete} "${TASK_ID}"。
   → 非完成任务但需要勾选同步时，调用 {SCRIPT:sync_marks}。

3. orchestration_status
   → 更新 lastTaskUpdate、completedTasks 数、blockers 等字段。
   → 若所有任务完成且 status ≠ development_in_progress，则设置 status=development_complete。

4. EXECUTION_LOG
   → 追加进度行，包含任务、状态、备注、测试结果。
```

### 阶段 4: Exit Gate
```
1. 再次调用 {SCRIPT:check_tasks} --json 验证进度已反映在统计中。
2. 如果 --test，确认测试命令通过且记录在 tasks/${TASK_ID}.json。
3. 输出摘要（task id、status、progress、下个推荐动作）。
```

## 错误处理
- 参数缺失或格式错误 → 立即终止并提示正确示例。
- git 有未提交变更且 --status=completed → 拒绝更新，提示先提交。
- 测试失败或 DoD 未满足 → 阻止状态升级为 completed。
- 同步 TASKS.md 失败 → 提示使用 {SCRIPT:sync_marks} 手动修复。

## 输出
```
✅ tasks/${TASK_ID}.json 更新
✅ TASKS.md 复选框同步（除非 --no-sync）
✅ orchestration_status.json.lastTaskUpdate 刷新
✅ EXECUTION_LOG.md 记录本次更新
```

## 下一步
- 若所有任务完成：立即运行 `/flow-qa`。
- 若任务被阻塞：添加 `blocked` 注释并通知相关负责人。
- 周期性执行 `/flow-status` 获取进度总览。
