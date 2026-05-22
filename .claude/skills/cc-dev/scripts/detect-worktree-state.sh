#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-dev: 只检测 Git 工作树状态，不创建、不切换、不锚定分支
# ------------------------------------------------------------

field() {
  local key="$1"
  local value="${2:-}"
  printf '%s=%s\n' "$key" "$value"
}

physical_path() {
  local path_value="$1"

  if [[ -n "$path_value" && -e "$path_value" ]]; then
    (cd "$path_value" && pwd -P)
  else
    printf '%s\n' "$path_value"
  fi
}

current_branch_state() {
  local current_branch="$1"

  if [[ -n "$current_branch" ]]; then
    printf 'branch\n'
  elif git rev-parse --verify HEAD >/dev/null 2>&1; then
    printf 'detached\n'
  else
    printf 'unborn\n'
  fi
}

read_primary_worktree_state() {
  local primary_path=""
  local primary_branch=""
  local in_primary=""

  while IFS= read -r line; do
    case "$line" in
      worktree\ *)
        if [[ -z "$primary_path" ]]; then
          primary_path="${line#worktree }"
          in_primary="1"
        else
          break
        fi
        ;;
      branch\ refs/heads/*)
        if [[ -n "$in_primary" ]]; then
          primary_branch="${line#branch refs/heads/}"
        fi
        ;;
    esac
  done < <(git worktree list --porcelain 2>/dev/null || true)

  printf '%s\t%s\n' "$primary_path" "$primary_branch"
}

if [[ "$(git rev-parse --is-inside-work-tree 2>/dev/null || true)" != "true" ]]; then
  field INSIDE_WORK_TREE false
  field WORKTREE_KIND none
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel)"
git_dir="$(cd "$(git rev-parse --git-dir)" && pwd -P)"
git_common_dir="$(cd "$(git rev-parse --git-common-dir)" && pwd -P)"
current_branch="$(git branch --show-current 2>/dev/null || true)"
superproject="$(git rev-parse --show-superproject-working-tree 2>/dev/null || true)"
state="$(read_primary_worktree_state)"
primary_path="${state%%$'\t'*}"
primary_branch="${state#*$'\t'}"
repo_root_real="$(physical_path "$repo_root")"
primary_path_real="$(physical_path "$primary_path")"
is_primary="no"
kind="primary"

if [[ -n "$superproject" ]]; then
  kind="submodule"
elif [[ "$repo_root_real" != "$primary_path_real" ]]; then
  kind="linked"
fi

if [[ "$kind" == "primary" ]]; then
  is_primary="yes"
fi

field INSIDE_WORK_TREE true
field WORKTREE_KIND "$kind"
field IS_PRIMARY_CHECKOUT "$is_primary"
field IS_SUBMODULE "$([[ -n "$superproject" ]] && printf yes || printf no)"
field WORKTREE_PATH "$repo_root"
field PRIMARY_WORKTREE_PATH "$primary_path"
field CURRENT_BRANCH "$current_branch"
field BRANCH_STATE "$(current_branch_state "$current_branch")"
field PRIMARY_BRANCH "$primary_branch"
field GIT_DIR "$git_dir"
field GIT_COMMON_DIR "$git_common_dir"
field SUPERPROJECT_WORKTREE "$superproject"
