#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

REQ_ID=""
CHANGE_ID=""
QUIET=false

usage() {
    cat <<'USAGE'
Usage: link-change-id.sh --req-id REQ-123 --change-id req-123-feature

Update orchestration status files so the requirement points to the active dual-track change.

Options:
  --req-id ID       Requirement ID (REQ-xxx or BUG-xxx)
  --change-id ID    Change identifier under devflow/changes/
  --quiet           Suppress console output
  --help            Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --req-id)
            REQ_ID="$2"
            shift 2
            ;;
        --change-id)
            CHANGE_ID="$2"
            shift 2
            ;;
        --quiet)
            QUIET=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage
            exit 1
            ;;
    esac
done

if [[ -z "$REQ_ID" || -z "$CHANGE_ID" ]]; then
    echo "ERROR: --req-id and --change-id are required" >&2
    usage
    exit 1
fi

if ! validate_req_id "$REQ_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
req_type=$(get_req_type "$REQ_ID")

if [[ "$req_type" == "unknown" ]]; then
    echo "ERROR: Unsupported requirement type for $REQ_ID" >&2
    exit 1
fi

req_dir=$(get_req_dir "$repo_root" "$REQ_ID")

if [[ "$req_type" == "bug" ]]; then
    status_file="$req_dir/status.json"
else
    status_file="$req_dir/orchestration_status.json"
fi

if [[ ! -f "$status_file" ]]; then
    echo "ERROR: Status file not found: $status_file" >&2
    exit 1
fi

updated_at=$(get_beijing_time_iso)

env CAPTURE_FILE="$status_file" \
    CHANGE_ID_ENV="$CHANGE_ID" \
    UPDATED_AT_ENV="$updated_at" \
python3 - <<'PY'
import json
import os
from pathlib import Path

status_path = Path(os.environ["CAPTURE_FILE"])
change_id = os.environ["CHANGE_ID_ENV"].strip()
updated_at = os.environ["UPDATED_AT_ENV"].strip()

try:
    data = json.loads(status_path.read_text())
except Exception:
    data = {}

if isinstance(data, dict):
    data["change_id"] = change_id
    data["updatedAt"] = updated_at
else:
    data = {
        "change_id": change_id,
        "updatedAt": updated_at
    }

status_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
PY

log_event "$REQ_ID" "Linked requirement to change: $CHANGE_ID"

if [[ "$QUIET" == false ]]; then
    echo "Linked $REQ_ID to $CHANGE_ID"
fi

exit 0
