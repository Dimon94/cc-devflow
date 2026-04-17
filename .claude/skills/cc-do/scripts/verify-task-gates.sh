#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 校验任务是否完成 Red / Green / Refactor / Review 闭环
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  verify-task-gates.sh --dir path/to/change --task T001
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/cc-do-common.sh"
REQ_DIR=""
TASK_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    --task) TASK_ID="$(echo "$2" | tr '[:lower:]' '[:upper:]')"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || -z "$TASK_ID" ]]; then
  usage
  exit 1
fi

CHANGE_DIR="$(req_do_resolve_change_dir "$REQ_DIR")"
manifest="$(req_do_manifest_path "$CHANGE_DIR")"
runtime_task_dir="$(req_do_task_runtime_dir "$CHANGE_DIR" "$TASK_ID")"
events_file="$runtime_task_dir/events.jsonl"
checkpoint_file="$runtime_task_dir/checkpoint.json"

if [[ ! -f "$checkpoint_file" ]]; then
  echo "Missing $checkpoint_file" >&2
  exit 1
fi

checkpoint_status="$(jq -r '.status // "unknown"' "$checkpoint_file" 2>/dev/null || echo unknown)"
[[ "$checkpoint_status" == "passed" ]] || {
  echo "Task $TASK_ID checkpoint status is not passed" >&2
  exit 1
}

spec_verdict="$(jq -r --arg task "$TASK_ID" '.tasks[] | select(.id == $task) | .reviews.spec // "pending"' "$manifest" 2>/dev/null || echo pending)"
code_verdict="$(jq -r --arg task "$TASK_ID" '.tasks[] | select(.id == $task) | .reviews.code // "pending"' "$manifest" 2>/dev/null || echo pending)"

[[ "$spec_verdict" == "pass" ]] || {
  echo "Task $TASK_ID spec review verdict is not pass" >&2
  exit 1
}

[[ "$code_verdict" == "pass" ]] || {
  echo "Task $TASK_ID code review verdict is not pass" >&2
  exit 1
}

if [[ -f "$events_file" ]]; then
  events=()
  while IFS= read -r event; do
    events+=("$event")
  done < <(jq -r --arg task "$TASK_ID" 'select(.taskId == $task) | .type' "$events_file")

  if [[ ${#events[@]} -gt 0 ]]; then
    first_index() {
      local target="$1"
      local index=0
      for event in "${events[@]}"; do
        if [[ "$event" == "$target" ]]; then
          echo "$index"
          return
        fi
        index=$((index + 1))
      done
      echo "-1"
    }

    red_idx="$(first_index "red_failed")"
    green_idx="$(first_index "green_passed")"
    if [[ "$red_idx" != "-1" && "$green_idx" != "-1" && "$red_idx" -ge "$green_idx" ]]; then
      echo "Task $TASK_ID gate order is invalid" >&2
      exit 1
    fi
  fi
fi

echo "Task $TASK_ID gates verified"
