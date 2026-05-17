#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-dev: 为 REQ/FIX 准备独立工作树，主目录不切分支
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: prepare-change-worktree.sh --change-key REQ-123-short-name [--base main] [--worktrees-root path]
EOF
}

CHANGE_KEY=""
BASE_BRANCH=""
WORKTREES_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --change-key) CHANGE_KEY="$2"; shift 2 ;;
    --base) BASE_BRANCH="$2"; shift 2 ;;
    --worktrees-root) WORKTREES_ROOT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$CHANGE_KEY" ]]; then
  usage
  exit 1
fi

inside_work_tree="$(git rev-parse --is-inside-work-tree 2>/dev/null || true)"
if [[ "$inside_work_tree" != "true" ]]; then
  echo "WorktreePrepareError: not inside a git work tree" >&2
  exit 1
fi

if [[ ! "$CHANGE_KEY" =~ ^(REQ|FIX)-[0-9]+-.+ ]]; then
  echo "WorktreePrepareError: change key must be canonical REQ-... or FIX-...: $CHANGE_KEY" >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
repo_name="$(basename "$repo_root")"

if [[ -z "$WORKTREES_ROOT" ]]; then
  if [[ -n "${CODEX_HOME:-}" ]]; then
    WORKTREES_ROOT="$CODEX_HOME/worktrees"
  else
    WORKTREES_ROOT="$HOME/.codex/worktrees"
  fi
fi

worktree_path="$WORKTREES_ROOT/$CHANGE_KEY/$repo_name"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ensure_script="$script_dir/ensure-work-branch.sh"

if [[ ! -x "$ensure_script" ]]; then
  echo "WorktreePrepareError: missing executable anchor script: $ensure_script" >&2
  exit 1
fi

if [[ -e "$worktree_path" ]]; then
  if [[ "$(git -C "$worktree_path" rev-parse --is-inside-work-tree 2>/dev/null || true)" != "true" ]]; then
    echo "WorktreePrepareError: target path exists but is not a git worktree: $worktree_path" >&2
    exit 1
  fi
  action="reused"
else
  mkdir -p "$(dirname "$worktree_path")"
  git worktree add --detach "$worktree_path" HEAD >/dev/null
  action="created"
fi

ensure_args=(--change-key "$CHANGE_KEY")
if [[ -n "$BASE_BRANCH" ]]; then
  ensure_args+=(--base "$BASE_BRANCH")
fi

anchor_output="$(cd "$worktree_path" && bash "$ensure_script" "${ensure_args[@]}")"

cat <<EOF
WORKTREE_ACTION=$action
WORKTREE_PATH=$worktree_path
$anchor_output
EOF
