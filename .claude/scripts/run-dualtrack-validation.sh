#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

CHANGE_ID=""
STRICT=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --strict)
            STRICT=true
            shift
            ;;
        --help|-h)
            cat <<'USAGE'
Usage: run-dualtrack-validation.sh <change-id> [--strict]

Validate delta, tasks, and constitution tracking for the specified change.
USAGE
            exit 0
            ;;
        *)
            if [[ -z "$CHANGE_ID" ]]; then
                CHANGE_ID="$1"
            else
                echo "ERROR: unexpected argument: $1" >&2
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$CHANGE_ID" ]]; then
    echo "Usage: run-dualtrack-validation.sh <change-id> [--strict]" >&2
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
tasks_md="$change_dir/tasks.md"
constitution_json="$change_dir/constitution.json"
progress_json="$change_dir/task-progress.json"

errors=()
warnings=()

if [[ ! -f "$delta_json" ]]; then
    errors+=("delta.json not found")
else
    if ! jq -e '.requirements' "$delta_json" >/dev/null 2>&1; then
        errors+=("delta.json missing requirements field")
    else
        req_count=$(jq '[.requirements.added[], .requirements.modified[]] | length' "$delta_json" 2>/dev/null || echo 0)
        if [[ "$req_count" -eq 0 ]]; then
            warnings+=("delta.json has no added/modified requirements")
        fi
    fi
fi

if [[ ! -f "$tasks_md" ]]; then
    errors+=("tasks.md not found")
else
    if grep -q '{{' "$tasks_md"; then
        warnings+=("tasks.md contains placeholders '{{...}}'")
    fi
fi

if [[ -f "$tasks_md" ]]; then
    calc_total=$(grep -E '^[*-]\s+\[[ xX]\]' "$tasks_md" | wc -l | tr -d ' ')
    calc_completed=$(grep -E '^[*-]\s+\[[xX]\]' "$tasks_md" | wc -l | tr -d ' ')
    if [[ -f "$progress_json" ]]; then
        stored_total=$(jq -r '.total // 0' "$progress_json" 2>/dev/null || echo 0)
        stored_completed=$(jq -r '.completed // 0' "$progress_json" 2>/dev/null || echo 0)
        if [[ "$stored_total" -ne "$calc_total" || "$stored_completed" -ne "$calc_completed" ]]; then
            warnings+=("task-progress.json out of sync ($stored_completed/$stored_total vs $calc_completed/$calc_total)")
        fi
    else
        warnings+=("task-progress.json not found")
    fi
fi

infos=()

if [[ -f "$constitution_json" ]]; then
    constitution_args=("$CHANGE_ID")
    if $STRICT; then
        constitution_args+=(--strict)
    fi

    if constitution_output=$("$SCRIPT_DIR/validate-constitution-tracking.sh" "${constitution_args[@]}" 2>&1); then
        if [[ "$constitution_output" == ⚠️* ]]; then
            clean_output=${constitution_output#⚠️ }
            clean_output=${clean_output# }
            warnings+=("$clean_output")
        else
            infos+=("$constitution_output")
        fi
    else
        errors+=("constitution validation failed: $constitution_output")
    fi
else
    warnings+=("constitution.json not found")
fi

req_id=""
if [[ -f "$delta_json" ]]; then
    req_id=$(jq -r '(.relatedRequirements[0] // empty)' "$delta_json" 2>/dev/null || echo "")
fi

report() {
    local prefix="$1"
    shift
    for msg in "$@"; do
        echo "$prefix $msg"
    done
}

if [[ ${#infos[@]} -gt 0 ]]; then
    report "ℹ️" "${infos[@]}"
fi

if [[ ${#warnings[@]} -gt 0 ]]; then
    report "⚠️" "${warnings[@]}"
    if [[ ${#errors[@]} -eq 0 && -n "$req_id" ]]; then
        log_event "$req_id" "⚠️ Delta validation warnings (change: $CHANGE_ID)"
    fi
fi

if [[ ${#errors[@]} -gt 0 ]]; then
    report "❌" "${errors[@]}"
    if [[ -n "$req_id" ]]; then
        log_event "$req_id" "❌ Delta validation failed (change: $CHANGE_ID, strict=$STRICT)"
    fi
    if $STRICT; then
        exit 1
    fi
else
    if [[ -n "$req_id" && ${#warnings[@]} -eq 0 ]]; then
        log_event "$req_id" "✅ Delta validation passed (change: $CHANGE_ID)"
    fi
fi

exit 0
