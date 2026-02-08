---
name: flow-release
description: 'Complete requirement and update progress. Usage: /flow-release "REQ-123" or /flow-release'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  check_tasks: .claude/scripts/check-task-status.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
  generate_status: .claude/scripts/generate-status-report.sh
  verify_gate: .claude/scripts/verify-gate.sh
skills:
  verification: .claude/skills/verification-before-completion/SKILL.md
---

# Flow-Release - 发布管理命令

> Git 分支/PR/合并由用户自行管理，DevFlow 仅负责进度更新和提交。

## User Input
```text
$ARGUMENTS = "REQ_ID?"
```
未提供则根据 `DEVFLOW_REQ_ID` 或 `.current-req` 自动解析。

## 执行流程

### 阶段 1: Entry Gate
```
1. 解析 REQ_ID
2. {SCRIPT:prereq} --json 校验:
   → 存在 PRD.md、EPIC.md、TASKS.md、TEST_REPORT.md、SECURITY_REPORT.md
   → orchestration_status.status ∈ {"quality_complete", "qa_complete", "release_failed"}
3. {SCRIPT:check_tasks} --json 确认 remaining == 0
4. 验证 Quality gate:
   → TEST_REPORT.md / SECURITY_REPORT.md 中的 Gate 均为 PASS
5. Commit 规范门禁（工作区不干净时）:
   → 必须先执行 `/util/git-commit`（规则见 `.claude/commands/util/git-commit.md`）
   → Commit message 必须遵循 Conventional Commits；多文件按同类变更拆分提交
   → 提交完成后重新执行 Entry Gate，直到工作区干净
```

### 阶段 2: 发布上下文准备
```
1. 收集元数据:
   → REQ_ID, TITLE, commits, changed files, coverage, security 状态
2. 汇总文档:
   → PRD 成功指标、EPIC 范围、TASKS DoD
3. 更新 orchestration_status:
   → status = "release_in_progress"
   → phase = "release"
4. EXECUTION_LOG.md 记录发布启动
```

### 阶段 3: release-manager Agent
```
Prompt 核心要求:
  - 确认 Constitution 校验无 ERROR:
      {SCRIPT:validate_constitution} --type all --severity error
  - 生成 RELEASE_PLAN.md:
      • 范围概览、风险评估、回滚策略、监控计划
  - 建议标签、检查清单
```

### 阶段 4: Progress Update
```
1. 更新 BACKLOG.md:
   → 找到对应 REQ 条目，更新状态为 completed/released
2. 更新 ROADMAP.md:
   → 找到对应 REQ 条目，更新进度
3. 更新 orchestration_status:
   → status = "release_complete"
   → completedSteps append "release"
4. EXECUTION_LOG.md 记录发布完成
```

### 阶段 5: Commit Gate
```
1. 若 `git status --porcelain` 非空:
   → 按 `/util/git-commit` 规范提交
   → 格式: chore(release): complete ${REQ_ID} - ${TITLE}
2. 可选: {SCRIPT:generate_status} 生成状态报告
```

## 输出
```
✅ RELEASE_PLAN.md
✅ BACKLOG.md (进度更新)
✅ ROADMAP.md (进度更新)
✅ orchestration_status.json 更新 (release_complete)
✅ EXECUTION_LOG.md 发布记录
✅ Changes committed (用户自行处理分支/PR/合并)
```

## 错误处理
- Quality Gate 失败或 Constitution ERROR → 立即终止，标记 status="release_failed"。
- 工作区存在未提交改动且未按 `/util/git-commit` 规则处理 → 阻断发布。

## 下一步
1. 用户自行处理分支合并 / PR 创建。
2. 反馈验证结果，必要时触发 `/flow-verify` 复检。
