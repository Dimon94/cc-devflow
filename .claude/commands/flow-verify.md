---
name: flow-verify
description: Comprehensive consistency verification across documents and implementation. Usage: /flow-verify "REQ-123" or /flow-verify --all
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
  generate_status: .claude/scripts/generate-status-report.sh
---

# Flow-Verify - 一致性验证命令

## User Input
```text
$ARGUMENTS = "REQ_ID? [--all] [--summary] [--critical-only] [--since=ISO] [--diff=RANGE] [--documents-only|--implementation-only|--tests-only]"
```
缺省 REQ_ID 时使用当前分支；`--all` 针对所有需求。

## 验证维度
- 文档链路：`PRD.md → TECH_DESIGN.md → data-model.md → contracts/ → EPIC.md → TASKS.md`
- 实现链路：`代码实现 ↔ tests ↔ quickstart.md`
- 状态链路：`orchestration_status.json`、`EXECUTION_LOG.md`

## 执行流程

### 阶段 1: Entry Gate
```
1. 参数解析
   → 支持单需求、批量 (--all)、增量 (--since/--diff)、维度过滤 (--documents-only 等)

2. 前置检查
   → {SCRIPT:prereq} --json
   → 确保存在: PRD.md, TECH_DESIGN.md, data-model.md, contracts/, quickstart.md, EPIC.md, TASKS.md
   → orchestration_status.status 至少为 "dev_complete"（或用户指定跳过实现验证）

3. 选择验证集合
   → 单需求: 使用传入 ID
   → --all: 枚举 devflow/requirements/**
```

### 阶段 2: 验证准备
```
1. 汇总上下文
   → 读取研究/设计/规划/实现资产，构建追溯矩阵
2. 配置验证级别
   → 默认: 全量
   → --summary: 仅关键阻断项
   → --critical-only: 只输出严重问题
3. 更新 EXECUTION_LOG.md 记录验证开始
```

### 阶段 3: Consistency Checks
```
1. 文档一致性
   → PRD 用户故事 ↔ EPIC scopes ↔ TASKS phases
   → TECH_DESIGN 决策 ↔ data-model / contracts / quickstart

2. 实现一致性
   → TASKS 任务 ↔ Git 提交 ↔ 测试文件
   → quickstart 命令可执行性（dry-run 或脚本验证）

3. 质量守则
   → {SCRIPT:validate_constitution} --type verify --severity warning
   → 检查 Simplicity / Anti-Abstraction / Integration-First、No Partial Implementation、No Dead Code 等
```

### 阶段 4: 报告输出
```
1. 生成 report
   → 路径: devflow/requirements/${REQ_ID}/VERIFY_REPORT.md
   → 包含: 概览、通过/失败项、严重度、建议、受影响文件

2. 更新状态
   → orchestration_status:
        lastVerificationAt = ISO timestamp
        verificationStatus = "passed" 或 "issues_found"
   → EXECUTION_LOG 记录完成

3. 可选: {SCRIPT:generate_status} 汇总全部需求验证结果
```

## 输出
```
✅ VERIFY_REPORT.md
✅ orchestration_status.json（记录验证状态）
✅ EXECUTION_LOG.md 更新
```

## 错误处理
- 缺失关键资产 → 提示前置命令（/flow-prd、/flow-tech、/flow-epic、/flow-dev）。
- 验证脚本失败 → 输出日志位置，保持 verificationStatus = "failed".
- Constitution 违规 → 报告标记为 BLOCKER，需在发版前修复。

## 建议后续
1. 对 issues_found 的需求，回到对应阶段修复。
2. 在 `/flow-release` 前确保最新验证为 PASS。
3. 将验证报告纳入 QA 签核材料。
