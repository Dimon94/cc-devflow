---
name: flow-release
description: 'Create PR and manage release. Usage: /flow-release "REQ-123" or /flow-release'
---

# Flow-Release Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

创建 PR 并管理发布流程，包括 worktree 清理。

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

## Merge Semantics

- A) Fast-forward: 直接合并到 `main`
- B) Create PR: 仅创建/更新 PR，不自动合并
- C) Squash merge: 通过 PR squash 合并到 `main`
- D) Cleanup only: 不合并，仅清理

## Entry Gate

1. **PRD.md, TECH_DESIGN.md, EPIC.md, TASKS.md** 存在
2. **TEST_REPORT.md, SECURITY_REPORT.md** Gate 均为 PASS
3. **Status**: `quality_complete`（兼容 `qa_complete`）或 `release_failed`
4. **Git**: 当前在 feature/bugfix 分支；若工作区不干净，必须先按 `.claude/commands/util/git-commit.md` 完成提交（Conventional Commits + 按同类变更拆分）再继续

## Execution Flow

### Stage 1: Context Preparation

收集元数据:
- TITLE, branch, commits, changed files
- coverage, security 状态
- **Worktree 检测**: 判断是否在 worktree 中

### Stage 2: Release Manager Agent

调用 `release-manager` agent:
- 生成 RELEASE_PLAN.md
- 生成 PR 描述草稿

### Stage 3: Commit Gate (MANDATORY)

- 检查 `git status --porcelain`
- 若存在未提交变更，必须先执行 `/util/git-commit`（规则文件 `.claude/commands/util/git-commit.md`）
- 提交完成后再次确认工作区干净，再进入 PR 创建

### Stage 4: PR Creation

使用 `gh` CLI:
- 标题: `${REQ_ID}: ${TITLE}`
- 正文: agent 输出

### Stage 5: Worktree/Branch Cleanup

**Worktree 模式**:
```bash
# 获取当前 worktree 信息
CURRENT_WORKTREE=$(git rev-parse --show-toplevel)
MAIN_REPO=$(get_main_repo_path)
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

# 切换到主仓库
cd "$MAIN_REPO"

# 合并 (PR 或 fast-forward)
# ...

# 删除 worktree
git worktree remove "$CURRENT_WORKTREE"

# 删除分支
git branch -d "$BRANCH_NAME"
```

**分支模式**:
```bash
# 切换到 main
git checkout main

# 合并
git merge --ff-only "$BRANCH_NAME"

# 删除分支
git branch -d "$BRANCH_NAME"
```

### Stage 6: Exit Gate

1. RELEASE_PLAN.md 存在
2. PR 创建成功
3. Status: `release_complete`
4. Worktree 已清理 (如适用)

## Output

```
devflow/requirements/${REQ_ID}/
├── RELEASE_PLAN.md
└── orchestration_status.json (release_complete)

GitHub:
└── PR created with link

Cleanup:
└── Worktree removed (if applicable)
```

## Worktree Cleanup Notes

- 清理前确保所有更改已提交并推送
- 如果 PR 未合并，worktree 保留
- 使用 `--keep-worktree` 标志可跳过清理
- 清理失败不阻塞发布流程

## Next Step

1. 等待代码评审与 CI 通过
2. 合并后更新主分支标签
3. 可选: `/flow-verify` 复检
