#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: render-pr-brief.sh --dir path/to/change [--out path/to/pr-brief.md] [--repo-root path/to/repo]
EOF
}

REQ_DIR=""
OUT_FILE=""
REPO_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    --out) OUT_FILE="$2"; shift 2 ;;
    --repo-root) REPO_ROOT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || ! -d "$REQ_DIR" ]]; then
  usage
  exit 1
fi

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git -C "$REQ_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/cc-act-common.sh"

change_dir="$(req_act_change_dir "$REQ_DIR")"
task_file="$(req_act_tasks_path "$change_dir")"
if [[ -z "$OUT_FILE" ]]; then
  OUT_FILE="$(req_act_pr_brief_path "$change_dir")"
fi

"$script_dir/verify-act-gate.sh" --dir "$change_dir" >/dev/null

mkdir -p "$(dirname "$OUT_FILE")"

branch="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || true)"
head_sha="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || true)"
status="$(git -C "$REPO_ROOT" status --short 2>/dev/null || true)"
commits="$(git -C "$REPO_ROOT" log --oneline -10 2>/dev/null || true)"
changed="$(git -C "$REPO_ROOT" diff --stat HEAD 2>/dev/null || true)"

{
  echo "# PR Brief"
  echo
  echo "## Change"
  echo
  echo "- Change key: $(basename "$change_dir")"
  echo "- Branch: ${branch:-unknown}"
  echo "- Head: ${head_sha:-unknown}"
  echo
  echo "## Task Summary"
  echo
  if [[ -f "$task_file" ]]; then
    awk '/^- \[[xX]\] /{print "- Done: " substr($0, 7)}' "$task_file"
  else
    echo "- Missing task.md"
  fi
  echo
  echo "## Recent Commits"
  echo
  if [[ -n "$commits" ]]; then
    printf '%s\n' "$commits" | sed 's/^/- /'
  else
    echo "- No commits found"
  fi
  echo
  echo "## Current Diff"
  echo
  if [[ -n "$changed" ]]; then
    printf '%s\n' "$changed" | sed 's/^/- /'
  else
    echo "- No uncommitted diff"
  fi
  echo
  echo "## Worktree Status"
  echo
  if [[ -n "$status" ]]; then
    printf '%s\n' "$status" | sed 's/^/- /'
  else
    echo "- Clean"
  fi
  echo
  echo "## PR Body Draft"
  echo
  echo "Summary:"
  echo "- <summarize user-visible change from task.md and commits>"
  echo
  echo "Validation:"
  echo "- <copy fresh cc-check commands and results>"
  echo
  echo "Risk / rollback:"
  echo "- <summarize residual risk and rollback path>"
} > "$OUT_FILE"

echo "Rendered $OUT_FILE"
