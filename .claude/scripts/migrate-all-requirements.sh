#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
    cat <<'USAGE'
Usage: migrate-all-requirements.sh [--force]

Iterate all requirements under devflow/requirements and ensure dual-track scaffolding exists.

Options:
  --force   Re-bootstrap even if change_id already present
  --help    Show this message
USAGE
}

FORCE=false

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
            echo "ERROR: unexpected argument: $1" >&2
            usage
            exit 1
            ;;
    esac
done

repo_root=$(get_repo_root)
requirements_dir="$repo_root/devflow/requirements"

if [[ ! -d "$requirements_dir" ]]; then
    echo "No requirements directory found at $requirements_dir"
    exit 0
fi

shopt -s nullglob
found=0

for req_path in "$requirements_dir"/REQ-* "$requirements_dir"/BUG-*; do
    [[ ! -d "$req_path" ]] && continue
    req_id=$(basename "$req_path")
    status_file="$req_path/orchestration_status.json"

    if [[ -f "$status_file" && $FORCE == false ]]; then
        change_id=$(jq -r '.change_id // empty' "$status_file" 2>/dev/null || true)
        if [[ -n "$change_id" && "$change_id" != "null" ]]; then
            echo "⏭️  $req_id already migrated ($change_id)"
            continue
        fi
    fi

    echo "➡️  Migrating $req_id..."
    args=("$req_id")
    if $FORCE; then
        args+=(--force)
    fi
    if ! "$SCRIPT_DIR/migrate-existing-requirement.sh" "${args[@]}"; then
        echo "⚠️  Migration failed for $req_id" >&2
    fi
    found=$((found + 1))
done

if [[ "$found" -eq 0 ]]; then
    echo "No requirements matched REQ-* or BUG-* under $requirements_dir"
else
    echo "✅ Migration sweep complete ($found processed)"
fi

exit 0
