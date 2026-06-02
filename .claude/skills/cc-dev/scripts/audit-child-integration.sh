#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# cc-dev: read-only child integration audit
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  audit-child-integration.sh --child-worktree <path> --commit <hash> --parent-branch <branch> [--allowed-path <path> ...]

Outputs key=value lines and does not mutate Git state.
EOF
}

child_worktree=""
commit_hash=""
parent_branch=""
allowed_paths=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --child-worktree)
      child_worktree="${2:-}"
      shift 2
      ;;
    --commit)
      commit_hash="${2:-}"
      shift 2
      ;;
    --parent-branch)
      parent_branch="${2:-}"
      shift 2
      ;;
    --allowed-path)
      allowed_paths+=("${2:-}")
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf 'ERROR=unknown argument: %s\n' "$1"
      usage >&2
      exit 2
      ;;
  esac
done

normalize_path() {
  local value="$1"
  value="${value#./}"
  value="${value%/}"
  printf '%s\n' "$value"
}

path_allowed() {
  local touched
  touched="$(normalize_path "$1")"

  if [[ ${#allowed_paths[@]} -eq 0 ]]; then
    return 1
  fi

  local allowed
  for allowed in "${allowed_paths[@]}"; do
    allowed="$(normalize_path "$allowed")"
    if [[ "$touched" == "$allowed" || "$touched" == "$allowed/"* ]]; then
      return 0
    fi
  done

  return 1
}

join_by_comma() {
  local IFS=,
  printf '%s\n' "$*"
}

recommendation="integrate"
reasons=()
child_exists="no"
child_clean="no"
commit_exists="no"
commit_in_parent="unknown"
scope_drift="no"
touched_paths=()
out_of_scope_paths=()
untracked_files=()

if [[ -n "$child_worktree" && -d "$child_worktree" ]]; then
  child_exists="yes"
fi

if [[ "$child_exists" == "yes" ]]; then
  status_output="$(git -C "$child_worktree" status --short)"
  if [[ -z "$status_output" ]]; then
    child_clean="yes"
  else
    child_clean="no"
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      if [[ "$line" == '?? '* ]]; then
        untracked_files+=("${line#?? }")
      fi
    done <<< "$status_output"
  fi
else
  recommendation="blocked"
  reasons+=("child-worktree-missing")
fi

if [[ -n "$commit_hash" ]] && git cat-file -e "${commit_hash}^{commit}" 2>/dev/null; then
  commit_exists="yes"
else
  commit_exists="no"
  recommendation="blocked"
  reasons+=("commit-missing")
fi

if [[ "$commit_exists" == "yes" ]]; then
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    touched_paths+=("$path")
    if ! path_allowed "$path"; then
      scope_drift="yes"
      out_of_scope_paths+=("$path")
    fi
  done < <(git diff-tree --no-commit-id --name-only -r "$commit_hash")

  if [[ -n "$parent_branch" ]] && git rev-parse --verify --quiet "$parent_branch" >/dev/null; then
    if git merge-base --is-ancestor "$commit_hash" "$parent_branch"; then
      commit_in_parent="yes"
    else
      commit_in_parent="no"
    fi
  else
    commit_in_parent="unknown"
    reasons+=("parent-branch-unverified")
  fi
fi

if [[ "$child_clean" == "no" ]]; then
  if [[ "$recommendation" != "blocked" ]]; then
    recommendation="preserve"
  fi
  reasons+=("child-worktree-dirty")
fi

if [[ "$scope_drift" == "yes" ]]; then
  recommendation="blocked"
  reasons+=("scope-drift")
fi

if [[ "$commit_in_parent" == "yes" ]]; then
  recommendation="preserve"
  reasons+=("commit-already-in-parent")
fi

printf 'CHILD_WORKTREE_EXISTS=%s\n' "$child_exists"
printf 'CHILD_CLEAN=%s\n' "$child_clean"
printf 'COMMIT_EXISTS=%s\n' "$commit_exists"
printf 'COMMIT_IN_PARENT=%s\n' "$commit_in_parent"
printf 'TOUCHED_PATHS=%s\n' "$(join_by_comma "${touched_paths[@]}")"
printf 'SCOPE_DRIFT=%s\n' "$scope_drift"
printf 'OUT_OF_SCOPE_PATHS=%s\n' "$(join_by_comma "${out_of_scope_paths[@]}")"
printf 'UNTRACKED_FILES=%s\n' "$(join_by_comma "${untracked_files[@]}")"
printf 'RECOMMENDATION=%s\n' "$recommendation"
printf 'REASONS=%s\n' "$(join_by_comma "${reasons[@]}")"
