#!/usr/bin/env bash
# Locate a requirement's position in the roadmap
# Given a REQ-ID, finds its corresponding RM-ID, milestone, quarter, and cluster
# Usage: ./locate-requirement-in-roadmap.sh [REQ-ID]
#   If REQ-ID not provided, uses current requirement from branch/environment

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
# Roadmap Parsing Functions (路线图解析函数)
# =============================================================================

# Find RM-ID for a given REQ-ID in ROADMAP.md
# Args: $1 = ROADMAP.md path, $2 = REQ-ID
# Returns: RM-ID or empty string
find_rm_id() {
    local roadmap_file="$1"
    local req_id="$2"

    if [[ ! -f "$roadmap_file" ]]; then
        return 1
    fi

    # Search Implementation Tracking table for REQ-ID
    # Format: | RM-XXX | Feature | Derived From | Status | REQ-XXX | Progress |
    local rm_id=$(grep -E "\\| (RM-[0-9]+) \\|.*\\| $req_id \\|" "$roadmap_file" | \
                  grep -o "RM-[0-9]*" | head -1)

    echo "$rm_id"
}

# Find feature name for RM-ID
# Args: $1 = ROADMAP.md path, $2 = RM-ID
# Returns: Feature name
find_feature_name() {
    local roadmap_file="$1"
    local rm_id="$2"

    if [[ ! -f "$roadmap_file" ]]; then
        return 1
    fi

    # Search Implementation Tracking table
    # Format: | RM-XXX | Feature | ... |
    local feature=$(grep -E "\\| $rm_id \\|" "$roadmap_file" | \
                    sed -E 's/.*\| [^|]+ \| ([^|]+) \|.*/\1/' | \
                    sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
                    head -1)

    echo "$feature"
}

# Find milestone and quarter for RM-ID
# Args: $1 = ROADMAP.md path, $2 = RM-ID
# Returns: Milestone|Quarter|Cluster format
find_milestone_info() {
    local roadmap_file="$1"
    local rm_id="$2"

    if [[ ! -f "$roadmap_file" ]]; then
        return 1
    fi

    # Search for RM-ID in quarterly sections
    # Pattern: **RM-XXX**: Title (Source)
    # First find which section it's in by looking backwards for headers

    local line_number=$(grep -n "\\*\\*$rm_id\\*\\*:" "$roadmap_file" | cut -d: -f1 | head -1)

    if [[ -z "$line_number" ]]; then
        echo "Unknown|Unknown|Unknown"
        return
    fi

    # Get all lines from start to this line
    local context=$(head -n "$line_number" "$roadmap_file")

    # Find last Quarter section header (e.g., "## Q4 2025 Milestones")
    local quarter=$(echo "$context" | grep -E "^## Q[0-9]+ [0-9]+ Milestones" | tail -1 | \
                   sed -E 's/^## (Q[0-9]+ [0-9]+) Milestones/\1/')

    # Find last Milestone header (e.g., "### M1-Q4-2025: Milestone Name")
    local milestone=$(echo "$context" | grep -E "^### (M[0-9]+-Q[0-9]+-[0-9]+):" | tail -1 | \
                     sed -E 's/^### ([^:]+):.*/\1/')

    # Find last Feature Cluster header (e.g., "**Feature Cluster 1: Cluster Name**")
    local cluster=$(echo "$context" | grep -E "^\*\*Feature Cluster [0-9]+: " | tail -1 | \
                   sed -E 's/^\*\*Feature Cluster [0-9]+: ([^*]+)\*\*/\1/')

    echo "${milestone:-Unknown}|${quarter:-Unknown}|${cluster:-Unknown}"
}

