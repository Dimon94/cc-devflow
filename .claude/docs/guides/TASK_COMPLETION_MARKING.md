# 任务完成标记指南

## 问题描述

在执行 `/flow:dev` 时，主代理完成了代码实现，但没有同步更新 TASKS.md 中的待办事项复选框。这导致：

- ❌ TASKS.md 显示任务未完成 `[ ]`，但代码已经实现
- ❌ 进度追踪不准确，无法知道真实进度
- ❌ 可能重复执行已完成的任务
- ❌ 无法正确生成状态报告

## 解决方案

### 1. 强制执行标记流程

在 `/flow:dev` 命令文档中，已经强化了任务完成标记的要求：

```bash
# 每完成一个任务后，必须立即执行
bash .claude/scripts/mark-task-complete.sh T001
```

**关键点**：
- ⚠️ **MANDATORY** - 不是可选的
- 每个任务完成后立即执行
- 不要手动编辑 TASKS.md
- 验证输出显示 "✅ Task T001 marked as complete"

### 2. 使用诊断工具

新增的 `sync-task-marks.sh` 脚本可以帮助检测和修复未标记的任务：

```bash
# 检查哪些任务已执行但未标记
bash .claude/scripts/sync-task-marks.sh --dry-run

# 交互式修复（推荐）
bash .claude/scripts/sync-task-marks.sh

# 批量自动标记（谨慎使用）
bash .claude/scripts/sync-task-marks.sh --auto-mark
```

### 3. 工作流集成

#### 阶段 1: 任务执行循环

```text
For each task in TASKS.md:
  1. Load task details
  2. Display task information
  3. Execute task implementation (写代码)
  4. Verify task completion (DoD check)
  5. ⚠️ MANDATORY: Mark task as complete
     → bash .claude/scripts/mark-task-complete.sh ${task_id}
  6. Continue to next task
```

#### 阶段 2: Exit Gate 验证

```bash
# 验证所有任务都已标记完成
bash .claude/scripts/check-task-status.sh --json

# 如果发现任务未标记
bash .claude/scripts/sync-task-marks.sh --dry-run
# 手动执行每个任务的标记命令
```

## 完整示例

### 场景 1: 正常工作流

```bash
# 1. 开始开发
/flow:dev "REQ-123"

# 2. Claude 完成任务 T001
#    (写代码、运行测试等)

# 3. ⚠️ 立即标记任务完成
bash .claude/scripts/mark-task-complete.sh T001
# 输出: ✅ Task T001 marked as complete
#       Progress: 1 completed, 9 remaining
#       Overall: 10% complete

# 4. 继续下一个任务 T002
# ...重复步骤 2-3
```

### 场景 2: 发现任务未标记

```bash
# 1. 发现问题：代码已实现，但 TASKS.md 显示 [ ]
$ cat devflow/requirements/REQ-123/TASKS.md
## Phase 2: Tests First
- [ ] **T003** Write user creation test  # ← 代码已经写了，但未标记

# 2. 运行诊断脚本
$ bash .claude/scripts/sync-task-marks.sh --dry-run

🔍 Checking task completion status for REQ-123...

Task Summary:
  Total tasks:     10
  Completed:       2
  Remaining:       8

⚠️  Uncompleted tasks (still marked as [ ]):
  [ ] T003: - [ ] **T003** Write user creation test
  [ ] T004: - [ ] **T004** Write login test
  ...

🔍 DRY RUN - No changes will be made

To mark these tasks as complete, run:
  bash .claude/scripts/mark-task-complete.sh T003
  bash .claude/scripts/mark-task-complete.sh T004
  ...

# 3. 手动执行标记命令
bash .claude/scripts/mark-task-complete.sh T003
bash .claude/scripts/mark-task-complete.sh T004

# 或使用交互式模式
$ bash .claude/scripts/sync-task-marks.sh
What would you like to do?

1. Show commands to manually mark each task
2. Mark all tasks as complete now (auto-mark)
3. Exit without changes

Choose [1-3]: 1
```

### 场景 3: 批量修复（谨慎使用）

```bash
# 仅在确定所有任务都已完成时使用
bash .claude/scripts/sync-task-marks.sh --auto-mark

⚠️  AUTO-MARK mode enabled - marking all tasks as complete...

Marking T003...
✅ Task T003 marked as complete
Marking T004...
✅ Task T004 marked as complete
...

✅ All tasks marked as complete
```

## 脚本 API

### mark-task-complete.sh

标记单个任务为完成状态。

**用法**:
```bash
bash .claude/scripts/mark-task-complete.sh TASK_ID [OPTIONS]
```

**参数**:
- `TASK_ID`: 任务ID (如 T001, T002)

**选项**:
- `--json`: JSON 格式输出
- `--no-log`: 不记录到 EXECUTION_LOG.md
- `--help`: 显示帮助

**返回值**:
- `0`: 成功标记
- `1`: 错误（任务不存在、已完成等）

**示例**:
```bash
# 标记 T001 为完成
bash .claude/scripts/mark-task-complete.sh T001

# JSON 输出
bash .claude/scripts/mark-task-complete.sh T005 --json

# 不记录日志
bash .claude/scripts/mark-task-complete.sh T010 --no-log
```

### sync-task-marks.sh

