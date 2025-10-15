#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

CHANGE_ID="${1:-}"

if [[ -z "$CHANGE_ID" ]]; then
    echo "Usage: generate-spec-changelog.sh <change-id>" >&2
    exit 1
fi

if ! validate_change_id "$CHANGE_ID" >/dev/null; then
    exit 1
fi

repo_root=$(get_repo_root)
if ! change_dir=$(locate_change_dir "$repo_root" "$CHANGE_ID"); then
    echo "ERROR: change directory not found (active or archived) for $CHANGE_ID" >&2
    exit 1
fi
delta_json="$change_dir/delta.json"

if [[ ! -f "$delta_json" ]]; then
    echo "ERROR: delta.json not found in $change_dir" >&2
    exit 1
fi

specs_root="$repo_root/devflow/specs"
mkdir -p "$specs_root"

timestamp=$(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S %Z')
iso_ts=$(TZ='Asia/Shanghai' date '+%Y-%m-%dT%H:%M:%S%z')

capabilities=()
while IFS= read -r cap; do
    [[ -z "$cap" ]] && continue
    capabilities+=("$cap")
done < <(jq -r '.capabilities[]?' "$delta_json" 2>/dev/null)

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    while IFS= read -r entry; do
        capabilities+=("$(basename "$entry")")
    done < <(find "$change_dir/specs" -mindepth 1 -maxdepth 1 -type d 2>/dev/null || true)
fi

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    echo "ERROR: No capabilities discovered for changelog generation" >&2
    exit 1
fi

related_requirements=$(jq -r '.relatedRequirements[]?' "$delta_json" 2>/dev/null | paste -sd ', ' - || echo "")

for capability in "${capabilities[@]}"; do
    spec_dir="$specs_root/$capability"
    changelog_file="$spec_dir/CHANGELOG.md"

    mkdir -p "$spec_dir"

    if [[ ! -f "$changelog_file" ]]; then
        cat > "$changelog_file" <<EOF
# Capability Changelog: $capability

EOF
    fi

    added=$(jq -r --arg cap "$capability" '.requirements.added[]? | select(.capability == $cap) | "- " + .name' "$delta_json" 2>/dev/null || true)
    modified=$(jq -r --arg cap "$capability" '.requirements.modified[]? | select(.capability == $cap) | "- " + .name' "$delta_json" 2>/dev/null || true)
    removed=$(jq -r --arg cap "$capability" '.requirements.removed[]? | select(.capability == $cap) | "- " + .name' "$delta_json" 2>/dev/null || true)
    renamed=$(jq -r --arg cap "$capability" '.requirements.renamed[]? | select(.capability == $cap) | "- " + (.from // "?") + " → " + (.to // "?")' "$delta_json" 2>/dev/null || true)

    {
        echo "## $iso_ts — $CHANGE_ID"
        if [[ -n "$related_requirements" ]]; then
            echo ""
            echo "Related Requirements: $related_requirements"
        fi
        echo ""
        echo "Added:"
        if [[ -n "$added" ]]; then
            echo "$added"
        else
            echo "_None_"
        fi
        echo ""
        echo "Modified:"
        if [[ -n "$modified" ]]; then
            echo "$modified"
        else
            echo "_None_"
        fi
        echo ""
        echo "Removed:"
        if [[ -n "$removed" ]]; then
            echo "$removed"
        else
            echo "_None_"
        fi
        echo ""
        echo "Renamed:"
        if [[ -n "$renamed" ]]; then
            echo "$renamed"
        else
            echo "_None_"
        fi
        echo ""
        echo "---"
        echo ""
    } >> "$changelog_file"

    echo "📝 Updated changelog for $capability ($changelog_file)"
done

exit 0
