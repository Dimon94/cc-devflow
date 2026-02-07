---
name: problem-analyzer
description: 'Diagnose incidents or regressions and outline minimal fixes. Usage: /problem-analyzer "<issue description>"'
scripts:
  analyze: .claude/scripts/run-problem-analysis.sh
---

# Problem-Analyzer - 问题诊断命令

## User Input
```text
$ARGUMENTS = "<bug report | stack trace | failing test output>"
```
请提供问题现象、日志片段、相关模块等信息。若多个症状可使用多行或 Markdown 列表。

## 执行流程

### 阶段 1: 资料收集
- 解析输入中的组件名称、报错关键字、最近提交 ID。
- 自动查找与关键词匹配的文件（src/, tests/, migrations/ 等）供快速定位。

### 阶段 2: 调用分析脚本
```
Run: {SCRIPT:analyze} --input "<payload>"
```
- 脚本聚合：
  - git 历史：与问题模块相关的最近提交
  - 日志/栈信息（如提供）
  - 测试结果（若输入包含 failing tests）
- 生成诊断草稿 (tmp/problem-analysis-*.json) 供审查。

### 阶段 3: 结构化输出
- 自动套用标准模板，输出：
  - Affected files (路径 + 原因)
  - Root cause （短说明 + 传播路径）
  - Proposed fix（最小修复、阶段步骤、测试清单）
  - Documentation gaps（需更新的 README/ADR/config/schema）
  - Open questions / assumptions
- 报告写入 `analysis/problem-${timestamp}.md` 并回显路径。

## 诊断准则
- 优先定位“一因多果”的根因；避免泛泛记录症状。
- 修复建议需可落地：列出主要代码块/函数及测试更新。
- 未知假设需明确列出并在 Open questions 中提醒跟进。

## 错误处理
- 输入不足 → 提示提供最少信息（现象 + 模块或错误消息）。
- 自动定位失败 → 输出“人工筛查建议”并生成空模板。
- 报告写入失败 → 保留临时 JSON 供手动导出。

## 输出
```
✅ analysis/problem-*.md
✅ 控制台显示根因摘要与建议修复
```

## 下一步
- 将报告附于 bug ticket 或 PR 描述。
- 根据 Proposed fix 执行修复，并在 `/flow-fix` 中引用该报告。
- 诊断完成后，更新 README/ADR/运行手册中相关章节。
