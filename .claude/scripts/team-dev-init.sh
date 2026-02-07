#!/usr/bin/env bash
# =============================================================================
# Team Mode Initialization for flow-dev
# =============================================================================
# [INPUT]: 依赖 common.sh 的 Team 函数, parse-task-dependencies.js
# [OUTPUT]: 初始化 dev-team 状态，分析任务并行性
# [POS]: flow-dev 的 Team 初始化器，被 /flow:dev --team 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# =============================================================================
# Constants
# =============================================================================

DEFAULT_AGENTS=3
MAX_AGENTS=5
MIN_AGENTS=2

# =============================================================================
# Team Initialization
# =============================================================================

# Initialize dev-team for parallel task execution
# Args: $1 - repo root, $2 - requirement ID, $3 - number of agents
init_dev_team() {
    local repo_root="$1"
    local req_id="$2"
    local num_agents="${3:-$DEFAULT_AGENTS}"

    # Validate agent count
    if [[ "$num_agents" -lt "$MIN_AGENTS" ]]; then
        num_agents=$MIN_AGENTS
    elif [[ "$num_agents" -gt "$MAX_AGENTS" ]]; then
        num_agents=$MAX_AGENTS
    fi

    echo "Initializing dev-team for $req_id with $num_agents agents..."

    # Initialize Team state in orchestration_status.json
    init_team_state "$repo_root" "$req_id" "parallel" "dev-lead"

    # Add developer teammates
    for i in $(seq 1 "$num_agents"); do
        add_teammate "$repo_root" "$req_id" "dev-$i" "developer"
    done

    echo "Team initialized with $num_agents developer agents"
}

# =============================================================================
# Task Analysis
# =============================================================================

# Analyze TASKS.md and return parallel execution plan
# Args: $1 - repo root, $2 - requirement ID
analyze_tasks() {
    local repo_root="$1"
    local req_id="$2"
    local tasks_file="$repo_root/devflow/requirements/$req_id/TASKS.md"

    if [[ ! -f "$tasks_file" ]]; then
        echo '{"error": "TASKS.md not found", "tasks": [], "parallelGroups": []}' >&2
        return 1
    fi

    # Use parse-task-dependencies.js to analyze tasks
    node "$SCRIPT_DIR/parse-task-dependencies.js" parse "$tasks_file"
}

# Get next available tasks for parallel execution
# Args: $1 - repo root, $2 - requirement ID
get_next_tasks() {
    local repo_root="$1"
    local req_id="$2"
    local tasks_file="$repo_root/devflow/requirements/$req_id/TASKS.md"

    if [[ ! -f "$tasks_file" ]]; then
        echo '[]'
        return 0
    fi

    node "$SCRIPT_DIR/parse-task-dependencies.js" next "$tasks_file"
}

# Get parallel groups for current phase
# Args: $1 - repo root, $2 - requirement ID
get_parallel_groups() {
    local repo_root="$1"
    local req_id="$2"
    local tasks_file="$repo_root/devflow/requirements/$req_id/TASKS.md"

    if [[ ! -f "$tasks_file" ]]; then
        echo '[]'
        return 0
    fi

    node "$SCRIPT_DIR/parse-task-dependencies.js" groups "$tasks_file"
}

# =============================================================================
# Conflict Detection
# =============================================================================

# Check for file conflicts in parallel tasks
# Args: $1 - repo root, $2 - requirement ID
check_conflicts() {
    local repo_root="$1"
    local req_id="$2"

    local tasks
    tasks=$(get_next_tasks "$repo_root" "$req_id")

    # Format for conflict detection script
    echo "{\"tasks\": $tasks}" | "$SCRIPT_DIR/detect-file-conflicts.sh"
}

# =============================================================================
# Task Assignment
# =============================================================================

