#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-act: detached HEAD 时锚定可推送分支
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: ensure-ship-branch.sh [--dir path/to/change] [--prefix codex]
EOF
}

REQ_DIR=""
BRANCH_PREFIX="${CC_ACT_BRANCH_PREFIX:-codex}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    --prefix) BRANCH_PREFIX="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/cc-act-common.sh"

current_branch="$(git branch --show-current 2>/dev/null || true)"
head_sha="$(git rev-parse --short HEAD 2>/dev/null || true)"

if [[ -n "$current_branch" ]]; then
  cat <<EOF
BRANCH_ACTION=already-on-branch
CURRENT_BRANCH=$current_branch
HEAD_SHA=$head_sha
EOF
  exit 0
fi

if [[ -z "$head_sha" ]]; then
  echo "ShipPreflightError: cannot create a ship branch outside a git work tree" >&2
  exit 1
fi

change_slug=""
if [[ -n "$REQ_DIR" && -d "$REQ_DIR" ]]; then
  change_slug="$(basename "$(req_act_change_dir "$REQ_DIR")")"
fi
if [[ -z "$change_slug" ]]; then
  repo_name="$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")"
  change_slug="ship-$repo_name"
fi

branch_slug="$(
  printf '%s' "$change_slug" |
    tr '[:upper:]' '[:lower:]' |
    sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
)"
if [[ -z "$branch_slug" ]]; then
  branch_slug="ship-$head_sha"
fi

base_branch="${BRANCH_PREFIX%/}/$branch_slug"
candidate="$base_branch"

if git show-ref --verify --quiet "refs/heads/$candidate"; then
  if [[ "$(git rev-parse --short "$candidate" 2>/dev/null || true)" == "$head_sha" ]] &&
    git switch "$candidate" >/dev/null 2>&1; then
    cat <<EOF
BRANCH_ACTION=switched-existing
CURRENT_BRANCH=$candidate
HEAD_SHA=$head_sha
EOF
    exit 0
  fi

  candidate="$base_branch-$head_sha"
  suffix=2
  while git show-ref --verify --quiet "refs/heads/$candidate"; do
    candidate="$base_branch-$head_sha-$suffix"
    suffix=$((suffix + 1))
  done
fi

git switch -c "$candidate" >/dev/null

cat <<EOF
BRANCH_ACTION=created
CURRENT_BRANCH=$candidate
HEAD_SHA=$head_sha
EOF
