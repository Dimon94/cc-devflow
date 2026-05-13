#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-act: 提交前核验 HEAD / ref / index 真相
# ------------------------------------------------------------

inside_work_tree="$(git rev-parse --is-inside-work-tree 2>/dev/null || true)"
if [[ "$inside_work_tree" != "true" ]]; then
  echo "ShipPreflightError: not inside a git work tree" >&2
  exit 1
fi

current_branch="$(git branch --show-current 2>/dev/null || true)"
symbolic_ref="$(git symbolic-ref -q --short HEAD 2>/dev/null || true)"
head_sha="$(git rev-parse --verify --short HEAD 2>/dev/null || true)"
head_state="present"
commit_ready="true"
blocker=""
case_collision=""

if [[ -z "$head_sha" ]]; then
  head_state="unborn"
  commit_ready="false"
  blocker="HEAD is unborn; do not trust staged status until the branch is anchored to a real commit."
fi

if [[ -n "$symbolic_ref" ]]; then
  symbolic_ref_lower="$(printf '%s' "$symbolic_ref" | tr '[:upper:]' '[:lower:]')"
  while IFS= read -r ref_name; do
    ref_name_lower="$(printf '%s' "$ref_name" | tr '[:upper:]' '[:lower:]')"
    if [[ "$ref_name" != "$symbolic_ref" && "$ref_name_lower" == "$symbolic_ref_lower" ]]; then
      case_collision="$ref_name"
      commit_ready="false"
      blocker="${blocker:+$blocker }Case-variant branch already exists: $ref_name."
      break
    fi
  done < <(git for-each-ref --format='%(refname:short)' refs/heads 2>/dev/null || true)
fi

staged_count="$(git diff --cached --name-only --diff-filter=ACMRTUXB | sed '/^$/d' | wc -l | tr -d ' ')"
unstaged_count="$(git diff --name-only --diff-filter=ACMRTUXB | sed '/^$/d' | wc -l | tr -d ' ')"
untracked_count="$(git ls-files --others --exclude-standard | sed '/^$/d' | wc -l | tr -d ' ')"

cat <<EOF
INSIDE_WORK_TREE=$inside_work_tree
CURRENT_BRANCH=$current_branch
SYMBOLIC_REF=$symbolic_ref
HEAD_STATE=$head_state
HEAD_SHA=$head_sha
CASE_COLLISION_BRANCH=$case_collision
STAGED_COUNT=$staged_count
UNSTAGED_COUNT=$unstaged_count
UNTRACKED_COUNT=$untracked_count
COMMIT_READY=$commit_ready
BLOCKER=$blocker
EOF
