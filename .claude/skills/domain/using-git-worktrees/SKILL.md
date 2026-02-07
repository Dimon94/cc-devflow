---
name: using-git-worktrees
description: 'Git Worktree management for parallel development. Enables multiple Claude Code sessions working on different requirements simultaneously.'
---

# Using Git Worktrees Skill

> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

## Purpose

支持多需求并行开发，每个 worktree 独立的 Claude 会话，互不干扰。

## When to Use

- 多需求并行开发
- 代码审查时需要隔离环境
- 紧急修复时不丢失当前工作
- 需要在不同分支间快速切换

## Core Concepts

### Worktree vs Branch

| 传统分支 | Git Worktree |
|---------|--------------|
| `git checkout` 切换 | `cd` 切换目录 |
| 需要 stash 当前工作 | 工作区完全隔离 |
| 单一 Claude 会话 | 每个 worktree 独立会话 |
| 切换耗时 ~30s | 切换耗时 ~1s |

### Directory Layout

```
~/projects/
├── cc-devflow/                    # 主仓库 (main 分支)
├── cc-devflow-REQ-001/            # REQ-001 worktree
├── cc-devflow-REQ-002/            # REQ-002 worktree
├── cc-devflow-analysis/           # 只读分析 worktree (可选)
└── cc-devflow-hotfix/             # 紧急修复 worktree (可选)
```

### Naming Convention

```
Worktree 目录: {repo-name}-{REQ_ID}
对应分支: feature/{REQ_ID}-{slug}
```

## Commands

### Create Worktree

```bash
# 创建新 worktree + 分支
bash scripts/worktree-create.sh "REQ-123" "Feature Title"

# 仅创建 worktree (分支已存在)
bash scripts/worktree-create.sh "REQ-123" --existing-branch
```

### List Worktrees

```bash
# 列出所有 worktree
bash scripts/worktree-list.sh

# JSON 格式输出
bash scripts/worktree-list.sh --json
```

### Switch Worktree

```bash
# 切换到指定 worktree
bash scripts/worktree-switch.sh "REQ-123"

# 或直接 cd
cd ../cc-devflow-REQ-123
```

### Cleanup Worktree

```bash
# 清理单个 worktree
bash scripts/worktree-cleanup.sh "REQ-123"

# 清理所有已合并的 worktree
bash scripts/worktree-cleanup.sh --merged
```

### Status Check

```bash
# 检查当前 worktree 状态
bash scripts/worktree-status.sh
```

## Shell Aliases (Recommended)

将以下内容添加到 `~/.zshrc` 或 `~/.bashrc`:

```bash
# 快速导航
alias za='cd $(git rev-parse --show-toplevel 2>/dev/null || echo .)'  # 当前 worktree 根目录
alias zl='git worktree list'                                           # 列出所有 worktree
alias zm='cd ~/projects/cc-devflow'                                    # 主仓库

# 快速切换函数
zw() {
  local req_id="${1:-}"
  if [[ -z "$req_id" ]]; then
    echo "Usage: zw REQ-123"
    return 1
  fi
  local repo_name=$(basename $(git -C ~/projects/cc-devflow rev-parse --show-toplevel 2>/dev/null))
  local target_dir=~/projects/${repo_name}-${req_id}
  if [[ -d "$target_dir" ]]; then
    cd "$target_dir"
  else
    echo "Worktree not found: $target_dir"
    return 1
  fi
}
```

## Integration with CC-DevFlow

### flow-init

默认使用 worktree 模式:

```bash
/flow-init "REQ-123|Feature Title"
# 创建: ../cc-devflow-REQ-123/
# 分支: feature/REQ-123-feature-title
```

兼容模式 (传统分支):

```bash
/flow-init "REQ-123|Feature Title" --branch-only
```

### flow-release

自动清理 worktree:

```bash
/flow-release "REQ-123"
# 1. 合并分支
# 2. 删除 worktree
# 3. 删除分支
```

### flow-restart

切换到已有 worktree:

```bash
/flow-restart "REQ-123"
# cd ../cc-devflow-REQ-123
```

## Session Management

每个 worktree 可以运行独立的 Claude Code 会话:

```bash
# 终端 1: REQ-001
cd ~/projects/cc-devflow-REQ-001
claude

# 终端 2: REQ-002
cd ~/projects/cc-devflow-REQ-002
claude

# 终端 3: 主仓库 (代码审查)
cd ~/projects/cc-devflow
claude
```

## Best Practices

### 1. 保持主仓库干净

主仓库 (`cc-devflow/`) 应始终在 `main` 分支，用于:
- 创建新 worktree
- 代码审查
- 合并操作

### 2. 定期清理

```bash
# 清理已合并的 worktree
bash scripts/worktree-cleanup.sh --merged
```

### 3. 命名一致性

- Worktree 目录: `{repo}-{REQ_ID}`
- 分支名: `feature/{REQ_ID}-{slug}`

### 4. 紧急修复流程

```bash
# 1. 在主仓库创建 hotfix worktree
cd ~/projects/cc-devflow
git worktree add ../cc-devflow-hotfix -b hotfix/critical-fix

# 2. 修复并合并
cd ../cc-devflow-hotfix
# ... 修复代码 ...
git push origin hotfix/critical-fix

# 3. 清理
cd ~/projects/cc-devflow
git worktree remove ../cc-devflow-hotfix
git branch -d hotfix/critical-fix
```

## Error Handling

| 错误 | 解决方案 |
|------|----------|
| Worktree 目录已存在 | 使用 `--force` 或手动删除 |
| 分支已被其他 worktree 使用 | 先删除旧 worktree |
| 主仓库不在 main 分支 | `git checkout main` |
| 磁盘空间不足 | 清理已合并的 worktree |

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/worktree-create.sh` | 创建 worktree |
| `scripts/worktree-list.sh` | 列出 worktree |
| `scripts/worktree-switch.sh` | 切换 worktree |
| `scripts/worktree-cleanup.sh` | 清理 worktree |
| `scripts/worktree-status.sh` | 状态检查 |

## Assets Reference

| Asset | Purpose |
|-------|---------|
| `assets/SHELL_ALIASES.md` | Shell 别名模板 |

---

**Related Skills**:
- `flow-init` - 需求初始化 (worktree 创建)
- `flow-release` - 发布管理 (worktree 清理)
- `finishing-branch` - 分支完成决策
