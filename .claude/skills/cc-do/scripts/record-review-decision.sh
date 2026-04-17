#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 记录 spec / code review 结论，并同步 runtime / manifest
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  record-review-decision.sh --dir path/to/change --task T001 --gate spec|code --verdict pass|fail|blocked --summary "..."
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/cc-do-common.sh"
REQ_DIR=""
TASK_ID=""
GATE=""
VERDICT=""
SUMMARY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) REQ_DIR="$2"; shift 2 ;;
    --task) TASK_ID="$(echo "$2" | tr '[:lower:]' '[:upper:]')"; shift 2 ;;
    --gate) GATE="$2"; shift 2 ;;
    --verdict) VERDICT="$2"; shift 2 ;;
    --summary) SUMMARY="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REQ_DIR" || -z "$TASK_ID" || -z "$GATE" || -z "$VERDICT" || -z "$SUMMARY" ]]; then
  usage
  exit 1
fi

if [[ "$GATE" != "spec" && "$GATE" != "code" ]]; then
  echo "Gate must be spec or code" >&2
  exit 1
fi

CHANGE_DIR="$(req_do_resolve_change_dir "$REQ_DIR")"
manifest="$(req_do_manifest_path "$CHANGE_DIR")"
change_id="$(jq -r '.changeId // .requirementId // "REQ-UNKNOWN"' "$manifest" 2>/dev/null || basename "$CHANGE_DIR")"
runtime_task_dir="$(req_do_task_runtime_dir "$CHANGE_DIR" "$TASK_ID")"
timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
event_name="${GATE}_review_${VERDICT}"

mkdir -p "$runtime_task_dir"

if [[ -f "$manifest" ]]; then
  tmp_manifest="$(mktemp)"
  jq --arg task "$TASK_ID" --arg gate "$GATE" --arg verdict "$VERDICT" '
    .tasks |= map(
      if .id == $task then
        . + { reviews: ((.reviews // {}) + {($gate): $verdict}) }
      else
        .
      end
    )
  ' "$manifest" > "$tmp_manifest"
  mv "$tmp_manifest" "$manifest"
fi

if [[ -f "$runtime_task_dir/events.jsonl" || "$VERDICT" != "pass" ]]; then
  jq -nc \
    --arg type "$event_name" \
    --arg changeId "$change_id" \
    --arg taskId "$TASK_ID" \
    --arg gate "$GATE" \
    --arg verdict "$VERDICT" \
    --arg summary "$SUMMARY" \
    --arg timestamp "$timestamp" \
    '{
      type: $type,
      changeId: $changeId,
      taskId: $taskId,
      gate: $gate,
      verdict: $verdict,
      summary: $summary,
      timestamp: $timestamp
    }' >> "$runtime_task_dir/events.jsonl"
fi

echo "Recorded $event_name for $TASK_ID"
