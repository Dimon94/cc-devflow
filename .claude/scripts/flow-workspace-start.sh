#!/bin/bash
# [INPUT]: 依赖 .current-req 和 journal-*.md
# [OUTPUT]: 显示上下文恢复信息
# [POS]: scripts 的 workspace 启动脚本，被 /flow-workspace start 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKSPACE_DIR="$PROJECT_ROOT/devflow/workspace"
COMMON_SH="$SCRIPT_DIR/common.sh"

if [[ -f "$COMMON_SH" ]]; then
    source "$COMMON_SH"
fi

# ============================================================================
# Parse Arguments
# ============================================================================

usage() {
    cat << 'EOF'
Usage: flow-workspace-start.sh [REQ_ID|DEVELOPER] [OPTIONS]

Start a workspace session and recover context.

Arguments:
  REQ_ID               Optional requirement ID to activate (REQ-XXX / BUG-XXX)
  DEVELOPER            Optional developer name (legacy positional style)

Options:
  --developer NAME     Explicit developer name
  --req REQ_ID         Activate a specific requirement before recovery
  --switch             Show switch recommendation to the target worktree
  --cd                 Try to execute cd (effective only when script is sourced)
  --help, -h           Show help

Examples:
  flow-workspace-start.sh
  flow-workspace-start.sh REQ-123 --switch
  source flow-workspace-start.sh REQ-123 --switch --cd
EOF
}

DEVELOPER="${DEVFLOW_DEVELOPER:-$(whoami)}"
REQ_OVERRIDE=""
SHOW_SWITCH=false
DO_CD=false
POSITIONAL=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --developer)
            DEVELOPER="$2"
            shift 2
            ;;
        --req)
            REQ_OVERRIDE="$2"
            shift 2
            ;;
        --switch)
            SHOW_SWITCH=true
            shift
            ;;
        --cd)
            DO_CD=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage." >&2
            exit 1
            ;;
        *)
            POSITIONAL+=("$1")
            shift
            ;;
    esac
done

# Backward compatible positional parsing:
# - if token looks like REQ/BUG -> requirement override
# - else treat as developer
for token in "${POSITIONAL[@]}"; do
    if [[ "$token" =~ ^(REQ|BUG)-[0-9]+(-[0-9]+)?$ ]]; then
        REQ_OVERRIDE=$(echo "$token" | tr '[:lower:]' '[:upper:]')
    else
        DEVELOPER="$token"
    fi
done

DEV_WORKSPACE="$WORKSPACE_DIR/$DEVELOPER"

if [[ ! -d "$DEV_WORKSPACE" ]]; then
    echo "Workspace not found for $DEVELOPER"
    echo "Run '/flow-workspace init $DEVELOPER' first."
    exit 1
fi

# ============================================================================
# Main Logic
# ============================================================================

echo "🔄 Session Recovery for $DEVELOPER"
echo "=================================="
echo ""

if [[ -n "$REQ_OVERRIDE" ]]; then
    if declare -f validate_req_id >/dev/null 2>&1; then
        validate_req_id "$REQ_OVERRIDE" || exit 1
    fi
    echo "$REQ_OVERRIDE" > "$DEV_WORKSPACE/.current-req"
    echo "📌 Requirement override: $REQ_OVERRIDE"
fi

# Read current requirement
if [[ -f "$DEV_WORKSPACE/.current-req" ]]; then
    CURRENT_REQ=$(cat "$DEV_WORKSPACE/.current-req")
    echo "📋 Current Requirement: $CURRENT_REQ"

    # Resolve requirement/bug directory by ID prefix
    if [[ "$CURRENT_REQ" =~ ^BUG- ]]; then
        REQ_DIR="$PROJECT_ROOT/devflow/bugs/$CURRENT_REQ"
        STATUS_BASENAME="status.json"
    else
        REQ_DIR="$PROJECT_ROOT/devflow/requirements/$CURRENT_REQ"
        STATUS_BASENAME="orchestration_status.json"
    fi

    if [[ -d "$REQ_DIR" ]]; then
        # Read orchestration status
        STATUS_FILE="$REQ_DIR/$STATUS_BASENAME"
        if [[ -f "$STATUS_FILE" ]]; then
            STATUS=$(jq -r '.status' "$STATUS_FILE" 2>/dev/null || echo "unknown")
            echo "   Status: $STATUS"
        fi

        # Check TASKS.md for progress
        TASKS_FILE="$REQ_DIR/TASKS.md"
        if [[ -f "$TASKS_FILE" ]]; then
            TOTAL=$(grep -c '^\- \[' "$TASKS_FILE" 2>/dev/null || echo "0")
            DONE=$(grep -c '^\- \[x\]' "$TASKS_FILE" 2>/dev/null || echo "0")
            echo "   Tasks: $DONE/$TOTAL completed"
        fi

        # Show expected worktree path and whether current session matches.
        if declare -f get_worktree_dir_for_req >/dev/null 2>&1; then
            EXPECTED_WORKTREE=$(get_worktree_dir_for_req "$CURRENT_REQ" 2>/dev/null || echo "")
            CURRENT_GIT_ROOT=$(git -C "$PROJECT_ROOT" rev-parse --show-toplevel 2>/dev/null || echo "")

            if [[ -n "$EXPECTED_WORKTREE" ]]; then
                echo "   Expected Worktree: $EXPECTED_WORKTREE"
                if [[ -d "$EXPECTED_WORKTREE" ]]; then
                    if [[ "$CURRENT_GIT_ROOT" == "$EXPECTED_WORKTREE" ]]; then
                        echo "   Worktree Match: yes"
                    else
                        echo "   Worktree Match: no"
                        echo "   Action: cd $EXPECTED_WORKTREE"
                    fi
                else
                    echo "   Worktree Match: missing"
                fi

                if $SHOW_SWITCH; then
                    if [[ -d "$EXPECTED_WORKTREE" ]]; then
                        if $DO_CD; then
                            if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
                                cd "$EXPECTED_WORKTREE"
                                echo "   Auto Switched: yes ($PWD)"
                            else
                                echo "   Auto Switched: no (requires sourced execution)"
                                echo "   Run: source .claude/scripts/flow-workspace-start.sh $CURRENT_REQ --switch --cd"
                            fi
                        else
                            echo "   Switch Command: cd \"$EXPECTED_WORKTREE\""
                        fi
                    fi
                fi
            fi
        fi
    else
        echo "   ⚠️  Requirement directory not found"
    fi
else
    echo "📋 Current Requirement: None"
fi

echo ""

# Read latest journal entries
LATEST_JOURNAL=$(ls -1 "$DEV_WORKSPACE"/journal-*.md 2>/dev/null | sort -V | tail -1)

if [[ -n "$LATEST_JOURNAL" && -f "$LATEST_JOURNAL" ]]; then
    echo "📓 Latest Journal: $(basename "$LATEST_JOURNAL")"
    echo ""
    echo "Recent entries:"
    echo "---------------"

    # Show last 20 lines of journal (excluding frontmatter)
    tail -30 "$LATEST_JOURNAL" | head -20

    echo ""
    echo "---------------"
fi

echo ""
echo "Ready to continue. Use:"
echo "  /flow-workspace record \"message\"  - Record progress"
echo "  /flow-workspace switch REQ-XXX|BUG-XXX - Switch requirement"
