#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

CHANGE_ID="${1:-}"

if [[ -z "$CHANGE_ID" ]]; then
    echo "Usage: rollback-archive.sh <change-id>" >&2
    exit 1
fi

if ! validate_change_id "$CHANGE_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
delta_json=""
if change_dir=$(locate_change_dir "$repo_root" "$CHANGE_ID"); then
    delta_json="$change_dir/delta.json"
fi
specs_root="$repo_root/devflow/specs"

capabilities=()

if [[ -f "$delta_json" ]]; then
    while IFS= read -r cap; do
        [[ -z "$cap" ]] && continue
        capabilities+=("$cap")
    done < <(jq -r '.capabilities[]?' "$delta_json" 2>/dev/null)
fi

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    while IFS= read -r snapshot; do
        capability=$(basename "$(dirname "$snapshot")")
        capabilities+=("$capability")
    done < <(find "$specs_root" -path "*history/*-$CHANGE_ID.md" -type f 2>/dev/null || true)
fi

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    echo "ERROR: No capability history entries found for $CHANGE_ID" >&2
    exit 1
fi

restored=0

for capability in "${capabilities[@]}"; do
    history_dir="$specs_root/$capability/history"
    target_spec="$specs_root/$capability/spec.md"

    if [[ ! -d "$history_dir" ]]; then
        echo "⚠️  History directory missing for capability '$capability', skipping"
        continue
    fi

    latest_snapshot=$(ls -t "$history_dir"/[0-9]*-"$CHANGE_ID".md 2>/dev/null | head -n1 || true)

    if [[ -z "$latest_snapshot" ]]; then
        echo "⚠️  No snapshot matching $CHANGE_ID for capability '$capability'"
        continue
    fi

    mkdir -p "$(dirname "$target_spec")"
    cp "$latest_snapshot" "$target_spec"
    echo "✅ Restored $capability from $(basename "$latest_snapshot")"
    restored=$((restored + 1))
done

if [[ "$restored" -eq 0 ]]; then
    echo "ERROR: No capability specs restored for $CHANGE_ID" >&2
    exit 1
fi

req_id=""
if [[ -f "$delta_json" ]]; then
    req_id=$(jq -r '(.relatedRequirements[0] // empty)' "$delta_json" 2>/dev/null || true)
fi

if [[ -n "$req_id" ]]; then
    log_event "$req_id" "Rolled back archive for change $CHANGE_ID"
fi

echo "🔁 Rollback complete for $CHANGE_ID"

exit 0
