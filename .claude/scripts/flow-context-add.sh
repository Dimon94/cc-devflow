#!/bin/bash
# [INPUT]: 依赖 context/*.jsonl 文件
# [OUTPUT]: 追加条目到指定的 jsonl 文件
# [POS]: scripts 的 context 添加脚本，被 /flow-context add 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-context-add.sh <agent> <path> <purpose> [--optional] [--type <file|directory|spec>]

Add an entry to a context JSONL file.

Arguments:
    agent       Agent type (research, prd, tech, epic, dev, review)
    path        File or directory path
    purpose     Human-readable purpose

Options:
    --optional  Mark entry as optional
    --type      Entry type (default: file)
    --depth     Directory depth (only for directory type, default: 1)

Examples:
    flow-context-add.sh dev "src/utils/auth.ts" "Authentication utilities"
    flow-context-add.sh dev "contracts/" "API contracts" --type directory --depth 2
    flow-context-add.sh dev "ERROR_LOG.md" "Previous errors" --optional
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

AGENT=""
PATH_ARG=""
PURPOSE=""
OPTIONAL="false"
ENTRY_TYPE="file"
DEPTH=1

while [[ $# -gt 0 ]]; do
    case $1 in
        --optional)
            OPTIONAL="true"
            shift
            ;;
        --type)
            ENTRY_TYPE="$2"
            shift 2
            ;;
        --depth)
            DEPTH="$2"
            shift 2
            ;;
        --help|-h)
            usage
            ;;
        *)
            if [[ -z "$AGENT" ]]; then
                AGENT="$1"
            elif [[ -z "$PATH_ARG" ]]; then
                PATH_ARG="$1"
            elif [[ -z "$PURPOSE" ]]; then
                PURPOSE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$AGENT" || -z "$PATH_ARG" || -z "$PURPOSE" ]]; then
    echo "Error: agent, path, and purpose are required"
    usage
fi

# ============================================================================
# Detect REQ-ID
# ============================================================================

# Try environment variable first
REQ_ID="${DEVFLOW_REQ_ID:-}"

# Try git branch
if [[ -z "$REQ_ID" ]]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    REQ_ID=$(echo "$BRANCH" | grep -oE 'REQ-[0-9]+' | head -1 || echo "")
fi

if [[ -z "$REQ_ID" ]]; then
    echo "Error: Could not detect REQ-ID. Set DEVFLOW_REQ_ID or use a feature branch."
    exit 1
fi

# ============================================================================
# Main Logic
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONTEXT_FILE="$PROJECT_ROOT/devflow/requirements/$REQ_ID/context/${AGENT}.jsonl"

if [[ ! -f "$CONTEXT_FILE" ]]; then
    echo "Error: Context file not found: $CONTEXT_FILE"
    echo "Run '/flow-context init $REQ_ID' first."
    exit 1
fi

# Build JSON entry
if [[ "$ENTRY_TYPE" == "directory" ]]; then
    if [[ "$OPTIONAL" == "true" ]]; then
        ENTRY="{\"type\": \"$ENTRY_TYPE\", \"path\": \"$PATH_ARG\", \"purpose\": \"$PURPOSE\", \"depth\": $DEPTH, \"optional\": true}"
    else
        ENTRY="{\"type\": \"$ENTRY_TYPE\", \"path\": \"$PATH_ARG\", \"purpose\": \"$PURPOSE\", \"depth\": $DEPTH}"
    fi
else
    if [[ "$OPTIONAL" == "true" ]]; then
        ENTRY="{\"type\": \"$ENTRY_TYPE\", \"path\": \"$PATH_ARG\", \"purpose\": \"$PURPOSE\", \"optional\": true}"
    else
        ENTRY="{\"type\": \"$ENTRY_TYPE\", \"path\": \"$PATH_ARG\", \"purpose\": \"$PURPOSE\"}"
    fi
fi

# Append to file
echo "$ENTRY" >> "$CONTEXT_FILE"

echo "✅ Added entry to $CONTEXT_FILE:"
echo "   $ENTRY"
