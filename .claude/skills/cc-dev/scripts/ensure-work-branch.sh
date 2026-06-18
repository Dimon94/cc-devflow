#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-dev: 锚定 REQ/FIX 工作分支，拒绝大小写混乱 ref
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: ensure-work-branch.sh --change-key REQ-123-short-name [--base main]
EOF
}

CHANGE_KEY=""
BASE_BRANCH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --change-key) CHANGE_KEY="$2"; shift 2 ;;
    --base) BASE_BRANCH="$2"; shift 2 ;;
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
  echo "WorkBranchError: not inside a git work tree" >&2
  exit 1
fi

if [[ ! "$CHANGE_KEY" =~ ^(REQ|FIX)-[0-9]+-.+ ]]; then
  echo "WorkBranchError: change key must be canonical REQ-... or FIX-...: $CHANGE_KEY" >&2
  exit 1
fi

prefix="${CHANGE_KEY%%-*}"
suffix="${CHANGE_KEY#*-}"
target_branch="$prefix/$suffix"
target_lower="$(printf '%s' "$target_branch" | tr '[:upper:]' '[:lower:]')"

if [[ -z "$BASE_BRANCH" ]]; then
  BASE_BRANCH="$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || true)"
fi
if [[ -z "$BASE_BRANCH" ]] && git rev-parse --verify origin/main >/dev/null 2>&1; then
  BASE_BRANCH="main"
fi
if [[ -z "$BASE_BRANCH" ]] && git rev-parse --verify origin/master >/dev/null 2>&1; then
  BASE_BRANCH="master"
fi
if [[ -z "$BASE_BRANCH" ]]; then
  BASE_BRANCH="main"
fi

current_branch="$(git branch --show-current 2>/dev/null || true)"
current_lower="$(printf '%s' "$current_branch" | tr '[:upper:]' '[:lower:]')"
head_sha="$(git rev-parse --verify HEAD 2>/dev/null || true)"
head_short="$(git rev-parse --verify --short HEAD 2>/dev/null || true)"

if [[ -z "$head_sha" ]]; then
  echo "WorkBranchError: HEAD is unborn; switch to an existing exact-case branch or create from a real base first." >&2
  exit 1
fi

resolved_branch=""
resolved_sha=""
case_collision=""

while IFS=$'\t' read -r ref_name ref_sha; do
  ref_lower="$(printf '%s' "$ref_name" | tr '[:upper:]' '[:lower:]')"
  if [[ "$ref_lower" != "$target_lower" ]]; then
    continue
  fi

  if [[ -z "$resolved_branch" || "$ref_name" == "$target_branch" ]]; then
    resolved_branch="$ref_name"
  fi

  if [[ -z "$resolved_sha" ]]; then
    resolved_sha="$ref_sha"
  elif [[ "$ref_sha" != "$resolved_sha" ]]; then
    case_collision="$ref_name"
    break
  fi
done < <(git for-each-ref --format='%(refname:short)%09%(objectname)' refs/heads 2>/dev/null || true)

if [[ -n "$case_collision" ]]; then
  echo "WorkBranchError: case-variant branch already exists: $case_collision" >&2
  echo "Expected exact branch: $target_branch" >&2
  echo "Use a fresh change key, or rename the old branch only after proving no worktree owns it:" >&2
  echo "  git branch -m '$case_collision' '$target_branch'" >&2
  exit 1
fi

if [[ "$current_branch" == "$target_branch" ]]; then
  cat <<EOF
BRANCH_ACTION=already-on-branch
CURRENT_BRANCH=$target_branch
WORK_BRANCH=$target_branch
HEAD_SHA=$head_short
EOF
  exit 0
fi

if [[ -n "$current_branch" && "$current_lower" == "$target_lower" ]]; then
  if [[ "$resolved_sha" != "$head_sha" ]]; then
    echo "WorkBranchError: case-variant branch already exists: ${resolved_branch:-$current_branch}" >&2
    echo "Expected exact branch: $target_branch" >&2
    echo "Use a fresh change key, or rename the old branch only after proving no worktree owns it:" >&2
    echo "  git branch -m '${resolved_branch:-$current_branch}' '$target_branch'" >&2
    exit 1
  fi

  cat <<EOF
BRANCH_ACTION=already-on-branch
CURRENT_BRANCH=$current_branch
WORK_BRANCH=$target_branch
HEAD_SHA=$head_short
EOF
  exit 0
fi

if [[ -n "$current_branch" && "$current_branch" == "$BASE_BRANCH" ]]; then
  echo "WorkBranchError: refusing to anchor work on default branch $BASE_BRANCH; use an isolated worktree or detached setup point." >&2
  exit 1
fi

if [[ -n "$current_branch" && "$current_branch" != "$target_branch" ]]; then
  echo "WorkBranchError: current branch $current_branch does not match required work branch $target_branch" >&2
  exit 1
fi

if [[ -n "$resolved_branch" ]]; then
  git switch "$resolved_branch" >/dev/null
  action="switched-existing"
else
  git switch -c "$target_branch" >/dev/null
  action="created"
fi

current_branch="$(git branch --show-current 2>/dev/null || true)"

cat <<EOF
BRANCH_ACTION=$action
CURRENT_BRANCH=${current_branch:-$target_branch}
WORK_BRANCH=$target_branch
HEAD_SHA=$head_short
EOF
