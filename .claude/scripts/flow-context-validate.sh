#!/bin/bash
# [INPUT]: 依赖 context/*.jsonl 文件
# [OUTPUT]: 验证结果输出到 stdout
# [POS]: scripts 的 context 验证脚本，被 /flow-context validate 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-context-validate.sh [REQ-ID]

Validate all context paths exist for a requirement.

Arguments:
    REQ-ID      Requirement ID (optional, auto-detected from branch)

Examples:
    flow-context-validate.sh REQ-007
    flow-context-validate.sh
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID="$1"

# Auto-detect REQ-ID if not provided
if [[ -z "$REQ_ID" ]]; then
    REQ_ID="${DEVFLOW_REQ_ID:-}"

    if [[ -z "$REQ_ID" ]]; then
        BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
        REQ_ID=$(echo "$BRANCH" | grep -oE 'REQ-[0-9]+' | head -1 || echo "")
    fi
fi

if [[ -z "$REQ_ID" ]]; then
    echo "Error: Could not detect REQ-ID. Provide it as argument or set DEVFLOW_REQ_ID."
    usage
fi

# ============================================================================
# Main Logic
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REQ_DIR="$PROJECT_ROOT/devflow/requirements/$REQ_ID"
CONTEXT_DIR="$REQ_DIR/context"

if [[ ! -d "$CONTEXT_DIR" ]]; then
    echo "Error: Context directory not found: $CONTEXT_DIR"
    echo "Run '/flow-context init $REQ_ID' first."
    exit 1
fi

echo "Validating context for $REQ_ID..."
echo ""

TOTAL_VALID=0
TOTAL_INVALID=0
TOTAL_OPTIONAL_MISSING=0

for jsonl_file in "$CONTEXT_DIR"/*.jsonl; do
    if [[ ! -f "$jsonl_file" ]]; then
        continue
    fi

    filename=$(basename "$jsonl_file")
    valid=0
    invalid=0
    missing_paths=()

    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# || "$line" =~ ^[[:space:]]*// ]] && continue

        # Parse JSON (basic extraction)
        path=$(echo "$line" | grep -oP '"path"\s*:\s*"\K[^"]+' || echo "")
        type=$(echo "$line" | grep -oP '"type"\s*:\s*"\K[^"]+' || echo "file")
        optional=$(echo "$line" | grep -oP '"optional"\s*:\s*\K(true|false)' || echo "false")

        if [[ -z "$path" ]]; then
            continue
        fi

        # Resolve path
        if [[ "$type" == "spec" ]]; then
            full_path="$PROJECT_ROOT/$path"
        else
            full_path="$REQ_DIR/$path"
        fi

        # Check existence
        if [[ -e "$full_path" ]]; then
            ((valid++))
        else
            if [[ "$optional" == "true" ]]; then
                ((TOTAL_OPTIONAL_MISSING++))
            else
                ((invalid++))
                missing_paths+=("$path")
            fi
        fi
    done < "$jsonl_file"

    TOTAL_VALID=$((TOTAL_VALID + valid))
    TOTAL_INVALID=$((TOTAL_INVALID + invalid))

    total=$((valid + invalid))
    if [[ $invalid -eq 0 ]]; then
        echo "  ✓ $filename: $valid/$total paths valid"
    else
        echo "  ✗ $filename: $valid/$total paths valid"
        for mp in "${missing_paths[@]}"; do
            echo "    - Missing: $mp"
        done
    fi
done

echo ""
GRAND_TOTAL=$((TOTAL_VALID + TOTAL_INVALID))
if [[ $GRAND_TOTAL -gt 0 ]]; then
    PERCENT=$((TOTAL_VALID * 100 / GRAND_TOTAL))
    echo "Overall: $TOTAL_VALID/$GRAND_TOTAL paths valid ($PERCENT%)"
    if [[ $TOTAL_OPTIONAL_MISSING -gt 0 ]]; then
        echo "Optional missing: $TOTAL_OPTIONAL_MISSING (not counted in validation)"
    fi
else
    echo "No context entries found."
fi

# Exit with error if any required paths are missing
if [[ $TOTAL_INVALID -gt 0 ]]; then
    exit 1
fi
