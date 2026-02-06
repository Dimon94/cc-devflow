#!/bin/bash
# [INPUT]: 依赖 run-quality-gates.sh
# [OUTPUT]: 快速质量验证结果
# [POS]: scripts 的快速质量验证脚本，被 /flow-quality 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ============================================================================
# Detect REQ-ID
# ============================================================================

REQ_ID="${1:-}"

if [[ -z "$REQ_ID" ]]; then
    REQ_ID="${DEVFLOW_REQ_ID:-}"
fi

if [[ -z "$REQ_ID" ]]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    REQ_ID=$(echo "$BRANCH" | grep -oE 'REQ-[0-9]+' | head -1 || echo "")
fi

# ============================================================================
# Main Execution
# ============================================================================

echo "🔍 Quality Gate - Quick Mode"
echo "=============================="
if [[ -n "$REQ_ID" ]]; then
    echo "REQ: $REQ_ID"
fi
echo ""

START_TIME=$(date +%s)

# Run quality gates
"$SCRIPT_DIR/run-quality-gates.sh" flow-quality --quick

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "Duration: ${DURATION}s"

# Update orchestration status if REQ_ID is set
if [[ -n "$REQ_ID" ]]; then
    STATUS_FILE="$PROJECT_ROOT/devflow/requirements/$REQ_ID/orchestration_status.json"
    if [[ -f "$STATUS_FILE" ]]; then
        # Update status using jq
        TMP_FILE="${STATUS_FILE}.tmp"
        jq '.status = "quality_complete" | .quality_mode = "quick" | .quality_timestamp = now' "$STATUS_FILE" > "$TMP_FILE"
        mv "$TMP_FILE" "$STATUS_FILE"
        echo ""
        echo "✅ Updated orchestration_status.json"
    fi
fi
