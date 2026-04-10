#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 把 TASKS.md 中指定任务勾为完成
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: mark-task-complete.sh --tasks TASKS.md --task T001
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

if [[ -z "$TASKS" || -z "$TASK_ID" || ! -f "$TASKS" ]]; then
  usage
  exit 1
fi

tmp="$(mktemp)"
sed -E "0,/^- \[ \] (\*\*)?${TASK_ID}(\*\*)?/{s//- [x] \1${TASK_ID}\2/}" "$TASKS" > "$tmp"
mv "$tmp" "$TASKS"
echo "Marked $TASK_ID complete"
