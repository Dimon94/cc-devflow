#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 写入 task checkpoint.json / checkpoint.md / events.jsonl
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  write-task-checkpoint.sh --dir path/to/req --task T001 --status pending|running|passed|failed|skipped --summary "..." [--event context_ready] [--attempt 0] [--session session-id] [--next-action "..."]
EOF
}

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

manifest="$REQ_DIR/task-manifest.json"
change_id="$(jq -r '.changeId // .requirementId // "REQ-UNKNOWN"' "$manifest" 2>/dev/null || basename "$REQ_DIR")"
plan_version="$(jq -r '.metadata.planVersion // 1' "$manifest" 2>/dev/null || echo 1)"
repo_root="$(git -C "$REQ_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$REQ_DIR" && pwd))"
runtime_task_dir="$repo_root/.harness/runtime/$change_id/$TASK_ID"
timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

mkdir -p "$runtime_task_dir"

if [[ -z "$SESSION_ID" ]]; then
  SESSION_ID="${TASK_ID}-$(date -u +%s)"
fi

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
  }' > "$runtime_task_dir/checkpoint.json"

cat > "$runtime_task_dir/checkpoint.md" <<EOF
# Checkpoint

- Timestamp: $timestamp
- Change: $change_id
- Task: $TASK_ID
- Status: $STATUS
- Summary: $SUMMARY
- Session: $SESSION_ID
- Attempt: $ATTEMPT
- Next action: ${NEXT_ACTION:-none}
EOF

if [[ -n "$EVENT_TYPE" ]]; then
  jq -nc \
    --arg type "$EVENT_TYPE" \
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
fi

echo "Wrote $runtime_task_dir/checkpoint.json"
