#!/bin/bash
# [INPUT]: 依赖 delta-specs/{module}/spec.md
# [OUTPUT]: 显示所有增量变更
# [POS]: scripts 的 delta spec diff 脚本，被 /flow-delta diff 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID="${1:-}"

# Auto-detect REQ-ID
if [[ -z "$REQ_ID" ]]; then
    REQ_ID="${DEVFLOW_REQ_ID:-}"
fi

if [[ -z "$REQ_ID" ]]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    REQ_ID=$(echo "$BRANCH" | grep -oE 'REQ-[0-9]+' | head -1 || echo "")
fi

if [[ -z "$REQ_ID" ]]; then
    echo "Error: Could not detect REQ-ID"
    echo "Usage: flow-delta-diff.sh [REQ-ID]"
    exit 1
fi

# ============================================================================
# Main Logic
# ============================================================================

REQ_DIR="$PROJECT_ROOT/devflow/requirements/$REQ_ID"
DELTA_DIR="$REQ_DIR/delta-specs"

if [[ ! -d "$DELTA_DIR" ]]; then
    echo "No delta-specs found for $REQ_ID"
    exit 0
fi

echo "Delta Specs for $REQ_ID:"
echo "========================"
echo ""

TOTAL_ADDED=0
TOTAL_MODIFIED=0
TOTAL_REMOVED=0

# Process each module's delta spec
for module_dir in "$DELTA_DIR"/*/; do
    if [[ ! -d "$module_dir" ]]; then
        continue
    fi

    MODULE=$(basename "$module_dir")
    SPEC_FILE="$module_dir/spec.md"

    if [[ ! -f "$SPEC_FILE" ]]; then
        continue
    fi

    echo "📁 $MODULE/spec.md:"

    # Extract sections (simple parsing)
    IN_ADDED=false
    IN_MODIFIED=false
    IN_REMOVED=false

    while IFS= read -r line; do
        if [[ "$line" =~ ^###[[:space:]]+ADDED ]]; then
            IN_ADDED=true
            IN_MODIFIED=false
            IN_REMOVED=false
            echo "  ADDED:"
            continue
        elif [[ "$line" =~ ^###[[:space:]]+MODIFIED ]]; then
            IN_ADDED=false
            IN_MODIFIED=true
            IN_REMOVED=false
            echo "  MODIFIED:"
            continue
        elif [[ "$line" =~ ^###[[:space:]]+REMOVED ]]; then
            IN_ADDED=false
            IN_MODIFIED=false
            IN_REMOVED=true
            echo "  REMOVED:"
            continue
        elif [[ "$line" =~ ^### ]] || [[ "$line" =~ ^## ]] || [[ "$line" =~ ^# ]]; then
            IN_ADDED=false
            IN_MODIFIED=false
            IN_REMOVED=false
            continue
        fi

        # Print content lines (skip empty and comment lines)
        if [[ -n "$line" ]] && [[ ! "$line" =~ ^[[:space:]]*$ ]] && [[ ! "$line" =~ ^\<\!-- ]]; then
            if $IN_ADDED; then
                echo "    + $line"
                ((TOTAL_ADDED++))
            elif $IN_MODIFIED; then
                echo "    ~ $line"
                ((TOTAL_MODIFIED++))
            elif $IN_REMOVED; then
                echo "    - $line"
                ((TOTAL_REMOVED++))
            fi
        fi
    done < "$SPEC_FILE"

    echo ""
done

echo "========================"
echo "Total: $TOTAL_ADDED ADDED, $TOTAL_MODIFIED MODIFIED, $TOTAL_REMOVED REMOVED"
