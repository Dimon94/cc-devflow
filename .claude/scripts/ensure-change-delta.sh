#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
    cat <<'USAGE'
Usage: ensure-change-delta.sh <change-id> [--cap CAPABILITY ...]

Ensure that a change has delta spec scaffolding for the given capabilities.

Arguments:
  change-id            Dual-track change identifier (req-123-example)

Options:
  --cap <name>         Capability identifier (lowercase slug preferred).
                       Repeat option to register multiple capabilities.
  --help               Show this message.

If --cap is omitted, the script attempts to infer capabilities from delta.json
or existing specs/ subdirectories. When no capability can be determined, the
command exits with an error.
USAGE
}

CHANGE_ID=""
declare -a REQUESTED_CAPS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cap)
            if [[ $# -lt 2 ]]; then
                echo "ERROR: --cap requires an argument" >&2
                usage
                exit 1
            fi
            REQUESTED_CAPS+=("$2")
            shift 2
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
    echo "ERROR: change directory not found: $change_dir" >&2
    exit 1
fi

delta_json="$change_dir/delta.json"

if [[ ! -f "$delta_json" ]]; then
    echo "ERROR: delta.json not found in $change_dir" >&2
    exit 1
fi

specs_root="$change_dir/specs"
mkdir -p "$specs_root"

declare -a capabilities=()

if [[ "${#REQUESTED_CAPS[@]}" -gt 0 ]]; then
    capabilities=("${REQUESTED_CAPS[@]}")
fi

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    inferred_from_delta=$(jq -r '.capabilities[]?' "$delta_json" 2>/dev/null || true)
    if [[ -n "$inferred_from_delta" ]]; then
        while IFS= read -r cap; do
            [[ -z "$cap" ]] && continue
            capabilities+=("$cap")
        done <<<"$inferred_from_delta"
    fi
fi

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    while IFS= read -r dir; do
        [[ -z "$dir" ]] && continue
        capabilities+=("$(basename "$dir")")
    done < <(find "$specs_root" -mindepth 1 -maxdepth 1 -type d 2>/dev/null || true)
fi

if [[ "${#capabilities[@]}" -eq 0 ]]; then
    echo "ERROR: No capabilities provided or inferred. Use --cap to specify at least one capability." >&2
    exit 1
fi

unique_caps=()
for cap in "${capabilities[@]}"; do
    slug=$(slugify "$cap")
    if [[ -z "$slug" ]]; then
        echo "ERROR: capability name '$cap' normalised to empty slug" >&2
        exit 1
    fi
    skip=false
    for existing in "${unique_caps[@]-}"; do
        if [[ "$existing" == "$slug" ]]; then
            skip=true
            break
        fi
    done
    if ! $skip; then
        unique_caps+=("$slug")
    fi
done

created_specs=()
updated_caps=()

for cap in "${unique_caps[@]-}"; do
    cap_dir="$specs_root/$cap"
    spec_file="$cap_dir/spec.md"
    mkdir -p "$cap_dir"
    if [[ ! -f "$spec_file" ]]; then
        cat >"$spec_file" <<EOF
# Capability Delta: $cap

## ADDED Requirements

## MODIFIED Requirements

## REMOVED Requirements

## RENAMED Requirements
EOF
        created_specs+=("$cap")
    fi
    updated_caps+=("$cap")
done

python3 - "$delta_json" "${updated_caps[@]}" <<'PY'
import json
import sys
from pathlib import Path

delta_path = Path(sys.argv[1])
caps = sys.argv[2:]

data = json.loads(delta_path.read_text(encoding="utf-8"))
capabilities = set(data.get("capabilities") or [])

changed = False
for cap in caps:
    if cap not in capabilities:
        capabilities.add(cap)
        changed = True

if changed:
    data["capabilities"] = sorted(capabilities)
    delta_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

"$SCRIPT_DIR/parse-delta.sh" "$CHANGE_ID" >/dev/null

if [[ "${#created_specs[@]}" -gt 0 ]]; then
    printf '✅ Created spec scaffolds for: %s\n' "$(printf '%s ' "${created_specs[@]}")"
else
    printf 'ℹ️  Spec scaffolds already present for requested capabilities.\n'
fi

printf '✅ Delta capabilities registered: %s\n' "$(printf '%s ' "${updated_caps[@]}")"
