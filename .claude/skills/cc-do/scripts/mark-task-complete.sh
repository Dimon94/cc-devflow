#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 把 task.md 中的任务标记为完成
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  mark-task-complete.sh --tasks task.md --task T001
EOF
}

mark_first_task_complete() {
  local tasks_path="$1"
  local task_id="$2"

  awk -v task="$task_id" '
    function task_matches(rest, prefix, next_char) {
      prefix = task
      if (substr(rest, 1, length(prefix)) == prefix) {
        next_char = substr(rest, length(prefix) + 1, 1)
        return next_char == "" || next_char ~ /[^[:alnum:]_-]/
      }

      prefix = "**" task "**"
      if (substr(rest, 1, length(prefix)) == prefix) {
        next_char = substr(rest, length(prefix) + 1, 1)
        return next_char == "" || next_char ~ /[^[:alnum:]_-]/
      }

      return 0
    }

    {
      rest = $0
      if (!replaced && sub(/^- \[ \] /, "", rest) && task_matches(rest)) {
        sub(/^- \[ \] /, "- [x] ")
        replaced = 1
      }

      print
    }
  ' "$tasks_path"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TASKS=""
TASK_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tasks) TASKS="$2"; shift 2 ;;
    --task) TASK_ID="$(echo "$2" | tr '[:lower:]' '[:upper:]')"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$TASK_ID" || -z "$TASKS" ]]; then
  usage
  exit 1
fi

if [[ ! -f "$TASKS" ]]; then
  usage
  exit 1
fi

tmp_tasks="$(mktemp)"
mark_first_task_complete "$TASKS" "$TASK_ID" > "$tmp_tasks"
mv "$tmp_tasks" "$TASKS"

echo "Marked $TASK_ID complete"
