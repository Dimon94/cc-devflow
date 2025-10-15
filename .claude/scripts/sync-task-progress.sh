#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

CHANGE_ID="${1:-}"

if [[ -z "$CHANGE_ID" ]]; then
    echo "Usage: sync-task-progress.sh <change-id>" >&2
    exit 1
fi

repo_root=$(get_repo_root)
change_dir="$repo_root/devflow/changes/$CHANGE_ID"
tasks_md="$change_dir/tasks.md"
progress_json="$change_dir/task-progress.json"
delta_json="$change_dir/delta.json"

if [[ ! -d "$change_dir" ]]; then
    echo "ERROR: change directory not found: $change_dir" >&2
    exit 1
fi

if [[ ! -f "$tasks_md" ]]; then
    echo "ERROR: tasks.md not found in $change_dir" >&2
    exit 1
fi

total=$(grep -E '^[*-]\s+\[[ xX]\]' "$tasks_md" | wc -l | tr -d ' ')
completed=$(grep -E '^[*-]\s+\[[xX]\]' "$tasks_md" | wc -l | tr -d ' ')

timestamp=$(get_beijing_time_iso)

cat > "$progress_json" <<JSON
{
  "changeId": "$CHANGE_ID",
  "generatedAt": "$timestamp",
  "total": $total,
  "completed": $completed
}
JSON

if [[ -f "$delta_json" ]]; then
    python3 - "$delta_json" "$total" "$completed" <<'PY'
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

delta_path = Path(sys.argv[1])
total = int(sys.argv[2])
completed = int(sys.argv[3])

try:
    data = json.loads(delta_path.read_text())
except FileNotFoundError:
    sys.exit(0)

summary = {
    "total": total,
    "completed": completed,
    "updatedAt": datetime.now(timezone.utc).isoformat()
}

if "tasks" in data and isinstance(data["tasks"], dict):
    data["tasks"].update(summary)
else:
    data["tasks"] = summary

delta_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
PY
fi

req_id=""
if [[ -f "$delta_json" ]]; then
    req_id=$(jq -r '(.relatedRequirements[0] // empty)' "$delta_json" 2>/dev/null || echo "")
fi

if [[ -n "$req_id" ]]; then
    log_event "$req_id" "Task progress synced for change $CHANGE_ID ($completed/$total)"
fi

echo "Task progress: $completed/$total"
