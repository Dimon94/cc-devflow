#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 common.sh 的 harness/resume-index helper，扫描 requirements 与 roadmap 文档。
# [OUTPUT]: 更新 ROADMAP.md 中的 Implementation Tracking 表，优先反映 harness 主线进度。
# [POS]: roadmap 的进度同步器，把 requirement 运行时状态折叠成路线图上的执行概览。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

# =============================================================================
# 获取当前脚本所在目录
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common functions
if [[ -f "$SCRIPT_DIR/common.sh" ]]; then
    source "$SCRIPT_DIR/common.sh"
fi

# =============================================================================
# Progress Calculation Functions (进度计算函数)
# =============================================================================

# Calculate progress percentage from current runtime state
# Args: $1 = repo root, $2 = req id, $3 = fallback orchestration_status path
# Returns: integer percentage (0-100)
calculate_progress() {
    local repo_root="$1"
    local req_id="$2"
    local status_file="$3"

    local harness_file
    harness_file=$(get_harness_state_file "$repo_root" "$req_id")

    if [[ -f "$harness_file" ]]; then
        local snapshot
        snapshot=$(get_harness_snapshot "$repo_root" "$req_id")
        local raw_stage
        raw_stage=$(echo "$snapshot" | jq -r '.lifecycle.stage // "unknown"' 2>/dev/null || echo "unknown")
        if has_resume_index "$repo_root" "$req_id"; then
            raw_stage=$(read_resume_index_stage "$repo_root" "$req_id" || echo "$raw_stage")
        fi

        local phase
        phase=$(normalize_mainline_stage "$raw_stage")
        local progress
        progress=$(get_mainline_stage_progress "$phase")

        local tasks_total tasks_completed
        tasks_total=$(echo "$snapshot" | jq -r '.progress.totalTasks // 0' 2>/dev/null || echo "0")
        tasks_completed=$(echo "$snapshot" | jq -r '.progress.completedTasks // 0' 2>/dev/null || echo "0")

        if [[ "$tasks_total" -gt 0 && "$phase" == "dev" ]]; then
            progress=$((30 + (tasks_completed * 40 / tasks_total)))
        elif [[ "$tasks_total" -gt 0 && "$phase" == "verify" ]]; then
            progress=$((80 + (tasks_completed * 10 / tasks_total)))
        fi

        echo "$progress"
        return
    fi

    if [[ ! -f "$status_file" ]]; then
        echo "0"
        return
    fi

    local json
    json=$(cat "$status_file")
    local status phase raw_phase
    status=$(echo "$json" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
    raw_phase=$(echo "$json" | jq -r '.phase // ""' 2>/dev/null || echo "")
    if [[ -z "$raw_phase" || "$raw_phase" == "null" || "$raw_phase" == "unknown" ]]; then
        raw_phase="$status"
    fi
    phase=$(normalize_mainline_stage "$raw_phase")

    case "$phase" in
        init|spec|dev|verify|prepare-pr|release)
            echo "$(get_mainline_stage_progress "$phase")"
            ;;
        *)
            local progress=0
            if echo "$json" | grep -q '"phase0_complete".*:.*true'; then progress=$((progress + 10)); fi
            if echo "$json" | grep -q '"prd_complete".*:.*true'; then progress=$((progress + 10)); fi
            if echo "$json" | grep -q '"ui_complete".*:.*true'; then progress=$((progress + 5)); fi
            if echo "$json" | grep -q '"tech_design_complete".*:.*true'; then progress=$((progress + 10)); fi
            if echo "$json" | grep -q '"epic_complete".*:.*true'; then progress=$((progress + 10)); fi
            if echo "$json" | grep -q '"dev_complete".*:.*true'; then progress=$((progress + 30)); fi
            if echo "$json" | grep -q '"qa_complete".*:.*true'; then progress=$((progress + 15)); fi
            if echo "$json" | grep -q '"release_complete".*:.*true'; then progress=$((progress + 10)); fi
            if echo "$json" | grep -q '"status".*:.*"merged"'; then progress=100; fi
            echo "$progress"
            ;;
    esac
}

