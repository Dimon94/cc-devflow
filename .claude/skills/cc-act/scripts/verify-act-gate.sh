#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: verify-act-gate.sh --dir path/to/change
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

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/cc-act-common.sh"

change_dir="$(req_act_change_dir "$REQ_DIR")"
task_file="$(req_act_tasks_path "$change_dir")"

[[ -f "$task_file" ]] || { echo "Gate open: missing task.md" >&2; exit 1; }

remaining_tasks="$(awk '/^- \[ \]/{c++} END{print c+0}' "$task_file" 2>/dev/null || echo 0)"
[[ "$remaining_tasks" -eq 0 ]] || { echo "Gate open: remaining_tasks=$remaining_tasks" >&2; exit 1; }

if ! git diff --quiet -- "$task_file" 2>/dev/null; then
  echo "Gate open: task.md has unstaged or uncommitted edits" >&2
  exit 1
fi

cat <<EOF
GATE=closed
TASK_FILE=$task_file
REMAINING_TASKS=$remaining_tasks
EOF
