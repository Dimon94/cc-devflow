---
name: flow-fix
description: 'One-shot BUG fix flow with systematic debugging. Usage: /flow-fix "BUG-123|登录时报 500"'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  recover: .claude/scripts/recover-workflow.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
agent_scripts:
  sh: .claude/scripts/update-agent-context.sh __AGENT__
  ps: scripts/powershell/update-agent-context.ps1 -AgentType __AGENT__
skills:
  debugging: .claude/skills/flow-debugging/SKILL.md
  verification: .claude/skills/verification-before-completion/SKILL.md
  tdd: .claude/skills/flow-tdd/SKILL.md
---

# Flow-Fix - 系统化 BUG 修复流

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## User Input
```text
$ARGUMENTS = "BUG_ID|TITLE"
```
BUG_ID 必须满足 `BUG-\d+`；TITLE 为简洁现象描述。

## 命令格式
```text
/flow-fix "BUG-123|登录时报500"
```

---

## 核心理念

Bug 修复不是猜测游戏。系统化调试 = 更快修复 + 更少回归。

```
错误方式: 看到错误 → 猜测原因 → 尝试修复 → 失败 → 再猜...
正确方式: 看到错误 → 调查根因 → 理解问题 → 写测试 → 修复 → 验证
```

### Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "我知道问题在哪" | 证明它。先调查。 |
| "快速修复一下" | 快速修复 = 快速回归。系统化调试。 |
| "没时间写测试" | 没测试 = 不知道是否真的修好了。 |
| "这个改动很小" | 小改动也能引入大 bug。测试它。 |
| "先修复，后调查" | 不理解问题就修复 = 猜测。 |
| "试试这个" | "试试"不是调试。形成假设，验证它。 |

### Red Flags - STOP

如果你发现自己:
- 没有复现就开始修复
- 在"试试这个，试试那个"
- 3+ 次修复尝试失败
- 没写测试就说"修好了"
- 改了很多文件来修一个 bug

**STOP. 回到阶段 1. 调查根因。**

---

## 执行流程

### 阶段 0: Entry Gate
```
1. 解析 BUG_ID、TITLE
2. {SCRIPT:prereq} --json 验证:
   → devflow/bugs/${BUG_ID}/ 是否存在（首次执行将创建）
3. 初始化 devflow/bugs/${BUG_ID}/ 结构与 orchestration_status.json
4. 检查 quickstart.md
   → 若需求目录已有 quickstart.md，复制引用用于测试执行
```

### 阶段 1: Root Cause Investigation (NO FIXES YET)

**Iron Law**: 在这个阶段，**禁止写任何修复代码**。

参考 `{SKILL:debugging}` Phase 1:

```
Step 1: 完整阅读错误信息
  → 不要跳过任何细节
  → 记录: 错误类型、消息、堆栈跟踪
  → 记录: 发生时间、频率、影响范围

Step 2: 稳定复现
  → 找到可靠的复现步骤
  → 记录: 输入、环境、前置条件
  → 如果无法复现 → 收集更多信息

Step 3: 检查最近变更
  → git log --oneline -20
  → git diff HEAD~5
  → 问: 什么变了？何时开始出问题？

Step 4: 逆向追踪数据流
  → 从错误点向上追踪
  → 找到数据来源
  → 识别数据在哪里变坏
```

**输出**: ANALYSIS.md（现象、复现、根因假设、影响范围）

### 阶段 2: Pattern Analysis & Planning

参考 `{SKILL:debugging}` Phase 2:

```
1. 找到正常工作的例子
   → 类似功能哪里正常工作？
   → 对比: 正常 vs 异常

2. 与参考实现对比
   → 官方文档怎么说？
   → 其他项目怎么做？

3. 调用 planner
   → 输入 ANALYSIS.md、现有 quickstart、代码结构
   → 产出 PLAN.md、tasks/ (TDD 顺序: Root Cause → Failing Test → Fix → Regression)

4. 调用 qa-tester / security-reviewer
   → 生成 TEST_PLAN.md、SECURITY_PLAN.md
```

**输出**: PLAN.md, tasks/, TEST_PLAN.md, SECURITY_PLAN.md

### 阶段 3: 修复执行 (TDD)

参考 `{SKILL:tdd}` + `{SKILL:debugging}` Phase 3-4:

```
1. 先写失败测试用例
   → 测试必须复现 bug
   → 运行测试，确认失败
   → 这是你的"红灯"

2. 主代理按 tasks/ 顺序执行:
   → Phase 1: 重现/Root Cause (分析日志、添加监控)
   → Phase 2: Tests First (根据 quickstart 运行失败测试)
   → Phase 3: Fix Implementation (最小化改动)
   → Phase 4: Regression hardening

3. 每个任务完成后:
   → 运行 quickstart 中相关测试命令
   → Git 提交 (一任务一提交)
   → 更新 TASKS.md (checkbox 标记)

4. 3+ 次修复失败 → STOP
   → 停下来，质疑架构
   → 可能问题比想象的更深
```

### 阶段 4: 验证与发布

参考 `{SKILL:verification}`:

```
1. qa-tester 生成 TEST_REPORT.md（必须全部通过）
2. security-reviewer 生成 SECURITY_REPORT.md
3. release-manager 生成 RELEASE_PLAN.md
4. {SCRIPT:validate_constitution} --type bug_fix --severity warning
5. orchestration_status: status="fix_complete"

验证清单:
  □ 根因已记录
  □ 失败测试已写
  □ 修复已实现
  □ 测试通过
  □ 无回归
  □ 文档已更新 (如需要)
```

---

## 产物结构
```
devflow/bugs/${BUG_ID}/
  ANALYSIS.md              # 根因分析
  PLAN.md                  # 修复计划
  tasks/                   # TDD 任务
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

---

**Related Documentation**:
- [flow-debugging](.claude/skills/flow-debugging/SKILL.md) - 4 阶段调试法
- [flow-tdd](.claude/skills/flow-tdd/SKILL.md) - TDD 原则
- [verification-before-completion](.claude/skills/verification-before-completion/SKILL.md) - 验证技能

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
