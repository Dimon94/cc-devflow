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

physical_path() {
  local path_value="$1"

  if [[ -e "$path_value" ]]; then
    (cd "$path_value" && pwd -P)
  else
    printf '%s\n' "$path_value"
  fi
}

resolve_base_branch() {
  local base_branch="$1"

  if [[ -z "$base_branch" ]]; then
    base_branch="$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || true)"
  fi
  if [[ -z "$base_branch" ]] && git rev-parse --verify origin/main >/dev/null 2>&1; then
    base_branch="main"
  fi
  if [[ -z "$base_branch" ]] && git rev-parse --verify refs/heads/main >/dev/null 2>&1; then
    base_branch="main"
  fi
  if [[ -z "$base_branch" ]] && git rev-parse --verify origin/master >/dev/null 2>&1; then
    base_branch="master"
  fi
  if [[ -z "$base_branch" ]] && git rev-parse --verify refs/heads/master >/dev/null 2>&1; then
    base_branch="master"
  fi
  if [[ -z "$base_branch" ]]; then
    base_branch="main"
  fi

  printf '%s\n' "$base_branch"
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

assert_primary_checkout_on_base() {
  local base_branch="$1"
  local state
  local primary_path
  local primary_branch

  state="$(read_primary_worktree_state)"
  primary_path="${state%%$'\t'*}"
  primary_branch="${state#*$'\t'}"

  if [[ -z "$primary_path" ]]; then
    echo "WorktreePrepareError: cannot identify primary git worktree" >&2
    exit 1
  fi

  if [[ "$primary_branch" != "$base_branch" ]]; then
    echo "WorktreePrepareError: primary checkout must remain on $base_branch" >&2
    echo "Primary checkout: $primary_path" >&2
    echo "Current primary branch: ${primary_branch:-DETACHED}" >&2
    exit 1
  fi
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

prefix="${CHANGE_KEY%%-*}"
suffix="${CHANGE_KEY#*-}"
target_branch="$prefix/$suffix"
target_lower="$(printf '%s' "$target_branch" | tr '[:upper:]' '[:lower:]')"

repo_root="$(git rev-parse --show-toplevel)"
repo_name="$(basename "$repo_root")"
BASE_BRANCH="$(resolve_base_branch "$BASE_BRANCH")"

assert_primary_checkout_on_base "$BASE_BRANCH"

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

while IFS= read -r ref_name; do
  ref_lower="$(printf '%s' "$ref_name" | tr '[:upper:]' '[:lower:]')"
  if [[ "$ref_name" != "$target_branch" && "$ref_lower" == "$target_lower" ]]; then
    echo "WorktreePrepareError: case-variant branch already exists: $ref_name" >&2
    echo "Expected exact branch: $target_branch" >&2
    exit 1
  fi
done < <(git for-each-ref --format='%(refname:short)' refs/heads 2>/dev/null || true)

branch_worktree_path=""
current_worktree_path=""
while IFS= read -r line; do
  case "$line" in
    worktree\ *) current_worktree_path="${line#worktree }" ;;
    branch\ refs/heads/"$target_branch")
      branch_worktree_path="$current_worktree_path"
      break
      ;;
  esac
done < <(git worktree list --porcelain 2>/dev/null || true)

if [[ -n "$branch_worktree_path" ]]; then
  branch_worktree_real="$(physical_path "$branch_worktree_path")"
  expected_worktree_real="$(physical_path "$worktree_path")"
fi

if [[ -n "$branch_worktree_path" && "$branch_worktree_real" != "$expected_worktree_real" ]]; then
  echo "WorktreePrepareError: branch $target_branch is already used by worktree: $branch_worktree_path" >&2
  echo "Expected worktree path: $worktree_path" >&2
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
ensure_args+=(--base "$BASE_BRANCH")

anchor_output="$(cd "$worktree_path" && bash "$ensure_script" "${ensure_args[@]}")"

assert_primary_checkout_on_base "$BASE_BRANCH"

cat <<EOF
WORKTREE_ACTION=$action
WORKTREE_PATH=$worktree_path
$anchor_output
EOF
