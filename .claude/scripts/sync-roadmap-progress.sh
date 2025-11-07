#!/usr/bin/env bash
# Sync roadmap progress from requirements orchestration_status.json
# Updates devflow/ROADMAP.md Implementation Tracking table with:
# - Mapped REQ-IDs when requirements are created
# - Current status from orchestration_status
# - Progress percentage based on completed phases
# Usage: ./sync-roadmap-progress.sh

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

# Calculate progress percentage based on completed phases
# Args: $1 = path to orchestration_status.json
# Returns: integer percentage (0-100)
calculate_progress() {
    local status_file="$1"

    if [[ ! -f "$status_file" ]]; then
        echo "0"
        return
    fi

    # Read JSON and extract completion flags
    local json=$(cat "$status_file")

    # Phase completion weights (total = 100%)
    # phase0 (research): 10%
    # prd: 10%
    # ui: 5%
    # tech_design: 10%
    # epic: 10%
    # dev: 30%
    # qa: 15%
    # release: 10%
    # merged: bonus completion

    local progress=0

    # Check each phase completion
    if echo "$json" | grep -q '"phase0_complete".*:.*true'; then
        progress=$((progress + 10))
    fi

    if echo "$json" | grep -q '"prd_complete".*:.*true'; then
        progress=$((progress + 10))
    fi

    if echo "$json" | grep -q '"ui_complete".*:.*true'; then
        progress=$((progress + 5))
    fi

    if echo "$json" | grep -q '"tech_design_complete".*:.*true'; then
        progress=$((progress + 10))
    fi

    if echo "$json" | grep -q '"epic_complete".*:.*true'; then
        progress=$((progress + 10))
    fi

    if echo "$json" | grep -q '"dev_complete".*:.*true'; then
        progress=$((progress + 30))
    fi

    if echo "$json" | grep -q '"qa_complete".*:.*true'; then
        progress=$((progress + 15))
    fi

    if echo "$json" | grep -q '"release_complete".*:.*true'; then
        progress=$((progress + 10))
    fi

    # If merged, consider 100%
    if echo "$json" | grep -q '"status".*:.*"merged"'; then
        progress=100
    fi

    echo "$progress"
}

# Get status from orchestration_status.json
# Args: $1 = path to orchestration_status.json
# Returns: status string
get_status() {
    local status_file="$1"

    if [[ ! -f "$status_file" ]]; then
        echo "Planned"
        return
    fi

    local json=$(cat "$status_file")
    local status=$(echo "$json" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

    # Map orchestration status to roadmap status
    case "$status" in
        "initialized"|"planning")
            echo "Planned"
            ;;
        "in_progress"|"development")
            echo "In Progress"
            ;;
        "merged"|"complete")
            echo "Completed"
            ;;
        "blocked")
            echo "Blocked"
            ;;
        "cancelled")
            echo "Cancelled"
            ;;
        *)
            echo "Planned"
            ;;
    esac
}

# Get requirement title from orchestration_status.json
# Args: $1 = path to orchestration_status.json
# Returns: title string
get_title() {
    local status_file="$1"

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

            local title=$(get_title "$status_file")
            local status=$(get_status "$status_file")
            local progress=$(calculate_progress "$status_file")

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
            # Find the line and update Status and Progress columns

            # Use sed to update the line
            # Match pattern: | RM-XXX | ... | ... | OLD_STATUS | REQ-XXX | OLD_PROGRESS |
            # Replace with: | RM-XXX | ... | ... | NEW_STATUS | REQ-XXX | NEW_PROGRESS% |

            sed -i.bak -E "/\\| $rm_id \\|/s/\\| [^|]+ \\| $req_id \\| [^|]+ \\|/| $status | $req_id | ${progress}% |/g" "$temp_file"
        else
            # Check if there's an RM-ID row with "-" as Mapped REQ that matches derived_from
            # This is a new requirement that should be linked

            # Try to find RM-ID row with "Derived From" matching this REQ-ID and Mapped REQ = "-"
            local potential_rm=$(grep -E "\\| RM-[0-9]+ \\|.*\\| $req_id \\|.*\\| - \\|" "$temp_file" | grep -o "RM-[0-9]*" | head -1)

            if [[ -n "$potential_rm" ]]; then
                # Update this RM-ID row to link to this REQ-ID
                sed -i.bak -E "/\\| $potential_rm \\|/s/\\| [^|]+ \\| - \\| [^|]+ \\|/| $status | $req_id | ${progress}% |/g" "$temp_file"
            fi
        fi
    done <<< "$req_data"

    # Replace original file with updated version
    mv "$temp_file" "$roadmap_file"

    # Clean up backup file
    # 修复: sed -i.bak 对 temp_file 操作会创建 temp_file.bak，而不是 roadmap_file.bak
    rm -f "${temp_file}.bak"

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
        echo "Please run /flow-roadmap to create a roadmap first."
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
