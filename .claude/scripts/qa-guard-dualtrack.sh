#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
    cat <<'USAGE'
Usage: qa-guard-dualtrack.sh <change-id>

Run strict dual-track validation gates prior to QA sign-off.
This script executes:
  1. parse-delta.sh <change-id>
  2. run-dualtrack-validation.sh <change-id> --strict
  3. check-dualtrack-conflicts.sh <change-id> --strict

The command exits non-zero if any step fails.
USAGE
}

CHANGE_ID="${1:-}"

if [[ "$#" -eq 0 || "$CHANGE_ID" == "--help" || "$CHANGE_ID" == "-h" ]]; then
    usage
    exit $([[ "$#" -eq 0 ]] && echo 1 || echo 0)
fi

if ! validate_change_id "$CHANGE_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
change_dir="$repo_root/devflow/changes/$CHANGE_ID"

if [[ ! -d "$change_dir" ]]; then
    echo "ERROR: change directory not found: $change_dir" >&2
    exit 1
fi

printf "▶ Parsing delta for %s...\n" "$CHANGE_ID"
"$SCRIPT_DIR/parse-delta.sh" "$CHANGE_ID"

printf "▶ Running strict dual-track validation...\n"
if ! "$SCRIPT_DIR/run-dualtrack-validation.sh" "$CHANGE_ID" --strict; then
    echo "ERROR: Dual-track validation failed (strict mode)" >&2
    exit 1
fi

printf "▶ Checking for conflicts...\n"
if ! "$SCRIPT_DIR/check-dualtrack-conflicts.sh" "$CHANGE_ID" --strict; then
    echo "ERROR: Conflict detection failed (strict mode)" >&2
    exit 1
fi

echo "✅ QA gate passed for $CHANGE_ID"
