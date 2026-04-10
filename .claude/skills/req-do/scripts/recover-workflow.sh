#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 从 requirement 目录恢复当前工作位置
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: recover-workflow.sh --dir path/to/requirement
EOF
}

REQ_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || ! -d "$REQ_DIR" ]]; then
  usage
  exit 1
fi

manifest="$REQ_DIR/task-manifest.json"
tasks="$REQ_DIR/TASKS.md"
report="$REQ_DIR/report-card.json"

echo "# Recovery Snapshot"
echo
echo "- Requirement dir: $REQ_DIR"

if [[ -f "$manifest" ]]; then
  current="$(jq -r '.currentTaskId // "unknown"' "$manifest" 2>/dev/null || echo unknown)"
  status="$(jq -r '.status // "unknown"' "$manifest" 2>/dev/null || echo unknown)"
  echo "- Manifest status: $status"
  echo "- Current task: $current"
fi

if [[ -f "$tasks" ]]; then
  next_task="$(grep '^- \[ \]' "$tasks" | head -1 || true)"
  done_count="$(grep -c '^- \[x\]' "$tasks" 2>/dev/null || echo 0)"
  todo_count="$(grep -c '^- \[ \]' "$tasks" 2>/dev/null || echo 0)"
  echo "- TASKS done: $done_count"
  echo "- TASKS todo: $todo_count"
  [[ -n "$next_task" ]] && echo "- Next visible task: $next_task"
fi

if [[ -f "$report" ]]; then
  verdict="$(jq -r '.verdict // "unknown"' "$report" 2>/dev/null || echo unknown)"
  echo "- Latest check verdict: $verdict"
fi
