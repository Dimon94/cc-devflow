#!/usr/bin/env bash
# =============================================================================
# Team Mode Initialization for flow-spec
# =============================================================================
# [INPUT]: 依赖 common.sh 的 Team 函数
# [OUTPUT]: 初始化 Team 状态，创建 spec-design-team
# [POS]: flow-spec/scripts/ 的 Team 初始化器
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
source "$REPO_ROOT/.claude/scripts/common.sh"

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

# Initialize spec-design-team
# Args: $1 - repo root, $2 - requirement ID
init_spec_team() {
    local repo_root="$1"
    local req_id="$2"

    echo "Initializing spec-design-team for $req_id..."

    # Initialize Team state in orchestration_status.json
    init_team_state "$repo_root" "$req_id" "parallel" "spec-lead"

    # Add teammates
    add_teammate "$repo_root" "$req_id" "prd-writer" "analyst"
    add_teammate "$repo_root" "$req_id" "tech-architect" "architect"
    add_teammate "$repo_root" "$req_id" "ui-designer" "designer"
    add_teammate "$repo_root" "$req_id" "planner" "planner"

    echo "Team initialized with 4 teammates"
}

# =============================================================================
# Team Configuration
# =============================================================================

# Get team configuration as JSON
get_team_config() {
    cat <<'EOF'
{
  "name": "spec-design-team",
  "description": "并行规格设计团队",
  "mode": "parallel",
  "lead": "spec-lead",
  "members": [
    {
      "id": "prd-writer",
      "role": "analyst",
      "agent_type": "prd-writer",
      "description": "PRD 生成，需求分析"
    },
    {
      "id": "tech-architect",
      "role": "architect",
      "agent_type": "tech-architect",
      "description": "技术设计，架构方案"
    },
    {
      "id": "ui-designer",
      "role": "designer",
      "agent_type": "ui-designer",
      "description": "UI 原型，交互设计"
    },
    {
      "id": "planner",
      "role": "planner",
      "agent_type": "planner",
      "description": "Epic 规划，任务分解"
    }
  ],
  "workflow": {
    "stages": [
      {
        "name": "PRD Generation",
        "agents": ["prd-writer"],
        "parallel": false,
        "outputs": ["PRD.md"]
      },
      {
        "name": "Design Parallel",
        "agents": ["tech-architect", "ui-designer"],
        "parallel": true,
        "outputs": ["TECH_DESIGN.md", "UI_PROTOTYPE.html"],
        "wait_for": ["PRD Generation"],
        "negotiate": {
          "enabled": true,
          "topics": ["api_format", "field_naming", "auth_strategy", "state_management"]
        }
      },
      {
        "name": "Epic Planning",
        "agents": ["planner"],
        "parallel": false,
        "outputs": ["EPIC.md", "TASKS.md"],
        "wait_for": ["Design Parallel"]
      }
    ]
  },
  "communication": {
    "protocol": "direct_message",
    "negotiate_topics": [
      {
        "id": "api_format",
        "description": "API 响应格式 (REST/GraphQL, JSON structure)",
        "participants": ["tech-architect", "ui-designer"]
      },
      {
        "id": "field_naming",
        "description": "数据字段命名规范",
        "participants": ["tech-architect", "ui-designer", "planner"]
      },
      {
        "id": "auth_strategy",
        "description": "认证策略 (JWT, Session, OAuth)",
        "participants": ["tech-architect", "ui-designer"]
      },
      {
        "id": "state_management",
        "description": "前端状态管理方案",
        "participants": ["tech-architect", "ui-designer"]
      },
      {
        "id": "component_granularity",
        "description": "组件粒度和任务拆分",
        "participants": ["ui-designer", "planner"]
      }
    ]
  }
}
EOF
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
            echo "  init [repo_root] [req_id]    - Initialize Team state" >&2
            echo "  config                        - Output Team config JSON" >&2
            exit 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
