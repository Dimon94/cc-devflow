---
name: flow-archive
description: 'Archive completed or retired requirements after release. Usage: /flow:archive "REQ-123" [--reason completed|deprecated|obsolete|superseded] | /flow:archive --list | /flow:archive "REQ-123" --restore'
version: 6.2.0
scripts:
  archive: .claude/scripts/archive-requirement.sh
---

# /flow:archive - 需求归档命令

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## 定位

这是主链收尾后的生命周期命令。

- 当前 canonical path: `/flow:autopilot` -> `/flow:init` -> `/flow:spec` -> `/flow:dev` -> `/flow:verify` -> `/flow:prepare-pr` -> `/flow:release`
- `/flow:archive` 不属于交付主链，只处理已完成或已废弃需求的归档/恢复
- 主状态优先读取 `harness-state.json`、`report-card.json`、`devflow/intent/<REQ>/resume-index.md`

## User Input

```text
$ARGUMENTS = "REQ_ID?" | "--list" | "REQ_ID --restore" | "REQ_ID --reason completed|deprecated|obsolete|superseded"
```

## 命令格式

```text
/flow:archive "REQ-123"
/flow:archive "REQ-123" --reason deprecated
/flow:archive --list
/flow:archive "REQ-123" --restore
```

## 执行流程

### 1. Entry Gate

1. 解析模式：`archive | list | restore`
2. 校验 `REQ_ID` / `BUG_ID`
3. 归档前读取当前状态：
   - `devflow/requirements/<REQ>/harness-state.json`
   - `devflow/requirements/<REQ>/report-card.json`
   - `devflow/intent/<REQ>/resume-index.md`
4. 若是完成归档：
   - `--reason completed` 要求当前 lifecycle 必须是 `released`
   - 若尚未 `released`，必须明确给出 `deprecated|obsolete|superseded`

### 2. Archive

1. 目标目录：`devflow/archive/<YYYY-MM>/<REQ_ID>/`
2. 移动 requirement 或 bug 目录
3. 保留现有工件，不重写历史事实
4. 补充归档元数据：
   - `archivedReason`
   - `archivedAt`
   - `archiveLocation`
   - `statusBeforeArchive`

### 3. List

1. 扫描 `devflow/archive/`
2. 优先读取 archived requirement 内的 `harness-state.json`
3. 输出月份、ID、原因、归档前状态、最后更新时间

### 4. Restore

1. 从 `devflow/archive/*/<REQ_ID>/` 定位需求
2. 检查活跃目录不存在同名需求
3. 移回 `devflow/requirements/` 或 `devflow/bugs/`
4. 恢复 `statusBeforeArchive`
5. 清理 archive-only compatibility 字段（如 `archivedReason`、`archiveLocation`、`deltaCount`）
6. 更新 `resume-index.md`，写明恢复后的唯一下一步动作

## 输出

- 归档后目录：`devflow/archive/<YYYY-MM>/<REQ_ID>/`
- 保留原有：
  - `harness-state.json`
  - `task-manifest.json`
  - `report-card.json`
  - `RELEASE_NOTE.md`
  - `devflow/intent/<REQ>/` 的 Markdown memory

## 建议

- 已交付完成：只有 `released` 生命周期才能用 `--reason completed`
- 已废弃需求：归档原因用 `deprecated|obsolete|superseded`
- 恢复后优先执行 `/flow:status REQ-123 --detailed` 或 `/flow:autopilot "REQ-123|继续当前工作" --resume`
