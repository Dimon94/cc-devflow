#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

FORCE=false

usage() {
    cat <<'USAGE'
Usage: migrate-existing-requirement.sh <REQ-ID> [--force]

Bootstrap dual-track change scaffolding for an existing requirement.

Options:
  --force   Recreate managed files even if they already exist
  --help    Show this message
USAGE
}

REQ_ID=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --force)
            FORCE=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            else
                echo "ERROR: unexpected argument: $1" >&2
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: requirement ID is required" >&2
    usage
    exit 1
fi

if ! validate_req_id "$REQ_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
req_dir=$(get_req_dir "$repo_root" "$REQ_ID")

if [[ ! -d "$req_dir" ]]; then
    echo "ERROR: requirement directory not found: $req_dir" >&2
    exit 1
fi

status_file="$req_dir/orchestration_status.json"
if [[ ! -f "$status_file" ]]; then
    echo "ERROR: orchestration_status.json missing for $REQ_ID" >&2
    exit 1
fi

existing_change_id=$(jq -r '.change_id // empty' "$status_file" 2>/dev/null || true)

if [[ -n "$existing_change_id" && "$existing_change_id" != "null" && "$FORCE" == false ]]; then
    echo "⏭️  Requirement already linked to change: $existing_change_id"
    exit 0
fi

title=$(jq -r '.title // empty' "$status_file" 2>/dev/null || true)

echo "🚀 Migrating $REQ_ID to dual-track architecture..."

output_json=$(mktemp)
bootstrap_args=(--req-id "$REQ_ID" --json --output-json "$output_json")

if [[ -n "$title" && "$title" != "null" ]]; then
    bootstrap_args+=(--title "$title")
fi

if $FORCE; then
    bootstrap_args+=(--force)
fi

if ! "$SCRIPT_DIR/bootstrap-devflow-dualtrack.sh" "${bootstrap_args[@]}"; then
    echo "ERROR: bootstrap failed" >&2
    rm -f "$output_json"
    exit 1
fi

change_id=$(jq -r '.changeId // .change_id // empty' "$output_json" 2>/dev/null || true)
change_dir=$(jq -r '.changeDir // .change_dir // empty' "$output_json" 2>/dev/null || true)
rm -f "$output_json"

if [[ -z "$change_id" ]]; then
    echo "ERROR: bootstrap did not return a changeId" >&2
    exit 1
fi

if ! validate_change_id "$change_id" >/dev/null; then
    exit 1
fi

tmp_status=$(mktemp)
jq --arg change_id "$change_id" \
   --arg updated "$(get_beijing_time_iso)" \
   '.change_id = $change_id | .updatedAt = $updated' \
   "$status_file" > "$tmp_status"
mv "$tmp_status" "$status_file"

log_event "$REQ_ID" "Migrated to dual-track change: $change_id"

echo ""
echo "✅ Migration completed"
echo "Requirement: $REQ_ID"
echo "Change ID:   $change_id"
if [[ -n "$change_dir" && "$change_dir" != "null" ]]; then
    echo "Change Dir:  $change_dir"
fi
echo ""
echo "Next Steps:"
echo "  - Review devflow/changes/$change_id/proposal.md"
echo "  - Populate specs/ and tasks.md for pending work"
echo ""

exit 0
