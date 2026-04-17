#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 校验任务是否完成 Red / Green / Refactor / Review 闭环
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  verify-task-gates.sh --dir path/to/req --task T001
EOF
}

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

manifest="$REQ_DIR/task-manifest.json"
change_id="$(jq -r '.changeId // .requirementId // "REQ-UNKNOWN"' "$manifest" 2>/dev/null || basename "$REQ_DIR")"
repo_root="$(git -C "$REQ_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$REQ_DIR" && pwd))"
runtime_task_dir="$repo_root/.harness/runtime/$change_id/$TASK_ID"
events_file="$runtime_task_dir/events.jsonl"
spec_review="$runtime_task_dir/review-spec.md"
code_review="$runtime_task_dir/review-code.md"

if [[ ! -f "$events_file" ]]; then
  echo "Missing $events_file" >&2
  exit 1
fi

events=()
while IFS= read -r event; do
  events+=("$event")
done < <(jq -r --arg task "$TASK_ID" 'select(.taskId == $task) | .type' "$events_file")

if [[ ${#events[@]} -eq 0 ]]; then
  echo "No runtime events found for $TASK_ID" >&2
  exit 1
fi

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

context_idx="$(first_index "context_ready")"
red_idx="$(first_index "red_failed")"
green_idx="$(first_index "green_passed")"
refactor_done_idx="$(first_index "refactor_done")"
refactor_skip_idx="$(first_index "refactor_not_needed")"
spec_idx="$(first_index "spec_review_pass")"
code_idx="$(first_index "code_review_pass")"

refactor_idx="$refactor_done_idx"
if [[ "$refactor_idx" == "-1" || ("$refactor_skip_idx" != "-1" && "$refactor_skip_idx" -lt "$refactor_idx") ]]; then
  refactor_idx="$refactor_skip_idx"
fi

if [[ "$context_idx" == "-1" || "$red_idx" == "-1" || "$green_idx" == "-1" || "$refactor_idx" == "-1" || "$spec_idx" == "-1" || "$code_idx" == "-1" ]]; then
  echo "Task $TASK_ID is missing required gate events" >&2
  exit 1
fi

if ! [[ "$context_idx" -lt "$red_idx" && "$red_idx" -lt "$green_idx" && "$green_idx" -lt "$refactor_idx" && "$refactor_idx" -lt "$spec_idx" && "$spec_idx" -lt "$code_idx" ]]; then
  echo "Task $TASK_ID gate order is invalid" >&2
  exit 1
fi

if [[ ! -f "$spec_review" || ! -f "$code_review" ]]; then
  echo "Task $TASK_ID is missing review markdown evidence" >&2
  exit 1
fi

grep -Eq 'Verdict:\s*pass' "$spec_review" || {
  echo "Task $TASK_ID spec review markdown is not pass" >&2
  exit 1
}

grep -Eq 'Verdict:\s*pass' "$code_review" || {
  echo "Task $TASK_ID code review markdown is not pass" >&2
  exit 1
}

echo "Task $TASK_ID gates verified"
