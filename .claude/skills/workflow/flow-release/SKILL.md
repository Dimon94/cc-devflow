---
name: flow-release
description: 'Create PR and manage release. Usage: /flow-release "REQ-123" or /flow-release'
---

# Flow-Release Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

创建 PR 并管理发布流程。

## Input Format

```
/flow-release "REQ_ID"
/flow-release             # Auto-detect
```

## Branch Completion Decision

参考 `flow-finishing-branch` Skill:

| 选项 | 适用场景 | 命令 |
|-----|---------|------|
| A) Fast-forward | 小改动，单人开发 | `git merge --ff-only` |
| B) Create PR | 需要记录，团队审查 | `gh pr create` |
| C) Squash merge | 多提交合并为一 | `gh pr merge --squash` |
| D) Cleanup only | 工作被废弃 | `git branch -D` |

## Entry Gate

1. **PRD.md, TECH_DESIGN.md, EPIC.md, TASKS.md** 存在
2. **TEST_REPORT.md, SECURITY_REPORT.md** Gate 均为 PASS
3. **Status**: `qa_complete` 或 `release_failed`
4. **Git**: 工作区干净，在 feature/bugfix 分支

## Execution Flow

### Stage 1: Context Preparation

收集元数据:
- TITLE, branch, commits, changed files
- coverage, security 状态

### Stage 2: Release Manager Agent

调用 `release-manager` agent:
- 生成 RELEASE_PLAN.md
- 生成 PR 描述草稿

### Stage 3: PR Creation

使用 `gh` CLI:
- 标题: `${REQ_ID}: ${TITLE}`
- 正文: agent 输出

### Stage 4: Exit Gate

1. RELEASE_PLAN.md 存在
2. PR 创建成功
3. Status: `release_complete`

## Output

```
devflow/requirements/${REQ_ID}/
├── RELEASE_PLAN.md
└── orchestration_status.json (release_complete)

GitHub:
└── PR created with link
```

## Next Step

1. 等待代码评审与 CI 通过
2. 合并后更新主分支标签
3. 可选: `/flow-verify` 复检
