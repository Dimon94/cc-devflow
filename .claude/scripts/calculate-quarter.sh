#!/usr/bin/env bash
# Calculate current quarter and planning horizon for roadmap planning
# Returns quarter info in KEY=VALUE format for use in core-roadmap command
# Usage: ./calculate-quarter.sh

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
# Quarter Calculation Functions (季度计算函数)
# =============================================================================

# Get current year
# Returns: 2025
get_current_year() {
    TZ='Asia/Shanghai' date '+%Y'
}

# Get current month (1-12)
# Returns: 1, 2, ..., 12
get_current_month() {
    TZ='Asia/Shanghai' date '+%-m'
}

# Get current day of month (1-31)
# Returns: 7, 15, 28, etc.
get_current_day() {
    TZ='Asia/Shanghai' date '+%-d'
}

# Calculate current quarter based on month
# Returns: Q1, Q2, Q3, Q4
get_current_quarter() {
    local month=$(get_current_month)

    if [[ $month -le 3 ]]; then
        echo "Q1"
    elif [[ $month -le 6 ]]; then
        echo "Q2"
    elif [[ $month -le 9 ]]; then
        echo "Q3"
    else
        echo "Q4"
    fi
}

# Calculate remaining days in current quarter
# Returns: integer (days)
calculate_remaining_days() {
    local year=$(get_current_year)
    local month=$(get_current_month)
    local day=$(get_current_day)

    # Get quarter end date
    local quarter=$(get_current_quarter)
    local end_month
    local end_day

    case $quarter in
        Q1) end_month=3; end_day=31 ;;
        Q2) end_month=6; end_day=30 ;;
        Q3) end_month=9; end_day=30 ;;
        Q4) end_month=12; end_day=31 ;;
    esac

    # Calculate days remaining using date arithmetic
    local current_date=$(TZ='Asia/Shanghai' date '+%Y-%m-%d')
    local end_date="$year-$(printf '%02d' $end_month)-$end_day"

    # Calculate difference in seconds and convert to days
    local current_seconds=$(TZ='Asia/Shanghai' date -j -f '%Y-%m-%d' "$current_date" '+%s' 2>/dev/null || date -d "$current_date" '+%s')
    local end_seconds=$(TZ='Asia/Shanghai' date -j -f '%Y-%m-%d' "$end_date" '+%s' 2>/dev/null || date -d "$end_date" '+%s')

    local remaining_seconds=$((end_seconds - current_seconds))
    local remaining_days=$((remaining_seconds / 86400))

    echo $remaining_days
}

# Get next N quarters
# Args: $1 = number of quarters (default: 3)
# Returns: comma-separated list (Q2,Q3,Q4 or Q2-2025,Q3-2025,Q4-2025,Q1-2026)
get_next_quarters() {
    local count=${1:-3}
    local current_quarter=$(get_current_quarter)
    local current_year=$(get_current_year)

    local quarters=("Q1" "Q2" "Q3" "Q4")
    local current_index=0

    # Find current quarter index
    for i in "${!quarters[@]}"; do
        if [[ "${quarters[$i]}" == "$current_quarter" ]]; then
            current_index=$i
            break
        fi
    done

    local next_quarters=()
    local year=$current_year

    for ((i=1; i<=$count; i++)); do
        local next_index=$(( (current_index + i) % 4 ))
        local next_quarter="${quarters[$next_index]}"

        # If next_index < current_index, we wrapped around (crossed year boundary)
        # OR if we've gone through a full year cycle (i > 4)
        if [[ $next_index -le $current_index ]] || [[ $i -gt 4 ]]; then
            # Calculate how many years we've crossed
            local years_crossed=$(( (current_index + i) / 4 ))
            year=$((current_year + years_crossed))
        else
            year=$current_year
        fi

        next_quarters+=("$next_quarter-$year")
    done

    # Join with commas
    local result=$(IFS=,; echo "${next_quarters[*]}")
    echo "$result"
}

# Get quarter start and end dates
# Args: $1 = quarter (Q1, Q2, Q3, Q4), $2 = year
# Returns: START_DATE=YYYY-MM-DD END_DATE=YYYY-MM-DD
get_quarter_dates() {
    local quarter=$1
    local year=$2

    local start_month end_month start_day end_day

    case $quarter in
        Q1) start_month=1; start_day=1; end_month=3; end_day=31 ;;
        Q2) start_month=4; start_day=1; end_month=6; end_day=30 ;;
        Q3) start_month=7; start_day=1; end_month=9; end_day=30 ;;
        Q4) start_month=10; start_day=1; end_month=12; end_day=31 ;;
    esac

    local start_date="$year-$(printf '%02d' $start_month)-$(printf '%02d' $start_day)"
    local end_date="$year-$(printf '%02d' $end_month)-$(printf '%02d' $end_day)"

    echo "START_DATE=$start_date"
    echo "END_DATE=$end_date"
}

# Calculate planning horizon description
# Returns: human-readable string (e.g., "Q1 2025 (remaining) + Q2, Q3, Q4 2025")
get_planning_horizon() {
    local current_quarter=$(get_current_quarter)
    local current_year=$(get_current_year)
    local next_quarters=$(get_next_quarters 3)

    # Remove year suffixes for cleaner display
    local next_display=$(echo "$next_quarters" | sed 's/-[0-9]\{4\}//g')

    echo "$current_quarter $current_year (remaining) + $next_display"
}

# =============================================================================
# Main Output (主输出函数)
# =============================================================================

main() {
    local current_year=$(get_current_year)
    local current_month=$(get_current_month)
    local current_day=$(get_current_day)
    local current_quarter=$(get_current_quarter)
    local remaining_days=$(calculate_remaining_days)
    local next_quarters=$(get_next_quarters 3)
    local planning_horizon=$(get_planning_horizon)

    # Get current quarter dates
    local quarter_dates=$(get_quarter_dates "$current_quarter" "$current_year")
    local start_date=$(echo "$quarter_dates" | grep START_DATE | cut -d= -f2)
    local end_date=$(echo "$quarter_dates" | grep END_DATE | cut -d= -f2)

    # Output in KEY=VALUE format for easy parsing
    cat <<EOF
CURRENT_YEAR=$current_year
CURRENT_MONTH=$current_month
CURRENT_DAY=$current_day
CURRENT_QUARTER=$current_quarter
QUARTER_START_DATE=$start_date
QUARTER_END_DATE=$end_date
REMAINING_DAYS=$remaining_days
NEXT_QUARTERS=$next_quarters
PLANNING_HORIZON=$planning_horizon
EOF
}

# =============================================================================
# Script Entry Point (脚本入口)
# =============================================================================

# Run main function
main
