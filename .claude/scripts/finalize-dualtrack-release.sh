#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
    cat <<'USAGE'
Usage: finalize-dualtrack-release.sh <change-id> [--skip-qa]

Execute the release gate for a dual-track change:
  1. (Optional) qa-guard-dualtrack.sh <change-id>
  2. archive-change.sh <change-id>
  3. generate-archive-summary.sh <change-id>
  4. generate-spec-changelog.sh <change-id>

Options:
  --skip-qa    Skip qa-guard-dualtrack.sh (not recommended).
  --help       Show this message.
USAGE
}

CHANGE_ID=""
RUN_QA_GUARD=true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-qa)
            RUN_QA_GUARD=false
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            if [[ -z "$CHANGE_ID" ]]; then
                CHANGE_ID="$1"
            else
                echo "ERROR: unexpected argument: $1" >&2
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$CHANGE_ID" ]]; then
    echo "ERROR: change-id is required" >&2
    usage
    exit 1
fi

if ! validate_change_id "$CHANGE_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
change_dir="$repo_root/devflow/changes/$CHANGE_ID"

if [[ ! -d "$change_dir" ]]; then
    echo "ERROR: active change directory not found: $change_dir" >&2
    echo "Hint: release gate must run before archiving moves the change to archive/." >&2
    exit 1
fi

if $RUN_QA_GUARD; then
    printf "▶ Executing QA guard for %s\n" "$CHANGE_ID"
    "$SCRIPT_DIR/qa-guard-dualtrack.sh" "$CHANGE_ID"
else
    echo "⚠️  QA guard skipped."
fi

printf "▶ Archiving change %s\n" "$CHANGE_ID"
"$SCRIPT_DIR/archive-change.sh" "$CHANGE_ID"

printf "▶ Generating archive summary\n"
"$SCRIPT_DIR/generate-archive-summary.sh" "$CHANGE_ID"

printf "▶ Updating capability changelog(s)\n"
"$SCRIPT_DIR/generate-spec-changelog.sh" "$CHANGE_ID"

echo "✅ Release gate complete for $CHANGE_ID"