# Get derived_from for RM-ID
# Args: $1 = ROADMAP.md path, $2 = RM-ID
# Returns: Derived From value
find_derived_from() {
    local roadmap_file="$1"
    local rm_id="$2"

    if [[ ! -f "$roadmap_file" ]]; then
        return 1
    fi

    # Search Implementation Tracking table
    # Format: | RM-XXX | Feature | Derived From | ... |
    local derived=$(grep -E "\\| $rm_id \\|" "$roadmap_file" | \
                   awk -F'|' '{print $4}' | \
                   sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
                   head -1)

    echo "$derived"
}

# =============================================================================
# Display Functions (显示函数)
# =============================================================================

# Display requirement location information
# Args: $1 = REQ-ID, $2 = RM-ID, $3 = Feature, $4 = Milestone, $5 = Quarter, $6 = Cluster, $7 = Derived
display_location() {
    local req_id="$1"
    local rm_id="$2"
    local feature="$3"
    local milestone="$4"
    local quarter="$5"
    local cluster="$6"
    local derived="$7"

    echo "==================================================================="
    echo "Requirement Location in Roadmap"
    echo "==================================================================="
    echo ""
    echo "📋 Requirement:    $req_id"
    echo "🎯 Roadmap Item:   $rm_id"
    echo "📝 Feature:        $feature"
    echo "📌 Derived From:   $derived"
    echo ""
    echo "📅 Timeline:"
    echo "   Quarter:        $quarter"
    echo "   Milestone:      $milestone"
    echo "   Cluster:        $cluster"
    echo ""
    echo "==================================================================="
}

# =============================================================================
# Main Function (主函数)
# =============================================================================

main() {
    local req_id="${1:-}"

    # If no REQ-ID provided, try to get from current context
    if [[ -z "$req_id" ]]; then
        req_id=$(get_current_req_id)
        if [[ -z "$req_id" ]]; then
            echo "ERROR: No REQ-ID provided and cannot determine current requirement" >&2
            echo "Usage: $0 [REQ-ID]" >&2
            exit 1
        fi
        echo "Using current requirement: $req_id"
        echo ""
    fi

    # Validate REQ-ID format
    if ! validate_req_id "$req_id"; then
        exit 1
    fi

    # Get repo root and roadmap path
    local repo_root=$(get_repo_root)
    local roadmap_file="$repo_root/devflow/ROADMAP.md"

    # Check if ROADMAP.md exists
    if [[ ! -f "$roadmap_file" ]]; then
        echo "⚠️  ROADMAP.md not found at: $roadmap_file" >&2
        echo "" >&2
        echo "Please run /flow-roadmap to create a roadmap first." >&2
        exit 1
    fi

    # Find RM-ID for this REQ-ID
    local rm_id=$(find_rm_id "$roadmap_file" "$req_id")

    if [[ -z "$rm_id" ]]; then
        echo "⚠️  Requirement $req_id not found in roadmap" >&2
        echo "" >&2
        echo "This requirement may be:" >&2
        echo "  - Not yet added to the roadmap" >&2
        echo "  - An ad-hoc requirement outside the roadmap" >&2
        echo "  - Created before the roadmap was established" >&2
        echo "" >&2
        echo "You can:" >&2
        echo "  1. Run /flow-roadmap to regenerate the roadmap" >&2
        echo "  2. Manually add this requirement to ROADMAP.md" >&2
        exit 1
    fi

    # Get feature name
    local feature=$(find_feature_name "$roadmap_file" "$rm_id")

    # Get milestone info
    local milestone_info=$(find_milestone_info "$roadmap_file" "$rm_id")
    local milestone=$(echo "$milestone_info" | cut -d'|' -f1)
    local quarter=$(echo "$milestone_info" | cut -d'|' -f2)
    local cluster=$(echo "$milestone_info" | cut -d'|' -f3)

    # Get derived_from
    local derived=$(find_derived_from "$roadmap_file" "$rm_id")

    # Display results
    display_location "$req_id" "$rm_id" "$feature" "$milestone" "$quarter" "$cluster" "$derived"

    # Return success
    exit 0
}

# =============================================================================
# Script Entry Point (脚本入口)
# =============================================================================

# Run main function
main "$@"
