#!/bin/bash
# [INPUT]: 依赖 deltas/ 目录
# [OUTPUT]: 列出所有 delta specs
# [POS]: scripts 的 delta spec 列表脚本，被 /flow:delta list 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-delta-list.sh <REQ-ID>

List all delta specs for a requirement.

Arguments:
    REQ-ID          Requirement ID (e.g., REQ-123)

Examples:
    flow-delta-list.sh REQ-123
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID="$1"

if [[ -z "$REQ_ID" ]]; then
    # Try to auto-detect from environment or branch
    REQ_ID="${DEVFLOW_REQ_ID:-}"
    if [[ -z "$REQ_ID" ]]; then
        BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
        REQ_ID=$(echo "$BRANCH" | grep -oE 'REQ-[0-9]+' | head -1 || echo "")
    fi
fi

if [[ -z "$REQ_ID" ]]; then
    echo "Error: REQ-ID is required"
    usage
fi

# Validate REQ-ID format
if [[ ! "$REQ_ID" =~ ^REQ-[0-9]+$ ]]; then
    echo "Error: Invalid REQ-ID format. Expected: REQ-XXX"
    exit 1
fi

# ============================================================================
# Main Logic
# ============================================================================

REQ_DIR="$PROJECT_ROOT/devflow/requirements/$REQ_ID"
DELTAS_DIR="$REQ_DIR/deltas"

if [[ ! -d "$REQ_DIR" ]]; then
    echo "Error: Requirement directory not found: $REQ_DIR"
    exit 1
fi

if [[ ! -d "$DELTAS_DIR" ]]; then
    echo "No deltas found for $REQ_ID"
    exit 0
fi

echo "Deltas for $REQ_ID:"
echo ""

COUNT=0
DRAFT_COUNT=0
REVIEW_COUNT=0
APPROVED_COUNT=0
APPLIED_COUNT=0

# List all delta directories
for delta_dir in "$DELTAS_DIR"/*/; do
    if [[ ! -d "$delta_dir" ]]; then
        continue
    fi

    DELTA_ID=$(basename "$delta_dir")
    DELTA_FILE="$delta_dir/delta.md"

    if [[ ! -f "$DELTA_FILE" ]]; then
        continue
    fi

    ((COUNT++))

    # Extract status and title from frontmatter
    STATUS="unknown"
    TITLE=""

    while IFS= read -r line; do
        if [[ "$line" =~ ^status:[[:space:]]*\"?([^\"]+)\"? ]]; then
            STATUS="${BASH_REMATCH[1]}"
        elif [[ "$line" =~ ^title:[[:space:]]*\"?([^\"]+)\"? ]]; then
            TITLE="${BASH_REMATCH[1]}"
        fi
    done < <(head -20 "$DELTA_FILE")

    # Count by status
    case "$STATUS" in
        draft) ((DRAFT_COUNT++)) ;;
        review) ((REVIEW_COUNT++)) ;;
        approved) ((APPROVED_COUNT++)) ;;
        applied) ((APPLIED_COUNT++)) ;;
    esac

    # Format status with padding
    STATUS_PADDED=$(printf "%-10s" "[$STATUS]")

    printf "  %2d. %-25s %s  %s\n" "$COUNT" "$DELTA_ID" "$STATUS_PADDED" "$TITLE"
done

echo ""
echo "Total: $COUNT deltas"

# Show breakdown if there are deltas
if [[ $COUNT -gt 0 ]]; then
    BREAKDOWN=""
    [[ $DRAFT_COUNT -gt 0 ]] && BREAKDOWN="$DRAFT_COUNT draft"
    [[ $REVIEW_COUNT -gt 0 ]] && BREAKDOWN="${BREAKDOWN:+$BREAKDOWN, }$REVIEW_COUNT review"
    [[ $APPROVED_COUNT -gt 0 ]] && BREAKDOWN="${BREAKDOWN:+$BREAKDOWN, }$APPROVED_COUNT approved"
    [[ $APPLIED_COUNT -gt 0 ]] && BREAKDOWN="${BREAKDOWN:+$BREAKDOWN, }$APPLIED_COUNT applied"

    if [[ -n "$BREAKDOWN" ]]; then
        echo "  ($BREAKDOWN)"
    fi
fi
