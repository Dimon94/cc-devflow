---
name: flow-release
description: 'Create PR and manage release. Usage: /flow-release "REQ-123" or /flow-release'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  check_tasks: .claude/scripts/check-task-status.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
  generate_status: .claude/scripts/generate-status-report.sh
  verify_gate: .claude/scripts/verify-gate.sh
skills:
  finishing: .claude/skills/flow-finishing-branch/SKILL.md
  verification: .claude/skills/verification-before-completion/SKILL.md
---

# Flow-Release - 发布管理命令

## 分支完成决策 (新增)

参考 `{SKILL:finishing}` 原则，发布前需要决定分支处理方式：

```yaml
决策选项:
  A) Fast-forward merge
     → 适用: 小改动，单人开发，无需审查记录
     → 命令: git checkout main && git merge --ff-only feature/xxx

  B) Create PR (推荐)
     → 适用: 需要记录，团队审查，CI 验证
     → 命令: gh pr create

  C) Squash and merge
     → 适用: 多个提交需合并为一个
     → 命令: gh pr merge --squash

  D) Cleanup only
     → 适用: 工作被废弃，只需清理分支
     → 命令: git checkout main && git branch -D feature/xxx

决策依据:
  - 改动大小 (>10 files → PR)
  - 是否需要审查 (团队项目 → PR)
  - 提交历史是否清晰 (混乱 → Squash)
  - 是否需要 CI 验证 (生产代码 → PR)
```

## User Input
```text
$ARGUMENTS = "REQ_ID?"
```
未提供则根据当前分支或 `DEVFLOW_REQ_ID` 自动解析。

## 执行流程

### 阶段 1: Entry Gate
```
1. 解析 REQ_ID
2. {SCRIPT:prereq} --json 校验:
   → 存在 PRD.md、TECH_DESIGN.md、data-model.md、contracts/、quickstart.md、EPIC.md、TASKS.md、TEST_REPORT.md、SECURITY_REPORT.md
   → orchestration_status.status ∈ {"qa_complete", "release_failed"}
3. {SCRIPT:check_tasks} --json 确认 remaining == 0
4. 验证 QA gate:
   → TEST_REPORT.md / SECURITY_REPORT.md 中的 Gate 均为 PASS
5. Git 环境:
   → 工作区干净、当前在 feature/bugfix 分支
   → 分支已推送，若无 upstream 提示 push
```

### 阶段 2: 发布上下文准备
```
1. 收集元数据:
   → TITLE, branch, commits, changed files, coverage, security 状态
2. 汇总文档:
   → PRD 成功指标、EPIC 范围、TASKS DoD、quickstart 验证命令
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
      • 范围概览、风险评估、回滚策略、监控计划、依赖项
      • 列出 data-model / contracts / quickstart 的变更摘要
  - 生成 PR 描述草稿:
      • 摘要、实现亮点、测试结果（引用 quickstart 命令）、安全结论、验证报告链接
  - 建议标签、检查清单
```

### 阶段 4: PR 创建与完结
```
1. 使用 gh CLI 创建或更新 PR
   → 标题: "${REQ_ID}: ${TITLE}"
   → 正文采用 agent 输出
2. 检查 CLAUDE.md：
   → 若 TECH_DESIGN 引入新基础设施/重大变更，更新 "## Technical Architecture"（≤15 行）
3. 状态更新:
   → orchestration_status.status = "release_complete"
   → completedSteps append "release"
   → prUrl 记录到状态文件
4. EXECUTION_LOG 记录 PR 链接与发布时间
5. 可选: {SCRIPT:generate_status} 生成状态报告
```

## 输出
```
✅ RELEASE_PLAN.md
✅ CLAUDE.md（如需更新）
✅ GitHub PR (gh)
✅ orchestration_status.json 更新 (release_complete)
✅ EXECUTION_LOG.md 发布记录
```

## 错误处理
- QA Gate 失败或 Constitution ERROR → 立即终止，标记 status="release_failed"。
- Git push/PR 创建失败 → 输出命令和日志，保持可重试状态。
- CLAUDE.md 更新遗漏 → 阻断发布并提示补写。

## 下一步
1. 等待代码评审与 CI 通过。
2. 合并后更新主分支标签或发布记录。
3. 反馈验证结果，必要时触发 `/flow-verify` 复检。
