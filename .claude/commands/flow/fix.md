---
name: flow-fix
description: 'Systematic BUG fix flow. Usage: /flow-fix "BUG-123|登录时报 500"'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  recover: .claude/scripts/recover-workflow.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
agent_scripts:
  sh: .claude/scripts/update-agent-context.sh __AGENT__
  ps: scripts/powershell/update-agent-context.ps1 -AgentType __AGENT__
skills:
  debugging: .claude/skills/debugging/SKILL.md
  verification: .claude/skills/verification/SKILL.md
  tdd: .claude/skills/tdd/SKILL.md
---

# Flow-Fix - 系统化 BUG 修复流

## Iron Law

```text
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## 定位

`/flow-fix` 是 bug 场景下的调试入口，目标是以最短路径完成“根因 -> 修复 -> 验证”闭环。

主原则：

- 先分析根因，再修
- 先写失败测试，再修
- 完成标准看验证证据，不看口头声明

## User Input

```text
$ARGUMENTS = "BUG_ID|TITLE"
```

## 执行流程

### 1. Entry Gate

1. 校验 `BUG_ID`
2. 初始化或读取 `devflow/bugs/<BUG_ID>/`
3. 若 bug 与某个 `REQ` 直接相关，记录关联 requirement

### 2. Investigation

1. 复现问题
2. 收集错误信息、触发条件、影响范围
3. 产出 `ANALYSIS.md`

### 3. Plan

1. 形成最小修复计划
2. 明确测试策略和回归面
3. 产出 `PLAN.md` 与必要的 `TASKS.md`

### 4. Execute

1. 先写失败测试
2. 做最小修复
3. 每轮都保留验证证据

### 5. Verify

1. 运行相关测试
2. 必要时运行 `codex review` / 严格验证
3. 通过后再声明修复完成

## 输出

```text
devflow/bugs/<BUG_ID>/
├── ANALYSIS.md
├── PLAN.md
├── TASKS.md                # 如需要
├── TEST_REPORT.md          # 如生成
└── LOG.md
```

## 下一步

- bug 修复仍未收敛：继续 `/flow-fix --resume` 或回到调查阶段
- 若影响主需求主线：回写对应 `REQ` 的 `decision-log` 或 `resume-index`
