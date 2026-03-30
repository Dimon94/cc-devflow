#!/usr/bin/env bash
# =============================================================================
# Team Mode Initialization for flow-spec
# =============================================================================
# [INPUT]: 依赖 common.sh 的 Team 函数
# [OUTPUT]: 初始化 Team 状态，创建 spec-alignment-team
# [POS]: flow-spec/scripts/ 的 Team 初始化器
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
source "$REPO_ROOT/.claude/scripts/common.sh"
TEAM_CONFIG_FILE="$SCRIPT_DIR/../team-config.json"

# =============================================================================
# Mode Detection
# =============================================================================

# Detect whether to use Team or Subagent mode
# Args: $1 - skip_tech flag (true/false), $2 - skip_ui flag (true/false)
# Returns: "team" or "subagent"
detect_execution_mode() {
    local skip_tech="${1:-false}"
    local skip_ui="${2:-false}"

    # Team mode requires both tech and ui (Full Mode)
    # Subagent mode for simplified modes
    if [[ "$skip_tech" == "true" ]] || [[ "$skip_ui" == "true" ]]; then
        echo "subagent"
    else
        echo "team"
    fi
}

# =============================================================================
# Team Initialization
# =============================================================================

# Initialize spec-alignment-team
# Args: $1 - repo root, $2 - requirement ID
init_spec_team() {
    local repo_root="$1"
    local req_id="$2"
    local config_file="$TEAM_CONFIG_FILE"

    if [[ ! -f "$config_file" ]]; then
        echo "ERROR: Team config not found: $config_file" >&2
        return 1
    fi

    local team_name
    team_name=$(jq -r '.name // "spec-team"' "$config_file")
    local team_mode
    team_mode=$(jq -r '.mode // "parallel"' "$config_file")
    local team_lead
    team_lead=$(jq -r '.lead // "spec-lead"' "$config_file")

    echo "Initializing ${team_name} for $req_id..."

    # Initialize Team truth state and keep compatibility mirror in sync
    init_team_state "$repo_root" "$req_id" "$team_mode" "$team_lead"

    # Add teammates from canonical config
    while IFS='|' read -r teammate_id teammate_role; do
        [[ -n "$teammate_id" ]] || continue
        add_teammate "$repo_root" "$req_id" "$teammate_id" "$teammate_role"
    done < <(jq -r '.members[] | "\(.id)|\(.role)"' "$config_file")

    local teammate_count
    teammate_count=$(jq '.members | length' "$config_file")
    echo "Team initialized with ${teammate_count} teammates"
}

# =============================================================================
# Team Configuration
# =============================================================================

# Get team configuration as JSON
get_team_config() {
    cat "$TEAM_CONFIG_FILE"
}

# =============================================================================
# Main
# =============================================================================

main() {
    local action="${1:-detect}"

    case "$action" in
        detect)
            local skip_tech="${2:-false}"
            local skip_ui="${3:-false}"
            detect_execution_mode "$skip_tech" "$skip_ui"
            ;;
        init)
            local repo_root="${2:-$(get_repo_root)}"
            local req_id="${3:-$(get_current_req_id)}"
            init_spec_team "$repo_root" "$req_id"
            ;;
        config)
            get_team_config
            ;;
        *)
            echo "Usage: $0 {detect|init|config} [args...]" >&2
            echo "  detect [skip_tech] [skip_ui]  - Detect execution mode" >&2
            echo "  init [repo_root] [req_id]    - Initialize Team truth state" >&2
            echo "  config                        - Output Team config JSON" >&2
            exit 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
