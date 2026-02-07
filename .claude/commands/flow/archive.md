---
name: flow-archive
description: 'Archive completed/deprecated requirements with Delta Specs support. Usage: /flow:archive "REQ-123" or /flow:archive --list'
version: 4.5.0
scripts:
  archive: .claude/scripts/archive-requirement.sh
---

# /flow:archive - 需求归档命令 (v4.5)

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## User Input
```text
$ARGUMENTS = "REQ_ID?" | "--list" | "--restore REQ_ID"
```
未提供 REQ_ID 时，根据当前分支或 `DEVFLOW_REQ_ID` 自动解析。

## 命令格式
```text
/flow:archive "REQ-123"                      # 归档已完成需求
/flow:archive "REQ-123" --reason deprecated  # 标记为废弃归档
/flow:archive --list                         # 列出所有归档
/flow:archive "REQ-123" --restore            # 恢复归档需求
```

### 参数说明
- **REQ_ID**: 需求编号，格式 REQ-XXX 或 BUG-XXX
- **--reason**: 归档原因
  - `completed` (默认) - 需求已完成并发布
  - `deprecated` - 需求已废弃，不再需要
  - `obsolete` - 需求已过时，被新需求取代
  - `superseded` - 被其他需求合并或替代
- **--list**: 列出所有归档的需求
- **--restore**: 将归档的需求恢复到活跃目录

## 执行流程

### 阶段 1: Entry Gate (参数验证)
```
1. 解析命令参数
   → 检测模式: archive | list | restore

2. 验证 REQ_ID 格式
   → 必须匹配: ^(REQ|BUG)-[0-9]+(-[0-9]+)?$

3. 检查需求状态
   → 归档模式: 需求必须存在于 devflow/requirements/ 或 devflow/bugs/
   → 恢复模式: 需求必须存在于 devflow/archive/{YYYY-MM}/

4. 验证归档原因
   → 必须是: completed, deprecated, obsolete, superseded 之一

*GATE CHECK: 参数验证通过*
```

### 阶段 2: 归档执行
```
1. 确定归档目标目录
   → 格式: devflow/archive/{YYYY-MM}/{REQ_ID}/
   → 年月使用北京时间

2. 备份当前状态
   → 读取 orchestration_status.json 的 status 字段
   → 保存为 statusBeforeArchive

3. 移动目录
   → mv devflow/requirements/{REQ_ID}/ → devflow/archive/{YYYY-MM}/{REQ_ID}/
   → 或 mv devflow/bugs/{BUG_ID}/ → devflow/archive/{YYYY-MM}/{BUG_ID}/

4. 更新状态文件
   → orchestration_status.json:
     {
       "status": "archived",
       "archivedReason": "{reason}",
       "archivedAt": "{ISO8601+08:00}",
       "archiveLocation": "{target_path}",
       "statusBeforeArchive": "{previous_status}"
     }

5. 追加 EXECUTION_LOG.md
   → 记录归档时间、原因、位置
```

### 阶段 3: 列表模式 (--list)
```
1. 扫描 devflow/archive/ 目录
   → 按月份组织: devflow/archive/{YYYY-MM}/

2. 收集归档信息
   → 读取每个归档需求的 orchestration_status.json
   → 提取: reqId, title, archivedReason, archivedAt

3. 格式化输出
   → 表格形式展示: 月份 | 需求ID | 归档原因 | 标题
```

### 阶段 4: 恢复模式 (--restore)
```
1. 定位归档需求
   → 在 devflow/archive/*/ 中搜索 {REQ_ID}

2. 验证目标位置
   → 确认 devflow/requirements/{REQ_ID}/ 不存在
   → 避免覆盖现有需求

3. 移动回活跃目录
   → mv devflow/archive/{YYYY-MM}/{REQ_ID}/ → devflow/requirements/{REQ_ID}/

4. 恢复状态
   → 读取 statusBeforeArchive，恢复为 status
   → 删除归档相关字段 (archivedAt, archivedReason, archiveLocation)

5. 记录恢复事件
   → EXECUTION_LOG.md 追加恢复记录
```

## 输出产物

