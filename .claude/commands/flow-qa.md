---
name: flow-qa
description: Execute quality assurance and security review. Usage: /flow-qa "REQ-123" or /flow-qa
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  check_tasks: .claude/scripts/check-task-status.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
---

# Flow-QA - 质量保证命令

## User Input
```text
$ARGUMENTS = "REQ_ID?"
```
未提供则根据当前分支或 `DEVFLOW_REQ_ID` 自动解析。

## 执行流程

### 阶段 1: Entry Gate
```
1. 解析 REQ_ID
2. {SCRIPT:prereq} --json 验证:
   → 存在 PRD.md、TECH_DESIGN.md、data-model.md、contracts/、quickstart.md、EPIC.md、TASKS.md
   → orchestration_status.status ∈ {"development_complete", "qa_failed"}
   → phase1_complete == true
3. {SCRIPT:check_tasks} --json 确认 remaining == 0
4. quickstart.md 中的测试命令必须全部通过（先 dry-run）
5. TEST_REPORT.md / SECURITY_REPORT.md 已存在时提示是否覆盖
```

### 阶段 2: QA 准备
```
1. 执行 quickstart 中的覆盖率命令（如有）
2. 收集上下文:
   → PRD 用户故事、验收标准
   → TECH_DESIGN 决策（安全、性能）
   → data-model / contracts
   → TASKS DoD、提交记录
3. 更新 orchestration_status:
   → status = "qa_in_progress"
   → phase = "quality_assurance"
4. EXECUTION_LOG.md 记录 QA 启动（含测试覆盖率）
```

### 阶段 3: Agents
```
1. qa-tester
   → 输入: PRD, TECH_DESIGN, TASKS, test results, coverage
   → 产出: TEST_PLAN.md (如缺失) / TEST_REPORT.md
   → 覆盖内容: 覆盖率、TDD 合规、AC 覆盖、DoD 复核、缺失测试建议

2. security-reviewer
   → 输入: TECH_DESIGN 安全节、contracts、实现 diff、ENV/secret 配置
   → 产出: SECURITY_PLAN.md (如缺失) / SECURITY_REPORT.md
   → 检查: 认证/授权、输入验证、敏感信息、依赖风险、基础设施配置

3. 可选: performance-reviewer（若 TECH_DESIGN 有性能方案）
```

### 阶段 4: Exit Gate
```
1. 验证报告存在:
   → TEST_REPORT.md、SECURITY_REPORT.md
2. 质量结论:
   → 所有 gate (Coverage、TDD、Security) 均为 PASS；否则状态设为 qa_failed
3. 宪法检查:
   → {SCRIPT:validate_constitution} --type qa --severity warning
4. 状态更新:
   → orchestration_status.status = "qa_complete"
   → completedSteps append "qa"
   → lastQaAt = timestamp
5. EXECUTION_LOG 记录完成
```

## 输出
```
✅ TEST_REPORT.md
✅ SECURITY_REPORT.md
✅ （可选）PERFORMANCE_REPORT.md
✅ orchestration_status.json 更新 (qa_complete)
✅ EXECUTION_LOG.md QA 记录
```

## 错误处理
- quickstart 测试失败 → 返回错误并保持 qa_failed。
- 报告中存在 BLOCKER → 阶段终止，需返回 `/flow-dev` 修复。
- Constitution 违规 → 将问题标记为阻断项。

## 下一步
1. 处理 QA 报告中的问题（若有）。
2. 确认验证通过后运行 `/flow-release`。
3. 将报告随 PR 一并提交，供代码审阅与发布审批使用。