# Assign tasks to teammates based on parallel groups and conflicts
# Args: $1 - repo root, $2 - requirement ID, $3 - number of agents
assign_tasks() {
    local repo_root="$1"
    local req_id="$2"
    local num_agents="${3:-$DEFAULT_AGENTS}"

    local next_tasks
    next_tasks=$(get_next_tasks "$repo_root" "$req_id")

    local task_count
    task_count=$(echo "$next_tasks" | jq 'length')

    if [[ "$task_count" -eq 0 ]]; then
        echo '{"assignments": [], "message": "No pending tasks"}'
        return 0
    fi

    # Check for conflicts
    local conflicts
    conflicts=$(echo "{\"tasks\": $next_tasks}" | "$SCRIPT_DIR/detect-file-conflicts.sh")

    local has_conflicts
    has_conflicts=$(echo "$conflicts" | jq '.hasConflicts')

    # Build assignment plan
    local assignments='[]'

    if [[ "$has_conflicts" == "true" ]]; then
        # Handle conflicts: assign conflicting tasks to same agent
        local conflict_groups
        conflict_groups=$(echo "$conflicts" | jq '.conflicts')

        # Assign conflict groups to agents
        local agent_idx=1
        assignments=$(echo "$conflict_groups" | jq --argjson numAgents "$num_agents" '
            to_entries | map({
                agent: "dev-\((.key % $numAgents) + 1)",
                tasks: .value.tasks,
                reason: "File conflict - must run sequentially"
            })
        ')

        # Assign safe tasks to remaining agents
        local safe_tasks
        safe_tasks=$(echo "$conflicts" | jq '.safeGroups[0].tasks // []')

        if [[ $(echo "$safe_tasks" | jq 'length') -gt 0 ]]; then
            local safe_assignments
            safe_assignments=$(echo "$safe_tasks" | jq --argjson numAgents "$num_agents" '
                to_entries | map({
                    agent: "dev-\((.key % $numAgents) + 1)",
                    tasks: [.value],
                    reason: "No conflicts"
                })
            ')
            assignments=$(echo "$assignments $safe_assignments" | jq -s 'add')
        fi
    else
        # No conflicts: distribute tasks evenly
        assignments=$(echo "$next_tasks" | jq --argjson numAgents "$num_agents" '
            to_entries | map({
                agent: "dev-\((.key % $numAgents) + 1)",
                tasks: [.value.id],
                reason: "Round-robin assignment"
            })
        ')
    fi

    # Group by agent
    local grouped
    grouped=$(echo "$assignments" | jq '
        group_by(.agent) | map({
            agent: .[0].agent,
            tasks: [.[].tasks[]] | unique,
            reasons: [.[].reason] | unique
        })
    ')

    echo "{\"assignments\": $grouped, \"hasConflicts\": $has_conflicts}"
}

# =============================================================================
# Team Configuration
# =============================================================================

# Get dev-team configuration as JSON
get_team_config() {
    local num_agents="${1:-$DEFAULT_AGENTS}"

    local members='[]'
    for i in $(seq 1 "$num_agents"); do
        members=$(echo "$members" | jq --arg id "dev-$i" --arg idx "$i" '
            . + [{
                id: $id,
                role: "developer",
                agent_type: "dev-implementer",
                description: "Developer agent \($idx)"
            }]
        ')
    done

    jq -n --argjson members "$members" --argjson numAgents "$num_agents" '{
        name: "dev-team",
        version: "1.0.0",
        description: "并行开发团队 - 多 Agent 并行执行任务",
        mode: "parallel",
        lead: "dev-lead",
        members: $members,
        workflow: {
            strategy: "phase_based",
            conflict_resolution: "same_agent",
            max_parallel: $numAgents
        },
        quality_gates: {
            entry: {
                required_files: ["TASKS.md", "TECH_DESIGN.md", "quickstart.md"],
                status_check: ["epic_complete", "development_in_progress"]
            },
            exit: {
                all_tasks_complete: true,
                tests_pass: true,
                status_update: "development_complete"
            }
        }
    }'
}

# =============================================================================
# Main
# =============================================================================

main() {
    local action="${1:-help}"

    case "$action" in
        init)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            local num_agents="${4:-$DEFAULT_AGENTS}"
            init_dev_team "$repo_root" "$req_id" "$num_agents"
            ;;
        analyze)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            analyze_tasks "$repo_root" "$req_id"
            ;;
        next)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            get_next_tasks "$repo_root" "$req_id"
            ;;
        groups)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            get_parallel_groups "$repo_root" "$req_id"
            ;;
        conflicts)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            check_conflicts "$repo_root" "$req_id"
            ;;
        assign)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            local num_agents="${4:-$DEFAULT_AGENTS}"
            assign_tasks "$repo_root" "$req_id" "$num_agents"
            ;;
        config)
            local num_agents="${2:-$DEFAULT_AGENTS}"
            get_team_config "$num_agents"
            ;;
        help|*)
            echo "Usage: $0 <action> [args...]"
            echo ""
            echo "Actions:"
            echo "  init [repo_root] [req_id] [num_agents]  - Initialize dev-team"
            echo "  analyze [repo_root] [req_id]            - Analyze TASKS.md"
            echo "  next [repo_root] [req_id]               - Get next available tasks"
            echo "  groups [repo_root] [req_id]             - Get parallel groups"
            echo "  conflicts [repo_root] [req_id]          - Check file conflicts"
            echo "  assign [repo_root] [req_id] [num_agents] - Assign tasks to agents"
            echo "  config [num_agents]                      - Output team config JSON"
            echo ""
            echo "Defaults:"
            echo "  num_agents: $DEFAULT_AGENTS (min: $MIN_AGENTS, max: $MAX_AGENTS)"
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
