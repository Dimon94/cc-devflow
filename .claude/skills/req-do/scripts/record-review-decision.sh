#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 记录 spec / code review 结论，并同步 runtime / manifest
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  record-review-decision.sh --dir path/to/req --task T001 --gate spec|code --verdict pass|fail|blocked --summary "..."
EOF
}

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

manifest="$REQ_DIR/task-manifest.json"
change_id="$(jq -r '.changeId // .requirementId // "REQ-UNKNOWN"' "$manifest" 2>/dev/null || basename "$REQ_DIR")"
repo_root="$(git -C "$REQ_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$REQ_DIR" && pwd))"
runtime_task_dir="$repo_root/.harness/runtime/$change_id/$TASK_ID"
timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
review_file="$runtime_task_dir/review-$GATE.md"
event_name="${GATE}_review_${VERDICT}"
title_kind="$(printf '%s' "$GATE" | tr '[:lower:]' '[:upper:]')"

mkdir -p "$runtime_task_dir"

cat > "$review_file" <<EOF
# ${title_kind} Review

- Timestamp: $timestamp
- Task: $TASK_ID
- Verdict: $VERDICT
- Summary: $SUMMARY
EOF

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

echo "Recorded $event_name for $TASK_ID"
