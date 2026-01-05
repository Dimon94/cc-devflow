---
name: flow-fix
description: 'One-shot BUG fix flow. Usage: /flow-fix "BUG-123|登录时报 500"'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  recover: .claude/scripts/recover-workflow.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
agent_scripts:
  sh: .claude/scripts/update-agent-context.sh __AGENT__
  ps: scripts/powershell/update-agent-context.ps1 -AgentType __AGENT__
---

# Flow-Fix - 一键 BUG 修复流

## User Input
```text
$ARGUMENTS = "BUG_ID|TITLE"
```
BUG_ID 必须满足 `BUG-\d+`；TITLE 为简洁现象描述。

## 命令格式
```text
/flow-fix "BUG-123|登录时报500"
```

## 执行流程

### 阶段 0: Entry Gate
```
1. 解析 BUG_ID、TITLE
   → 若 TITLE 含中文/非ASCII，使用模型意译生成 BRANCH_TITLE_EN（英文语义翻译，禁止拼音/音译）
   → 若意译不确定或未生成 ASCII 结果，向用户确认英文分支标题
2. {SCRIPT:prereq} --json 验证:
   → devflow/bugs/${BUG_ID}/ 是否存在（首次执行将创建）
   → Git 工作区干净
3. 创建目录与分支:
   → git checkout -b "bugfix/${BUG_ID}-${slug(BRANCH_TITLE_EN)}"
   → 初始化 devflow/bugs/${BUG_ID}/ 结构与 orchestration_status.json
4. 检查 quickstart.md
   → 若需求目录已有 quickstart.md，复制引用用于测试执行
```

### 阶段 1: 分析
```
1. 调用 bug-analyzer
   → 输出 ANALYSIS.md（现象、复现、根因、影响范围）
2. 更新 orchestration_status: status="analysis_complete"
3. EXECUTION_LOG 记录分析完成时间
```

### 阶段 2: 计划
```
1. 调用 planner
   → 输入 ANALYSIS.md、现有 quickstart、代码结构
   → 产出 PLAN.md、tasks/ (TDD 顺序: Root Cause → Failing Test → Fix → Regression)
2. 调用 qa-tester / security-reviewer
   → 生成 TEST_PLAN.md、SECURITY_PLAN.md
3. orchestration_status: status="planning_complete"
```

### 阶段 3: 修复执行
```
1. 主代理按 tasks/ 顺序执行:
   → Phase 1: 重现/Root Cause (分析日志、添加监控)
   → Phase 2: Tests First (根据 quickstart 运行失败测试)
   → Phase 3: Fix Implementation
   → Phase 4: Regression hardening
2. 每个任务完成后:
   → 运行 quickstart 中相关测试命令
   → Git 提交 (一任务一提交)
   → 更新 tasks/TASK_*.completed
3. 可用 {SCRIPT:recover} 恢复中断的工作流
```

### 阶段 4: 验证与发布
```
1. qa-tester 生成 TEST_REPORT.md（必须全部通过）
2. security-reviewer 生成 SECURITY_REPORT.md
3. release-manager 生成 RELEASE_PLAN.md
4. {SCRIPT:validate_constitution} --type bug_fix --severity warning
5. orchestration_status: status="fix_complete"
```

## 产物结构
```
devflow/bugs/${BUG_ID}/
  ANALYSIS.md
  PLAN.md
  tasks/
  TEST_PLAN.md / SECURITY_PLAN.md
  TEST_REPORT.md / SECURITY_REPORT.md
  RELEASE_PLAN.md
  quickstart.md (引用或增量说明)
  orchestration_status.json
  LOG.md
```

## 错误处理
- 任意阶段失败 → status 标记为 `*_failed`，可使用 `/flow-fix --resume`（由 recover 脚本处理）。
- 找不到 quickstart → 提示读取主需求目录的 quickstart 或补充测试命令。
- 宪法检查失败 → 输出违规项并阻断发布。

## 下一步
1. 提交 PR：`fix(${BUG_ID}): <summary>`
2. 通知相关需求负责人回归验证。
3. 评估是否需更新研究/技术设计文档以反映修复影响。
