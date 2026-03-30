---
name: flow-update
description: 'Update requirement task progress and sync evidence. Usage: /flow:update "REQ-123" "T012" [--status=STATE] [--comment="..."]'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  check_tasks: .claude/scripts/check-task-status.sh
  mark_complete: .claude/scripts/mark-task-complete.sh
  sync_marks: .claude/scripts/sync-task-marks.sh
---

# Flow-Update - 任务状态更新命令

## 定位

这是 task 粒度的显式同步命令。

- 主状态源：`task-manifest.json`
- 可选人类镜像：`TASKS.md`
- 证据优先：`checkpoint/events/task result`
- 长期恢复入口：`resume-index.md`

## User Input

```text
$ARGUMENTS = "REQ_ID TASK_ID [--status=pending|running|blocked|passed|failed|skipped] [--comment='...'] [--auto] [--test]"
```

## 执行流程

### 1. Entry Gate

1. 校验 `REQ_ID` 与 `TASK_ID`
2. 确认存在：
   - `devflow/requirements/<REQ>/task-manifest.json`
   - `TASKS.md`（仅当仓库仍保留 checkbox 镜像时）
3. 读取当前 task 状态和最近证据

### 2. 状态采集

- `--auto`:
  - 结合 git diff、runtime checkpoint、结果工件估算状态
- `--test`:
  - 运行相关测试命令
  - 仅在测试通过后允许升级为 `passed`

### 3. 写回

1. 更新 `task-manifest.json` 中对应任务的状态/备注
2. 若 `TASKS.md` 存在，按需同步 checkbox
3. 若存在结果工件目录，追加引用：
   - `devflow/intent/<REQ>/artifacts/results/<TASK>.md`
4. 若状态变化影响下一步动作，后续恢复优先读 `resume-index.md`

## 输出

- `task-manifest.json` 更新
- `TASKS.md` 同步（可选）
- 推荐下一步动作：
  - 还有待执行任务 -> `/flow:dev`
  - 全部完成 -> `/flow:verify --strict`
