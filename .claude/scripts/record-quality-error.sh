#!/bin/bash
# [INPUT]: 依赖 ERROR_LOG.md 模板
# [OUTPUT]: 追加错误记录到 ERROR_LOG.md
# [POS]: scripts 的错误记录脚本，被 ralph-stop-hook.sh 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: record-quality-error.sh <phase> <error_type> <error_message> [--task <task_id>]

Record a quality gate error to ERROR_LOG.md.

Arguments:
    phase           Phase name (flow-dev, flow-review, etc.)
    error_type      Error type (Test Failure, Build Error, Lint Error, etc.)
    error_message   Full error message

Options:
    --task          Associated task ID (e.g., T015)
    --root-cause    Root cause analysis (optional)
    --resolution    Resolution applied (optional)

Examples:
    record-quality-error.sh flow-dev "Test Failure" "Expected 5 but got 3" --task T015
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

PHASE=""
ERROR_TYPE=""
ERROR_MESSAGE=""
TASK_ID=""
ROOT_CAUSE=""
RESOLUTION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --task)
            TASK_ID="$2"
            shift 2
            ;;
        --root-cause)
            ROOT_CAUSE="$2"
            shift 2
            ;;
        --resolution)
            RESOLUTION="$2"
            shift 2
            ;;
        --help|-h)
            usage
            ;;
        *)
            if [[ -z "$PHASE" ]]; then
                PHASE="$1"
            elif [[ -z "$ERROR_TYPE" ]]; then
                ERROR_TYPE="$1"
            elif [[ -z "$ERROR_MESSAGE" ]]; then
                ERROR_MESSAGE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$PHASE" || -z "$ERROR_TYPE" || -z "$ERROR_MESSAGE" ]]; then
    echo "Error: phase, error_type, and error_message are required"
    usage
fi

# ============================================================================
# Detect REQ-ID and Error Log Path
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Try environment variable first
REQ_ID="${DEVFLOW_REQ_ID:-}"

# Try git branch
if [[ -z "$REQ_ID" ]]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    REQ_ID=$(echo "$BRANCH" | grep -oE 'REQ-[0-9]+' | head -1 || echo "")
fi

if [[ -z "$REQ_ID" ]]; then
    echo "Warning: Could not detect REQ-ID. Recording to project-level ERROR_LOG.md"
    ERROR_LOG="$PROJECT_ROOT/ERROR_LOG.md"
else
    ERROR_LOG="$PROJECT_ROOT/devflow/requirements/$REQ_ID/ERROR_LOG.md"
fi

# ============================================================================
# Generate Error Entry
# ============================================================================

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE_DISPLAY=$(date +"%Y-%m-%d %H:%M")

# Count existing errors to generate error number
if [[ -f "$ERROR_LOG" ]]; then
    ERROR_COUNT=$(grep -c "^## \[" "$ERROR_LOG" 2>/dev/null || echo "0")
else
    ERROR_COUNT=0
fi
ERROR_NUM=$((ERROR_COUNT + 1))
ERROR_ID=$(printf "E%03d" $ERROR_NUM)

# Build phase info
PHASE_INFO="$PHASE"
if [[ -n "$TASK_ID" ]]; then
    PHASE_INFO="$PHASE / $TASK_ID"
fi

# Create error entry
ERROR_ENTRY="## [$DATE_DISPLAY] $ERROR_ID: Quality Gate Failure

**Phase**: $PHASE_INFO
**Error Type**: $ERROR_TYPE
**Error Message**:
\`\`\`
$ERROR_MESSAGE
\`\`\`
**Root Cause**: ${ROOT_CAUSE:-[Pending analysis]}
**Resolution**: ${RESOLUTION:-[Pending]}
**Prevention**: [Optional]

---
"

# ============================================================================
# Write to Error Log
# ============================================================================

# Create file with header if it doesn't exist
if [[ ! -f "$ERROR_LOG" ]]; then
    cat > "$ERROR_LOG" << 'EOF'
# Error Log

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

This file records errors encountered during development for learning and prevention.

---

EOF
fi

# Append error entry
echo "$ERROR_ENTRY" >> "$ERROR_LOG"

echo "✅ Error recorded to $ERROR_LOG"
echo "   ID: $ERROR_ID"
echo "   Type: $ERROR_TYPE"
