#!/usr/bin/env bash
# =============================================================================
# Team State Recovery Script
# =============================================================================
# [INPUT]: 依赖 common.sh 的 Team 函数
# [OUTPUT]: 恢复 Team 状态，支持断点续传
# [POS]: flow-dev 的状态恢复器，被 /flow:dev --resume 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# =============================================================================
# State Recovery Functions
# =============================================================================

# Check if Team state can be recovered
# Args: $1 - repo root, $2 - requirement ID
can_recover_state() {
    local repo_root="$1"
    local req_id="$2"
    local status_file="$repo_root/devflow/requirements/$req_id/orchestration_status.json"

    if [[ ! -f "$status_file" ]]; then
        echo "false"
        return 0
    fi

    local team_mode
    team_mode=$(jq -r '.team.mode // "none"' "$status_file")

    if [[ "$team_mode" == "none" || "$team_mode" == "null" ]]; then
        echo "false"
        return 0
    fi

    echo "true"
}

# Get recovery summary
# Args: $1 - repo root, $2 - requirement ID
get_recovery_summary() {
    local repo_root="$1"
    local req_id="$2"
    local status_file="$repo_root/devflow/requirements/$req_id/orchestration_status.json"

    if [[ ! -f "$status_file" ]]; then
        echo '{"canRecover": false, "reason": "Status file not found"}'
        return 0
    fi

    local team_data
    team_data=$(jq '{
        canRecover: (.team.mode != null and .team.mode != "none"),
        mode: .team.mode,
        lead: .team.lead,
        teammateCount: (.team.teammates | length),
        completedTasks: [.team.teammates[].completedTasks | length] | add,
        pendingTasks: (.team.taskAssignments | keys | length),
        lastActiveAt: ([.team.teammates[].lastActiveAt] | max),
        ralphLoop: {
            globalIteration: .ralphLoop.globalIteration,
            maxIterations: .ralphLoop.maxIterations
        }
    }' "$status_file")

    echo "$team_data"
}

# Recover Team state
# Args: $1 - repo root, $2 - requirement ID
recover_state() {
    local repo_root="$1"
    local req_id="$2"
    local status_file="$repo_root/devflow/requirements/$req_id/orchestration_status.json"

    echo "Recovering Team state for $req_id..."

    # Reset teammate statuses to idle
    local updated
    updated=$(jq '
        .team.teammates = [.team.teammates[] | .status = "idle" | .currentTask = null]
    ' "$status_file")

    echo "$updated" > "$status_file"

    # Get pending tasks
    local pending_tasks
    pending_tasks=$(get_unassigned_tasks "$repo_root" "$req_id")

    echo "Recovery complete."
    echo "Pending tasks: $pending_tasks"
}

# Create state snapshot
# Args: $1 - repo root, $2 - requirement ID
create_snapshot() {
    local repo_root="$1"
    local req_id="$2"
    local status_file="$repo_root/devflow/requirements/$req_id/orchestration_status.json"
    local snapshot_dir="$repo_root/devflow/requirements/$req_id/.snapshots"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)

    mkdir -p "$snapshot_dir"

    if [[ -f "$status_file" ]]; then
        cp "$status_file" "$snapshot_dir/orchestration_status_$timestamp.json"
        echo "Snapshot created: $snapshot_dir/orchestration_status_$timestamp.json"
    else
        echo "No status file to snapshot"
    fi
}

# Restore from snapshot
# Args: $1 - repo root, $2 - requirement ID, $3 - snapshot timestamp (optional)
restore_snapshot() {
    local repo_root="$1"
    local req_id="$2"
    local timestamp="${3:-}"
    local status_file="$repo_root/devflow/requirements/$req_id/orchestration_status.json"
    local snapshot_dir="$repo_root/devflow/requirements/$req_id/.snapshots"

    if [[ -z "$timestamp" ]]; then
        # Get latest snapshot
        local latest
        latest=$(ls -t "$snapshot_dir"/orchestration_status_*.json 2>/dev/null | head -1)
        if [[ -z "$latest" ]]; then
            echo "No snapshots found"
            return 1
        fi
        cp "$latest" "$status_file"
        echo "Restored from: $latest"
    else
        local snapshot_file="$snapshot_dir/orchestration_status_$timestamp.json"
        if [[ -f "$snapshot_file" ]]; then
            cp "$snapshot_file" "$status_file"
            echo "Restored from: $snapshot_file"
        else
            echo "Snapshot not found: $snapshot_file"
            return 1
        fi
    fi
}

# List available snapshots
# Args: $1 - repo root, $2 - requirement ID
list_snapshots() {
    local repo_root="$1"
    local req_id="$2"
    local snapshot_dir="$repo_root/devflow/requirements/$req_id/.snapshots"

    if [[ ! -d "$snapshot_dir" ]]; then
        echo "[]"
        return 0
    fi

    local snapshots='[]'
    for file in "$snapshot_dir"/orchestration_status_*.json; do
        if [[ -f "$file" ]]; then
            local timestamp
            timestamp=$(basename "$file" | sed 's/orchestration_status_//' | sed 's/.json//')
            snapshots=$(echo "$snapshots" | jq --arg ts "$timestamp" '. + [$ts]')
        fi
    done

    echo "$snapshots"
}

# =============================================================================
# Main
# =============================================================================

main() {
    local action="${1:-help}"

    case "$action" in
        check)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            can_recover_state "$repo_root" "$req_id"
            ;;
        summary)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            get_recovery_summary "$repo_root" "$req_id"
            ;;
        recover)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            recover_state "$repo_root" "$req_id"
            ;;
        snapshot)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            create_snapshot "$repo_root" "$req_id"
            ;;
        restore)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            local timestamp="${4:-}"
            restore_snapshot "$repo_root" "$req_id" "$timestamp"
            ;;
        list-snapshots)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            list_snapshots "$repo_root" "$req_id"
            ;;
        help|*)
            echo "Usage: $0 <action> [args...]"
            echo ""
            echo "Actions:"
            echo "  check [repo_root] [req_id]              - Check if state can be recovered"
            echo "  summary [repo_root] [req_id]            - Get recovery summary"
            echo "  recover [repo_root] [req_id]            - Recover Team state"
            echo "  snapshot [repo_root] [req_id]           - Create state snapshot"
            echo "  restore [repo_root] [req_id] [timestamp] - Restore from snapshot"
            echo "  list-snapshots [repo_root] [req_id]     - List available snapshots"
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
