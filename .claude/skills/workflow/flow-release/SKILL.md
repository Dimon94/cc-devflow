---
name: flow-release
description: 'Complete requirement and update progress. Usage: /flow-release "REQ-123" or /flow-release'
---

# Flow-Release Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

完成需求发布：更新进度文档、提交变更。Git 分支/PR/合并由用户自行管理。

## Input Format

```
/flow-release "REQ_ID"
/flow-release             # Auto-detect
```

## Entry Gate

1. **PRD.md, EPIC.md, TASKS.md** 存在
2. **TEST_REPORT.md, SECURITY_REPORT.md** Gate 均为 PASS
3. **Status**: `quality_complete`（兼容 `qa_complete`）或 `release_failed`

## Execution Flow

### Stage 1: Context Preparation

收集元数据:
- REQ_ID, TITLE
- coverage, security 状态
- TASKS.md 完成情况

### Stage 2: Release Manager Agent

调用 `release-manager` agent:
- 生成 RELEASE_PLAN.md (发布摘要)

### Stage 3: Progress Update

1. **更新 BACKLOG.md**
   - 找到对应 REQ 条目，更新状态为 `completed` 或 `released`

2. **更新 ROADMAP.md**
   - 找到对应 REQ 条目，更新进度

3. **更新 orchestration_status.json**
   - Status → `release_complete`

### Stage 4: Commit Gate (MANDATORY)

- 检查 `git status --porcelain`
- 若存在未提交变更，按 `.claude/commands/util/git-commit.md` 规范提交
- 提交格式: `chore(release): complete ${REQ_ID} - ${TITLE}`

### Stage 5: Exit Gate

1. RELEASE_PLAN.md 存在
2. Status: `release_complete`
3. 变更已提交

## Output

```
devflow/requirements/${REQ_ID}/
├── RELEASE_PLAN.md
└── orchestration_status.json (release_complete)

Updated:
├── devflow/BACKLOG.md (REQ status updated)
└── devflow/ROADMAP.md (REQ progress updated)

Git:
└── Changes committed (user handles branch/PR/merge externally)
```

## Next Step

1. 用户自行处理分支合并 / PR 创建
2. 可选: `/flow-verify` 复检