### 归档后目录结构
```text
devflow/
├── requirements/          # 活跃需求
│   └── REQ-004/          # 进行中的需求
├── archive/               # 归档区
│   ├── 2025-12/          # 按月份组织
│   │   ├── REQ-003/      # 已归档需求
│   │   │   ├── README.md
│   │   │   ├── PRD.md
│   │   │   ├── EPIC.md
│   │   │   ├── EXECUTION_LOG.md
│   │   │   ├── orchestration_status.json  # status: "archived"
│   │   │   └── research/
│   │   └── REQ-001/
│   └── 2025-11/
│       └── REQ-002/
└── bugs/                  # 活跃Bug
```

### 归档后状态文件
```json
{
  "reqId": "REQ-003",
  "title": "分支命名优化",
  "status": "archived",
  "archivedReason": "completed",
  "archivedAt": "2025-12-16T16:30:00+08:00",
  "archiveLocation": "devflow/archive/2025-12/REQ-003",
  "statusBeforeArchive": "release_complete",
  "completedSteps": ["init", "prd", "epic", "dev", "qa", "release"],
  "prUrl": "https://github.com/xxx/xxx/pull/6"
}
```

## 成功输出
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 需求 REQ-003 已归档
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   原位置: devflow/requirements/REQ-003
   新位置: devflow/archive/2025-12/REQ-003
   归档原因: completed
   归档前状态: release_complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 列表输出
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 归档需求列表
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
月份       | 需求ID       | 归档原因     | 标题
───────────────────────────────────────────────────────────────
2025-12    | REQ-003      | completed    | 分支命名优化
2025-12    | REQ-001      | deprecated   | 旧版登录功能
2025-11    | REQ-002      | superseded   | 用户管理V1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 错误处理

### 常见错误

**1. 需求不存在**
```
ERROR: 需求目录不存在: devflow/requirements/REQ-999
```

**2. 需求已归档**
```
ERROR: REQ-003 已经在归档中: devflow/archive/2025-12/REQ-003
如需重新归档，请先使用 --restore 恢复
```

**3. 恢复时目标已存在**
```
ERROR: 目标目录已存在: devflow/requirements/REQ-003
请先删除或重命名现有目录
```

**4. 无效的归档原因**
```
ERROR: 无效的归档原因: cancelled
有效选项: completed deprecated obsolete superseded
```

## 最佳实践

### 何时归档
- ✅ 需求已完成并成功发布 (`/flow-release` 后)
- ✅ 需求被明确取消或废弃
- ✅ 需求被新需求完全取代

### 何时恢复
- 🔄 需要参考历史实现
- 🔄 需要基于旧需求进行迭代
- 🔄 错误归档需要撤销

### 不要归档
- ❌ 仍在进行中的需求
- ❌ 暂停但计划继续的需求
- ❌ 需要长期维护的需求

## 与其他命令的关系

```text
/flow:init → /flow:spec → /flow:dev → /flow:quality → /flow:release
                                                            ↓
                                                    /flow:archive ← 工作流终点
                                                            ↓
                                                    devflow/archive/{YYYY-MM}/
```

## Delta Specs 集成 (v4.5)

归档时自动处理 Delta Specs:

### 归档前检查
- 检测 `deltas/` 目录中的 Delta Specs
- 警告未应用的 Delta Specs (status != "applied")
- 建议先运行 `/flow:delta apply REQ-XXX --all`

### 归档内容
```
devflow/archive/{YYYY-MM}/{REQ_ID}/
├── PRD.md                    # 主规格文档
├── deltas/                   # Delta Specs (完整保留)
│   ├── 2026-02-01-add-2fa/
│   │   ├── delta.md
│   │   └── tasks.md
│   └── ...
├── orchestration_status.json # 包含 deltaCount 字段
└── ...
```

### 状态文件增强
```json
{
  "status": "archived",
  "archivedReason": "completed",
  "deltaCount": 3,
  "archivedAt": "2026-02-07T10:00:00+08:00"
}
```

## 脚本集成

```bash
# 归档需求
.claude/scripts/archive-requirement.sh "REQ-003" --reason completed

# 列出归档 (JSON格式)
.claude/scripts/archive-requirement.sh --list --json

# 恢复需求
.claude/scripts/archive-requirement.sh "REQ-003" --restore

# 预览操作
.claude/scripts/archive-requirement.sh "REQ-003" --dry-run
```
