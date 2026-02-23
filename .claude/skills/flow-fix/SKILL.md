---
name: flow-fix
description: 'One-shot BUG fix flow with systematic debugging. Usage: /flow-fix "BUG-123|登录时报 500"'
---

# Flow-Fix Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

系统化 BUG 修复流程，遵循 4 阶段调试法。

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## Input Format

```
/flow-fix "BUG_ID|TITLE"
```

示例: `/flow-fix "BUG-123|登录时报500"`

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "我知道问题在哪" | 证明它。先调查。 |
| "快速修复一下" | 快速修复 = 快速回归。系统化调试。 |
| "没时间写测试" | 没测试 = 不知道是否真的修好了。 |
| "这个改动很小" | 小改动也能引入大 bug。测试它。 |

## Execution Flow

### Stage 0: Entry Gate

1. 解析 BUG_ID、TITLE
2. 创建 `devflow/bugs/${BUG_ID}/` 目录
3. 创建分支: `bugfix/${BUG_ID}-${slug}`

### Stage 1: Root Cause Investigation

**Iron Law**: 禁止写任何修复代码

1. 完整阅读错误信息
2. 稳定复现
3. 检查最近变更
4. 逆向追踪数据流

输出: ANALYSIS.md

### Stage 2: Pattern Analysis & Planning

1. 找到正常工作的例子
2. 与参考实现对比
3. 调用 planner 生成 PLAN.md

输出: PLAN.md, tasks/, TEST_PLAN.md

### Stage 3: Fix Execution (TDD)

1. 先写失败测试用例
2. 按 tasks/ 顺序执行
3. 每任务完成后 Git 提交
4. 3+ 次失败 → STOP，质疑架构

### Stage 4: Verification

1. TEST_REPORT.md (必须全部通过)
2. SECURITY_REPORT.md
3. RELEASE_PLAN.md
4. Status: `fix_complete`

## Output

```
devflow/bugs/${BUG_ID}/
├── ANALYSIS.md
├── PLAN.md
├── tasks/
├── TEST_PLAN.md
├── TEST_REPORT.md
├── SECURITY_REPORT.md
├── RELEASE_PLAN.md
└── orchestration_status.json
```

## Red Flags - STOP

如果你发现自己:
- 没有复现就开始修复
- 在"试试这个，试试那个"
- 3+ 次修复尝试失败
- 没写测试就说"修好了"

**STOP. 回到阶段 1. 调查根因。**

## Next Step

1. 提交 PR: `fix(${BUG_ID}): <summary>`
2. 通知相关需求负责人回归验证