诊断和修复未标记的任务。

**用法**:
```bash
bash .claude/scripts/sync-task-marks.sh [OPTIONS]
```

**选项**:
- `--dry-run`: 只显示要做什么，不实际修改
- `--auto-mark`: 自动标记所有任务（危险）
- `--help`: 显示帮助

**返回值**:
- `0`: 成功或所有任务已完成
- `1`: 错误（无需求ID、目录不存在等）

**示例**:
```bash
# 检查状态（推荐先运行）
bash .claude/scripts/sync-task-marks.sh --dry-run

# 交互式修复
bash .claude/scripts/sync-task-marks.sh

# 批量自动标记
bash .claude/scripts/sync-task-marks.sh --auto-mark
```

## 最佳实践

### DO ✅

1. **立即标记**: 完成任务后立即执行 `mark-task-complete.sh`
2. **使用脚本**: 始终用脚本，不要手动编辑 TASKS.md
3. **验证输出**: 检查脚本输出确认标记成功
4. **定期检查**: 在开发过程中定期运行 `sync-task-marks.sh --dry-run`
5. **Exit Gate**: 在 `/flow:dev` 结束前验证所有任务已标记

### DON'T ❌

1. **手动编辑**: 不要直接修改 TASKS.md 的复选框
2. **批量操作**: 不要等到所有任务完成后再批量标记
3. **跳过验证**: 不要忽略脚本输出或进度信息
4. **盲目 auto-mark**: 不要在未确认任务完成时使用 `--auto-mark`
5. **忽略错误**: 如果标记失败，必须立即调查原因

## 常见问题

### Q: 为什么要使用脚本而不是手动编辑？

**A**: 脚本提供：
- ✅ 标准化的格式（避免手动编辑错误）
- ✅ 自动记录到 EXECUTION_LOG.md
- ✅ 更新 orchestration_status.json
- ✅ 实时进度反馈
- ✅ 错误检查和验证

### Q: 如果任务已经标记为完成，再次运行会怎样？

**A**: 脚本会检测到并提示：
```bash
$ bash .claude/scripts/mark-task-complete.sh T001
Task T001 is already marked as complete
```

### Q: sync-task-marks.sh 如何知道任务是否真的完成了？

**A**: 它只检查 TASKS.md 中的复选框状态。实际验证任务是否完成需要：
- 检查代码文件是否存在
- 运行测试验证功能
- 人工 review

使用 `--dry-run` 先检查，然后手动确认每个任务再标记。

### Q: 什么时候使用 --auto-mark？

**A**: 只在以下情况：
- 100% 确定所有显示为 `[ ]` 的任务都已完成
- 需要快速修复遗留的标记问题
- 有完整的 Git 历史可以回滚

**推荐**: 使用交互式模式，逐个确认每个任务。

## 技术实现

### mark-task-complete.sh 工作原理

```bash
# 1. 解析任务ID (T001 → T001)
TASK_ID=$(echo "$TASK_ID" | tr '[:lower:]' '[:upper:]')

# 2. 验证格式 (T\d+)
[[ "$TASK_ID" =~ ^T[0-9]+$ ]]

# 3. 查找任务行
grep -q "\\[ \\] .*$TASK_ID" "$TASKS_FILE"

# 4. 替换复选框 ([ ] → [x])
sed "s/- \[ \] \(\*\*\)\{0,1\}$TASK_ID\(\*\*\)\{0,1\}/- [x] \1$TASK_ID\2/" "$TASKS_FILE"

# 5. 记录事件
log_event "$REQ_ID" "✅ Task $TASK_ID marked as complete"
```

### sync-task-marks.sh 工作原理

```bash
# 1. 统计任务
TOTAL_TASKS=$(grep -c "^- \[ \]" "$TASKS_FILE")
COMPLETED_TASKS=$(grep -c "^- \[x\]" "$TASKS_FILE")

# 2. 提取未完成任务ID
while IFS= read -r line; do
    if [[ "$line" =~ \*\*T([0-9]+)\*\* ]]; then
        task_id="T${BASH_REMATCH[1]}"
        UNCOMPLETED+=("$task_id")
    fi
done < <(grep "^- \[ \]" "$TASKS_FILE")

# 3. 显示或执行标记
for task_id in "${UNCOMPLETED[@]}"; do
    bash mark-task-complete.sh "$task_id"
done
```

## 集成测试

新增的测试套件 `test_sync_task_marks.sh` 验证：

- ✅ Help 消息显示
- ✅ 无需求ID时的错误处理
- ✅ 需求目录不存在的错误处理
- ✅ TASKS.md 不存在的错误处理
- ✅ 所有任务已完成的场景
- ✅ 列出未完成任务
- ✅ Dry-run 模式显示命令

运行测试：
```bash
bash .claude/tests/scripts/test_sync_task_marks.sh
```

## 相关文档

- [mark-task-complete.sh 源码](.claude/scripts/mark-task-complete.sh)
- [sync-task-marks.sh 源码](.claude/scripts/sync-task-marks.sh)
- [/flow:dev 命令文档](.claude/commands/flow/dev.md)
- [TASKS_TEMPLATE.md 模板](.claude/docs/templates/TASKS_TEMPLATE.md)
- [测试框架](.claude/tests/test-framework.sh)
