#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 兼容旧入口：只写必要的 CLI 事件，不再生成 checkpoint.json
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  write-task-checkpoint.sh --dir path/to/change --task T001 --status pending|running|passed|failed|skipped [--summary "..."] [--event context_ready] [--attempt 0] [--session session-id] [--next-action "..."] [--tdd-json '{"red":...}']
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
TDD_JSON=""

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
    --tdd-json) TDD_JSON="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || -z "$TASK_ID" || -z "$STATUS" ]]; then
  usage
  exit 1
fi

CHANGE_DIR="$(req_do_resolve_change_dir "$REQ_DIR")"
manifest="$(req_do_manifest_path "$CHANGE_DIR")"
change_id="$(jq -r '.changeId // .requirementId // "REQ-UNKNOWN"' "$manifest" 2>/dev/null || basename "$REQ_DIR")"
timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
runtime_task_dir="$(req_do_task_runtime_dir "$CHANGE_DIR" "$TASK_ID")"

if [[ -z "$SESSION_ID" ]]; then
  SESSION_ID="${TASK_ID}-$(date -u +%s)"
fi

tdd_payload="null"
if [[ -n "$TDD_JSON" ]]; then
  if [[ -f "$TDD_JSON" ]]; then
    tdd_payload="$(jq -c . "$TDD_JSON")"
  else
    tdd_payload="$(printf '%s' "$TDD_JSON" | jq -c .)"
  fi
fi

if [[ -n "$EVENT_TYPE" || "$STATUS" == "failed" ]]; then
  mkdir -p "$runtime_task_dir"
  jq -nc \
    --arg type "${EVENT_TYPE:-status_$STATUS}" \
    --arg changeId "$change_id" \
    --arg taskId "$TASK_ID" \
    --arg sessionId "$SESSION_ID" \
    --arg status "$STATUS" \
    --arg summary "$SUMMARY" \
    --arg nextAction "$NEXT_ACTION" \
    --arg timestamp "$timestamp" \
    --argjson tdd "$tdd_payload" \
    '{
      type: $type,
      changeId: $changeId,
      taskId: $taskId,
      sessionId: $sessionId,
      status: $status,
      summary: $summary,
      nextAction: $nextAction,
      timestamp: $timestamp
    } + (if $tdd == null then {} else {tdd: $tdd} end)' >> "$runtime_task_dir/events.jsonl"
fi

echo "No checkpoint written; task truth lives in planning/tasks.md and planning/task-manifest.json"