# Get roadmap status from current runtime state
# Args: $1 = repo root, $2 = req id, $3 = fallback orchestration_status path
# Returns: status string
get_status() {
    local repo_root="$1"
    local req_id="$2"
    local status_file="$3"

    local harness_file
    harness_file=$(get_harness_state_file "$repo_root" "$req_id")

    if [[ -f "$harness_file" ]]; then
        local snapshot
        snapshot=$(get_harness_snapshot "$repo_root" "$req_id")
        local lifecycle_status
        lifecycle_status=$(echo "$snapshot" | jq -r '.lifecycle.status // "unknown"' 2>/dev/null || echo "unknown")
        local raw_stage
        raw_stage=$(echo "$snapshot" | jq -r '.lifecycle.stage // "unknown"' 2>/dev/null || echo "unknown")
        if has_resume_index "$repo_root" "$req_id"; then
            raw_stage=$(read_resume_index_stage "$repo_root" "$req_id" || echo "$raw_stage")
        fi
        local phase
        phase=$(normalize_mainline_stage "$raw_stage")

        case "$phase" in
            release)
                echo "Completed"
                ;;
            init|spec)
                echo "Planned"
                ;;
            *)
                echo "In Progress"
                ;;
        esac
        return
    fi

    if [[ ! -f "$status_file" ]]; then
        echo "Planned"
        return
    fi

    local json
    json=$(cat "$status_file")
    local status raw_phase phase
    status=$(echo "$json" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    raw_phase=$(echo "$json" | jq -r '.phase // ""' 2>/dev/null || echo "")
    if [[ -z "$raw_phase" || "$raw_phase" == "null" || "$raw_phase" == "unknown" ]]; then
        raw_phase="$status"
    fi
    phase=$(normalize_mainline_stage "$raw_phase")

    case "$status" in
        "blocked")
            echo "Blocked"
            return
            ;;
        "cancelled")
            echo "Cancelled"
            return
            ;;
    esac

    case "$phase" in
        init|spec)
            echo "Planned"
            ;;
        dev|verify|prepare-pr)
            echo "In Progress"
            ;;
        release)
            echo "Completed"
            ;;
        *)
            echo "Planned"
            ;;
    esac
}

