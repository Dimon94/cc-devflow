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
   → devflow/requirements/*/orchestration_status.json
   → devflow/bugs/*/orchestration_status.json
3. 读取每个状态文件及 EXECUTION_LOG.md 头部，提取:
   → status, phase, completedSteps, phase0/phase1 flag, lastUpdated
   → 是否存在 context-package/task-manifest/report-card/RELEASE_NOTE
4. 若 `--branches`: 读取 git 分支与 upstream 状态
5. 若 `--detailed`: 关联 task-manifest 任务统计、report-card 结论、release note
```

### 3. 输出格式
- **默认概览**: 表格显示 ID、标题、当前阶段、关键产物完成度、最近更新时间。
- **详细模式**: 列出各阶段产物路径、phase0/phase1 标志、剩余步骤与下一命令建议。
- **Summary/All**: 使用 {SCRIPT:generate_status} 生成聚合报告。

### 4. 建议动作
  - 根据状态字段提示下一命令（优先主链）：
    - `status=initialized` 或 `status=context_packed` → `/flow:spec`
    - `status=planned` 或 `status=spec_complete` → `/flow:dev`
    - `status=development_in_progress` 且有失败任务 → `/flow:dev --resume`
    - `status=development_complete` → `/flow:verify --strict`
    - `status=quality_complete` 或 `status=verified` → `/flow:release`

## 输出样例
```
📊 CC-DevFlow 状态总览 (更新: 2025-02-10T09:12Z)
┌─────────┬──────────────┬───────────────┬────────────┬──────────┐
│ ID      │ Title        │ Status        │ Phase      │ Next     │
├─────────┼──────────────┼───────────────┼────────────┼──────────┤
│ REQ-123 │ 下单流程优化   │ planned        │ planning   │ /flow:dev │
│ REQ-124 │ 权限矩阵       │ quality_complete │ verify  │ /flow:release │
│ REQ-125 │ 账单导出       │ initialized    │ init       │ /flow:spec │
└─────────┴──────────────┴───────────────┴────────────┴──────────┘
```

## 错误处理
- 找不到 ID → 提示有效目录。
- 状态文件损坏 → 标记“unknown”，提示用户修复。
- `--branches` 请求但 Git 不可用 → 输出提示并继续其他数据。
