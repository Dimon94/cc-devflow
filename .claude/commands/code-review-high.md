---
name: code-review-high
description: Produce a high-rigor code review report with severity triage. Usage: /code-review-high "<diff or summary>"
scripts:
  review: .claude/scripts/run-high-review.sh
---

# Code-Review-High - 高强度代码审查命令

## User Input
```text
$ARGUMENTS = "<patch|summary|PR URL>"
```
可传递 git diff、文件路径列表或变更摘要。命令会把输入交给后端脚本执行标准化审查流程。

## 执行流程

### 阶段 1: 输入收集
- 接受变更摘要（本地 diff、PR 链接、文件列表）。
- 解析模块范围、涉及文件数量、风险等级。

### 阶段 2: 调用审查脚本
```
Run: {SCRIPT:review} --input "<payload>" --severity high
```
- 脚本加载审查模板 (.claude/docs/templates/REVIEW-HIGH.md)。
- 聚合上下文：最近提交、相关测试结果、配置/基础设施变更。

### 阶段 3: 生成报告
- 输出结构遵循高强度审查骨架：
  - Summary、Top risks、Approval 建议
  - 受影响文件列表
  - Root cause & assumptions
  - Findings（按严重度分类，附位置与修复建议）
  - Performance、Integration、Testing、Docs、Open questions、Final recommendation
- 报告保存为 `reviews/high-review-${timestamp}.md`，并打印路径。

## 审查准则
- 关注 correctness、security、performance、integration、test 覆盖、长期可维护性。
- 使用提供的 severity rubric（BLOCKER/HIGH/MEDIUM/LOW/NIT）。
- 每个高风险问题需给出最小修复方案与验证方式。
- 若缺少必要上下文（测试计划、迁移脚本等），在 Findings 中标注并请求补充。

## 错误处理
- 输入为空 → 提示提供 diff 或摘要。
- 脚本运行失败 → 输出错误日志路径。
- 报告写入失败 → 保留临时文件并提示手动保存。

## 输出
```
✅ reviews/high-review-*.md
✅ 控制台显示摘要和建议
```

## 下一步
- 将报告附在 PR 审查意见中。
- 若存在 BLOCKER/HIGH 问题，要求作者修复后再次运行本命令。
- Reviewed PR 通过后，可存档报告于 devflow/requirements/${REQ}/reviews/。
