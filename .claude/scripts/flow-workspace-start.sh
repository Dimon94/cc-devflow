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

# ============================================================================
# Detect Developer
# ============================================================================

DEVELOPER="${1:-$(whoami)}"
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

# Read current requirement
if [[ -f "$DEV_WORKSPACE/.current-req" ]]; then
    CURRENT_REQ=$(cat "$DEV_WORKSPACE/.current-req")
    echo "📋 Current Requirement: $CURRENT_REQ"

    # Check if requirement directory exists
    REQ_DIR="$PROJECT_ROOT/devflow/requirements/$CURRENT_REQ"
    if [[ -d "$REQ_DIR" ]]; then
        # Read orchestration status
        STATUS_FILE="$REQ_DIR/orchestration_status.json"
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
echo "  /flow-workspace switch REQ-XXX    - Switch requirement"
