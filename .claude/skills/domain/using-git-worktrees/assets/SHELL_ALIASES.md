# Git Worktree Shell Aliases

> 将以下内容添加到 `~/.zshrc` 或 `~/.bashrc`

## Quick Navigation

```bash
# =============================================================================
# Git Worktree Aliases for CC-DevFlow
# =============================================================================

# 快速导航到当前 worktree 根目录
alias za='cd $(git rev-parse --show-toplevel 2>/dev/null || echo .)'

# 列出所有 worktree
alias zl='git worktree list'

# 导航到主仓库 (修改为你的实际路径)
alias zm='cd ~/projects/cc-devflow'

# 快速切换到指定 REQ 的 worktree
zw() {
  local req_id="${1:-}"
  if [[ -z "$req_id" ]]; then
    echo "Usage: zw REQ-123"
    echo ""
    echo "Available worktrees:"
    git worktree list
    return 1
  fi

  # Normalize to uppercase
  req_id=$(echo "$req_id" | tr '[:lower:]' '[:upper:]')

  # Get repo name from current git repo or main repo
  local main_repo
  if git rev-parse --show-toplevel >/dev/null 2>&1; then
    main_repo=$(git rev-parse --show-toplevel)
    # If in worktree, find main repo
    local git_dir=$(git rev-parse --git-dir)
    if [[ "$git_dir" == *".git/worktrees/"* ]]; then
      main_repo=$(cat "$(git rev-parse --show-toplevel)/.git" 2>/dev/null | sed 's/gitdir: //' | sed 's|/.git/worktrees/.*||')
    fi
  else
    main_repo=~/projects/cc-devflow
  fi

  local repo_name=$(basename "$main_repo")
  local target_dir="$(dirname "$main_repo")/${repo_name}-${req_id}"

  if [[ -d "$target_dir" ]]; then
    cd "$target_dir"
    echo "Switched to: $target_dir"
    echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
  else
    echo "Worktree not found: $target_dir"
    echo ""
    echo "Available worktrees:"
    git worktree list
    return 1
  fi
}

# 创建新 worktree (快捷方式)
zwn() {
  local req_id="${1:-}"
  local title="${2:-}"

  if [[ -z "$req_id" ]]; then
    echo "Usage: zwn REQ-123 [title]"
    return 1
  fi

  # Find the skill script
  local script_path
  if [[ -f ".claude/skills/domain/using-git-worktrees/scripts/worktree-create.sh" ]]; then
    script_path=".claude/skills/domain/using-git-worktrees/scripts/worktree-create.sh"
  elif [[ -f "$(git rev-parse --show-toplevel 2>/dev/null)/.claude/skills/domain/using-git-worktrees/scripts/worktree-create.sh" ]]; then
    script_path="$(git rev-parse --show-toplevel)/.claude/skills/domain/using-git-worktrees/scripts/worktree-create.sh"
  else
    echo "ERROR: worktree-create.sh not found"
    return 1
  fi

  bash "$script_path" "$req_id" "$title"
}

# 清理已合并的 worktree
zwc() {
  local script_path
  if [[ -f ".claude/skills/domain/using-git-worktrees/scripts/worktree-cleanup.sh" ]]; then
    script_path=".claude/skills/domain/using-git-worktrees/scripts/worktree-cleanup.sh"
  elif [[ -f "$(git rev-parse --show-toplevel 2>/dev/null)/.claude/skills/domain/using-git-worktrees/scripts/worktree-cleanup.sh" ]]; then
    script_path="$(git rev-parse --show-toplevel)/.claude/skills/domain/using-git-worktrees/scripts/worktree-cleanup.sh"
  else
    echo "ERROR: worktree-cleanup.sh not found"
    return 1
  fi

  bash "$script_path" --merged "$@"
}
```

## Usage Examples

```bash
# 列出所有 worktree
zl

# 切换到 REQ-123 的 worktree
zw REQ-123

# 创建新 worktree
zwn REQ-456 "New Feature"

# 清理已合并的 worktree
zwc

# 导航到主仓库
zm

# 导航到当前 worktree 根目录
za
```

## Customization

根据你的项目路径修改 `zm` 别名:

```bash
# 如果主仓库在不同位置
alias zm='cd /path/to/your/main/repo'
```
