#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false

usage() {
    cat <<'USAGE'
Usage: generate-dualtrack-metrics.sh [--json]

Collect repo-wide dual-track adoption metrics (coverage, delta completeness, archive count, conflicts).

Options:
  --json    Output metrics in JSON format
  --help    Show this message
USAGE
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            JSON_MODE=true
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
changes_dir="$repo_root/devflow/changes"
specs_dir="$repo_root/devflow/specs"

timestamp=$(date -Iseconds)

count_requirements() {
    local total=0
    local with_change=0

    if [[ -d "$requirements_dir" ]]; then
        while IFS= read -r status_file; do
            [[ -z "$status_file" ]] && continue
            total=$((total + 1))
            local change
            change=$(jq -r '.change_id // empty' "$status_file" 2>/dev/null || echo "")
            if [[ -n "$change" && "$change" != "null" ]]; then
                with_change=$((with_change + 1))
            fi
        done < <(find "$requirements_dir" -name "orchestration_status.json" -type f 2>/dev/null)
    fi

    echo "$total,$with_change"
}

count_changes() {
    local total=0
    local complete=0

    if [[ -d "$changes_dir" ]]; then
        while IFS= read -r delta_file; do
            [[ -z "$delta_file" ]] && continue
            total=$((total + 1))
            if jq -e '.requirements and ((.requirements.added // []) + (.requirements.modified // []) + (.requirements.removed // []) + (.requirements.renamed // []) | length > 0)' "$delta_file" >/dev/null 2>&1; then
                complete=$((complete + 1))
            fi
        done < <(find "$changes_dir" -type f -name "delta.json" 2>/dev/null)
    fi

    echo "$total,$complete"
}

count_archives() {
    local archived=0

    if [[ -d "$specs_dir" ]]; then
        while IFS= read -r history_dir; do
            [[ -z "$history_dir" ]] && continue
            archived=$((archived + 1))
        done < <(find "$specs_dir" -mindepth 2 -maxdepth 2 -type d -name "history" 2>/dev/null)
    fi

    echo "$archived"
}

read_requirements=$(count_requirements)
total_reqs=${read_requirements%%,*}
dualtrack_reqs=${read_requirements##*,}

read_changes=$(count_changes)
total_changes=${read_changes%%,*}
complete_changes=${read_changes##*,}

archived_count=$(count_archives)
conflict_count=$(bash "$SCRIPT_DIR/check-dualtrack-conflicts.sh" --all --count-only 2>/dev/null || echo "0")

coverage_percent=0
if [[ "$total_reqs" -gt 0 ]]; then
    coverage_percent=$((dualtrack_reqs * 100 / total_reqs))
fi

delta_percent=0
if [[ "$total_changes" -gt 0 ]]; then
    delta_percent=$((complete_changes * 100 / total_changes))
fi

if $JSON_MODE; then
    cat <<JSON
{
  "generatedAt": "$timestamp",
  "requirements": {
    "total": $total_reqs,
    "dualtrack": $dualtrack_reqs,
    "coveragePercent": $coverage_percent
  },
  "changes": {
    "total": $total_changes,
    "complete": $complete_changes,
    "completenessPercent": $delta_percent
  },
  "archives": {
    "capabilitiesWithHistory": $archived_count
  },
  "conflicts": {
    "detected": $conflict_count
  }
}
JSON
else
    echo "DevFlow 双轨架构度量报告"
    echo "生成时间: $timestamp"
    echo ""
    echo "双轨覆盖率: $dualtrack_reqs / $total_reqs (${coverage_percent}%)"
    echo "Delta 完整率: $complete_changes / $total_changes (${delta_percent}%)"
    echo "已归档 Capability 数: $archived_count"
    echo "检测到的冲突数: $conflict_count"
fi
