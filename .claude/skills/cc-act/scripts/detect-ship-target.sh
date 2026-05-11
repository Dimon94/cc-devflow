#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-act: 识别当前 ship 目标与推荐动作
# ------------------------------------------------------------

current_branch="$(git branch --show-current 2>/dev/null || true)"
head_sha="$(git rev-parse --short HEAD 2>/dev/null || true)"
inside_work_tree="$(git rev-parse --is-inside-work-tree 2>/dev/null || true)"
remote_url="$(git remote get-url origin 2>/dev/null || true)"
platform="unknown"
base_branch=""
pr_status="none"
pr_url=""
branch_state="unknown"
branch_rescue="none"
rescue_action=""

if [[ -n "$current_branch" ]]; then
  branch_state="branch"
elif [[ "$inside_work_tree" == "true" && -n "$head_sha" ]]; then
  branch_state="detached"
else
  branch_state="none"
fi

if [[ "$remote_url" == *github.com* ]]; then
  platform="github"
elif [[ "$remote_url" == *gitlab* ]]; then
  platform="gitlab"
elif command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  platform="github"
elif command -v glab >/dev/null 2>&1 && glab auth status >/dev/null 2>&1; then
  platform="gitlab"
fi

if [[ "$platform" == "github" ]]; then
  base_branch="$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || true)"
  if [[ -z "$base_branch" ]]; then
    base_branch="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || true)"
  fi
elif [[ "$platform" == "gitlab" ]]; then
  base_branch="$(glab mr view -F json 2>/dev/null | jq -r '.target_branch // empty' 2>/dev/null || true)"
  if [[ -z "$base_branch" ]]; then
    base_branch="$(glab repo view -F json 2>/dev/null | jq -r '.default_branch // empty' 2>/dev/null || true)"
  fi
fi

if [[ -z "$base_branch" ]]; then
  base_branch="$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || true)"
fi
if [[ -z "$base_branch" ]] && git rev-parse --verify origin/main >/dev/null 2>&1; then
  base_branch="main"
fi
if [[ -z "$base_branch" ]] && git rev-parse --verify origin/master >/dev/null 2>&1; then
  base_branch="master"
fi
if [[ -z "$base_branch" ]]; then
  base_branch="main"
fi

if [[ "$platform" == "github" ]]; then
  pr_line="$(gh pr view --json url,state -q 'if .url then (.state + "|" + .url) else "" end' 2>/dev/null || true)"
  if [[ -n "$pr_line" ]]; then
    pr_status="${pr_line%%|*}"
    pr_url="${pr_line#*|}"
  fi
elif [[ "$platform" == "gitlab" ]]; then
  pr_line="$(glab mr view -F json 2>/dev/null | jq -r 'if .web_url then (.state + "|" + .web_url) else "" end' 2>/dev/null || true)"
  if [[ -n "$pr_line" ]]; then
    pr_status="${pr_line%%|*}"
    pr_url="${pr_line#*|}"
  fi
fi

decision_hint="local-handoff"
if [[ -n "$current_branch" && "$current_branch" == "$base_branch" ]]; then
  decision_hint="post-merge-closeout"
elif [[ "$pr_status" == "OPEN" || "$pr_status" == "opened" ]]; then
  decision_hint="update-pr"
elif [[ -n "$remote_url" ]]; then
  decision_hint="create-pr"
fi

if [[ "$branch_state" == "detached" ]]; then
  if [[ -n "$remote_url" ]]; then
    branch_rescue="create-branch-before-pr"
    rescue_action="Create a named branch at HEAD before commit/push/PR; do not stop only because CURRENT_BRANCH is empty."
  else
    branch_rescue="create-local-branch-or-handoff"
    rescue_action="Create a named local branch at HEAD before local closeout, or write local-handoff if no branch should be created."
  fi
fi

cat <<EOF
CURRENT_BRANCH=$current_branch
BRANCH_STATE=$branch_state
HEAD_SHA=$head_sha
BASE_BRANCH=$base_branch
PLATFORM=$platform
REMOTE_URL=$remote_url
PR_STATUS=$pr_status
PR_URL=$pr_url
DECISION_HINT=$decision_hint
BRANCH_RESCUE=$branch_rescue
RESCUE_ACTION=$rescue_action
EOF
