#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 写入 task checkpoint.json / events.jsonl
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  write-task-checkpoint.sh --dir path/to/change --task T001 --status pending|running|passed|failed|skipped --summary "..." [--event context_ready] [--attempt 0] [--session session-id] [--next-action "..."]
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/cc-do-common.sh"
REQ_DIR=""
TASK_ID=""
STATUS=""
SUMMARY=""
EVENT_TYPE=""
ATTEMPT="0"
SESSION_ID=""
NEXT_ACTION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    --task) TASK_ID="$(echo "$2" | tr '[:lower:]' '[:upper:]')"; shift 2 ;;
    --status) STATUS="$2"; shift 2 ;;
    --summary) SUMMARY="$2"; shift 2 ;;
    --event) EVENT_TYPE="$2"; shift 2 ;;
    --attempt) ATTEMPT="$2"; shift 2 ;;
    --session) SESSION_ID="$2"; shift 2 ;;
    --next-action) NEXT_ACTION="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || -z "$TASK_ID" || -z "$STATUS" || -z "$SUMMARY" ]]; then
  usage
  exit 1
fi

CHANGE_DIR="$(req_do_resolve_change_dir "$REQ_DIR")"
manifest="$(req_do_manifest_path "$CHANGE_DIR")"
change_id="$(jq -r '.changeId // .requirementId // "REQ-UNKNOWN"' "$manifest" 2>/dev/null || basename "$REQ_DIR")"
plan_version="$(jq -r '.metadata.planVersion // 1' "$manifest" 2>/dev/null || echo 1)"
timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
runtime_task_dir="$(req_do_task_runtime_dir "$CHANGE_DIR" "$TASK_ID")"
checkpoint_file="$runtime_task_dir/checkpoint.json"

mkdir -p "$runtime_task_dir"

if [[ -z "$SESSION_ID" ]]; then
  SESSION_ID="${TASK_ID}-$(date -u +%s)"
fi

write_checkpoint() {
  local tmp_checkpoint
  tmp_checkpoint="$(mktemp)"
  jq -nc \
    --arg changeId "$change_id" \
    --arg taskId "$TASK_ID" \
    --arg sessionId "$SESSION_ID" \
    --arg planVersion "$plan_version" \
    --arg status "$STATUS" \
    --arg summary "$SUMMARY" \
    --arg timestamp "$timestamp" \
    --arg attempt "$ATTEMPT" \
    '{
      changeId: $changeId,
      taskId: $taskId,
      sessionId: $sessionId,
      planVersion: ($planVersion | tonumber),
      status: $status,
      summary: $summary,
      timestamp: $timestamp,
      attempt: ($attempt | tonumber)
    }' > "$tmp_checkpoint"
  mv "$tmp_checkpoint" "$checkpoint_file"
}
req_do_with_lock "$checkpoint_file" write_checkpoint

if [[ -n "$EVENT_TYPE" || "$STATUS" == "failed" ]]; then
  append_event() {
    jq -nc \
      --arg type "${EVENT_TYPE:-status_$STATUS}" \
      --arg changeId "$change_id" \
      --arg taskId "$TASK_ID" \
      --arg sessionId "$SESSION_ID" \
      --arg status "$STATUS" \
      --arg summary "$SUMMARY" \
      --arg nextAction "$NEXT_ACTION" \
      --arg timestamp "$timestamp" \
      '{
        type: $type,
        changeId: $changeId,
        taskId: $taskId,
        sessionId: $sessionId,
        status: $status,
        summary: $summary,
        nextAction: $nextAction,
        timestamp: $timestamp
      }' >> "$runtime_task_dir/events.jsonl"
  }
  req_do_with_lock "$runtime_task_dir/events.jsonl" append_event
fi

echo "Wrote $checkpoint_file"