# Get requirement title from current runtime state
# Args: $1 = repo root, $2 = req id, $3 = fallback orchestration_status path
# Returns: title string
get_title() {
    local repo_root="$1"
    local req_id="$2"
    local status_file="$3"

    local harness_file
    harness_file=$(get_harness_state_file "$repo_root" "$req_id")

    if [[ -f "$harness_file" ]]; then
        local title
        title=$(jq -r '.goal // ""' "$harness_file" 2>/dev/null)
        if [[ -n "$title" && "$title" != "null" ]]; then
            echo "$title"
            return
        fi
    fi

    if [[ ! -f "$status_file" ]]; then
        echo "-"
        return
    fi

    local json=$(cat "$status_file")
    local title=$(echo "$json" | grep -o '"title"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

    if [[ -z "$title" ]]; then
        echo "-"
    else
        echo "$title"
    fi
}

# =============================================================================
# Roadmap Update Functions (路线图更新函数)
# =============================================================================

rewrite_tracking_row() {
    local file="$1"
    local rm_id="$2"
    local status="$3"
    local req_id="$4"
    local progress="$5"
    local temp_file="${file}.rewrite"

    awk -F'|' -v OFS='|' -v rm="$rm_id" -v new_status="$status" -v new_req="$req_id" -v new_progress="${progress}%" '
        {
            line = $0
            if ($0 ~ "\\| " rm " \\|") {
                $6 = " " new_status " "
                $7 = " " new_req " "
                $8 = " " new_progress " "
                line = $1 OFS $2 OFS $3 OFS $4 OFS $5 OFS $6 OFS $7 OFS $8 OFS $9 OFS $10
            }
            print line
        }
    ' "$file" > "$temp_file"

    mv "$temp_file" "$file"
}

# Scan all requirements and build progress map
# Returns: associative array of REQ-ID -> progress data
scan_requirements() {
    local repo_root=$(get_repo_root)
    local requirements_dir="$repo_root/devflow/requirements"

    if [[ ! -d "$requirements_dir" ]]; then
        echo "ERROR: Requirements directory not found: $requirements_dir" >&2
        return 1
    fi

    # Output format: REQ-ID|Title|Status|Progress
    for req_dir in "$requirements_dir"/REQ-*; do
        if [[ -d "$req_dir" ]]; then
            local req_id=$(basename "$req_dir")
            local status_file="$req_dir/orchestration_status.json"

            local title
            title=$(get_title "$repo_root" "$req_id" "$status_file")
            local status
            status=$(get_status "$repo_root" "$req_id" "$status_file")
            local progress
            progress=$(calculate_progress "$repo_root" "$req_id" "$status_file")

            echo "$req_id|$title|$status|$progress"
        fi
    done
}

# Update ROADMAP.md Implementation Tracking table
# Args: $1 = path to ROADMAP.md
update_roadmap() {
    local roadmap_file="$1"

    if [[ ! -f "$roadmap_file" ]]; then
        echo "ERROR: ROADMAP.md not found: $roadmap_file" >&2
        return 1
    fi

    # Create temporary file for updated roadmap
    local temp_file="${roadmap_file}.tmp"
    cp "$roadmap_file" "$temp_file"

    # Get all requirement progress data
    local req_data=$(scan_requirements)

    # For each requirement, try to find corresponding RM-ID in roadmap
    # and update the table row

    while IFS='|' read -r req_id title status progress; do
        # Look for this REQ-ID in the Implementation Tracking table
        # Format: | RM-XXX | Feature | Derived From | Status | Mapped REQ | Progress |

        # Find if this REQ-ID is already mapped to an RM-ID
        local rm_id=$(grep -E "\\| RM-[0-9]+ \\|.*\\| $req_id \\|" "$temp_file" | grep -o "RM-[0-9]*" | head -1)

        if [[ -n "$rm_id" ]]; then
            # Update existing mapping
            rewrite_tracking_row "$temp_file" "$rm_id" "$status" "$req_id" "$progress"
        else
            # Check if there's an RM-ID row with "-" as Mapped REQ that matches derived_from
            # This is a new requirement that should be linked

            # Try to find RM-ID row with "Derived From" matching this REQ-ID and Mapped REQ = "-"
            local potential_rm=$(grep -E "\\| RM-[0-9]+ \\|.*\\| $req_id \\|.*\\| - \\|" "$temp_file" | grep -o "RM-[0-9]*" | head -1)

            if [[ -n "$potential_rm" ]]; then
                # Update this RM-ID row to link to this REQ-ID
                rewrite_tracking_row "$temp_file" "$potential_rm" "$status" "$req_id" "$progress"
            fi
        fi
    done <<< "$req_data"

    # Replace original file with updated version
    mv "$temp_file" "$roadmap_file"

    echo "✅ Updated ROADMAP.md Implementation Tracking table"
}

# =============================================================================
# Main Function (主函数)
# =============================================================================

main() {
    local repo_root=$(get_repo_root)
    local roadmap_file="$repo_root/devflow/ROADMAP.md"

    echo "==================================================================="
    echo "Syncing Roadmap Progress"
    echo "==================================================================="
    echo ""

    # Check if ROADMAP.md exists
    if [[ ! -f "$roadmap_file" ]]; then
        echo "⚠️  ROADMAP.md not found at: $roadmap_file"
        echo ""
        echo "Please run /core:roadmap to create a roadmap first."
        exit 0
    fi

    echo "📊 Scanning requirements for progress data..."
    echo ""

    # Display current requirements
    local req_data=$(scan_requirements)

    if [[ -z "$req_data" ]]; then
        echo "⚠️  No requirements found in devflow/requirements/"
        exit 0
    fi

    echo "Found requirements:"
    echo ""
    printf "%-12s %-50s %-15s %-10s\n" "REQ-ID" "Title" "Status" "Progress"
    echo "------------------------------------------------------------------------------------"

    while IFS='|' read -r req_id title status progress; do
        printf "%-12s %-50s %-15s %-10s\n" "$req_id" "$title" "$status" "${progress}%"
    done <<< "$req_data"

    echo ""
    echo "📝 Updating ROADMAP.md..."
    echo ""

    # Update roadmap
    update_roadmap "$roadmap_file"

    echo ""
    echo "✅ Roadmap sync completed!"
    echo ""
    echo "Updated: $roadmap_file"
}

# =============================================================================
# Script Entry Point (脚本入口)
# =============================================================================

# Run main function
main "$@"
