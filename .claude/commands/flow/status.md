---
name: flow-status
description: 'Query development progress status for cc-devflow requirements. Usage: /flow:status [REQ-ID]'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  generate_status: .claude/scripts/generate-status-report.sh
---

# Flow-Status - 开发进度查询命令

## User Input
```text
$ARGUMENTS = "[REQ_ID?] [--all] [--bugs] [--detailed] [--summary]"
```
默认显示所有活跃需求的概览；指定 REQ_ID 时输出单一详情。

## 执行流程

### 1. 参数解析
- 验证 ID 格式 (`REQ-\d+` / `BUG-\d+`)。
- 识别 `--all`、`--bugs`、`--detailed`、`--summary`、`--branches` 等标志。

### 2. 数据收集
```
1. 运行 {SCRIPT:prereq} --json --paths-only
2. 扫描:
   → devflow/requirements/*/harness-state.json
   → devflow/requirements/*/task-manifest.json
   → devflow/requirements/*/report-card.json
   → devflow/intent/*/resume-index.md
   → devflow/intent/*/artifacts/pr-brief.md
3. 聚合读取当前 requirement 的主状态，提取:
   → harness lifecycle/status/updatedAt
   → task 统计、next task、verify 结论
   → 是否存在 resume-index / pr-brief
4. 若 `--branches`: 读取 git 分支与 upstream 状态
5. 若 `--detailed`: 关联 runtime checkpoint、report-card、pr-brief 与 release note
```

### 3. 输出格式
- **默认概览**: 表格显示 ID、标题、当前阶段、关键产物完成度、最近更新时间。
- **详细模式**: 列出主链产物路径、下一步唯一动作、剩余步骤与下一命令建议。
- **Summary/All**: 使用 {SCRIPT:generate_status} 生成聚合报告。

### 4. 建议动作
  - 根据状态字段提示下一命令（优先主链）：
    - `status=initialized` → `/flow:spec`
    - `status=planned` → `/flow:dev`
    - `status=in_progress` 且有失败任务 → `/flow:dev --resume`
    - `status=in_progress` 且任务已收敛 → `/flow:verify --strict`
    - `status=verified` 或 `report-card.json.overall == pass` → `/flow:prepare-pr`
    - `status=prepare-pr` 或已存在 `pr-brief.md` → `/flow:release`
  - 兼容旧状态字段时，统一映射到同一主链建议，不把历史阶段名当标准答案。

## 读取优先级

1. `devflow/intent/<REQ>/resume-index.md`
2. `devflow/requirements/<REQ>/harness-state.json`
3. `devflow/requirements/<REQ>/task-manifest.json`
4. `devflow/requirements/<REQ>/report-card.json`

## 输出样例
```
📊 CC-DevFlow 状态总览 (更新: 2025-02-10T09:12Z)
┌─────────┬──────────────┬───────────────┬────────────┬──────────┐
│ ID      │ Title        │ Status        │ Phase      │ Next     │
├─────────┼──────────────┼───────────────┼────────────┼──────────┤
│ REQ-123 │ 下单流程优化   │ planned        │ spec       │ /flow:dev │
│ REQ-124 │ 权限矩阵       │ verified       │ prepare-pr │ /flow:release │
│ REQ-125 │ 账单导出       │ initialized    │ init       │ /flow:spec │
└─────────┴──────────────┴───────────────┴────────────┴──────────┘
```

## 错误处理
- 找不到 ID → 提示有效目录。
- 状态文件损坏 → 标记“unknown”，提示用户修复。
- `--branches` 请求但 Git 不可用 → 输出提示并继续其他数据。
