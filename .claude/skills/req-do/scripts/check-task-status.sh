#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 查询 TASKS.md 总进度或单任务状态
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: check-task-status.sh --tasks TASKS.md [--task T001]
EOF
}

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

if [[ -z "$TASKS" || ! -f "$TASKS" ]]; then
  usage
  exit 1
fi

if [[ -n "$TASK_ID" ]]; then
  if rg -n "^- \\[x\\].*$TASK_ID" "$TASKS" >/dev/null 2>&1; then
    echo "$TASK_ID complete"
    exit 0
  fi
  if rg -n "^- \\[ \\].*$TASK_ID" "$TASKS" >/dev/null 2>&1; then
    echo "$TASK_ID pending"
    exit 0
  fi
  echo "$TASK_ID not_found"
  exit 1
fi

done_count="$(grep -c '^- \[x\]' "$TASKS" 2>/dev/null || echo 0)"
todo_count="$(grep -c '^- \[ \]' "$TASKS" 2>/dev/null || echo 0)"
total=$((done_count + todo_count))
echo "done=$done_count todo=$todo_count total=$total"
