#!/bin/bash
# [INPUT]: 依赖 deltas/{delta-id}/delta.md, delta-parser.ts
# [OUTPUT]: 显示 delta 状态和验证结果
# [POS]: scripts 的 delta spec 状态脚本，被 /flow:delta status 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PARSER_SCRIPT="$SCRIPT_DIR/delta-parser.ts"

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-delta-status.sh <REQ-ID> <delta-slug>

Check the status of a specific delta spec.

Arguments:
    REQ-ID          Requirement ID (e.g., REQ-123)
    delta-slug      Delta identifier (e.g., add-2fa or 2026-02-01-add-2fa)

Examples:
    flow-delta-status.sh REQ-123 add-2fa
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID="$1"
DELTA_SLUG="$2"

if [[ -z "$REQ_ID" || -z "$DELTA_SLUG" ]]; then
    echo "Error: REQ-ID and delta-slug are required"
    usage
fi

# Validate REQ-ID format
if [[ ! "$REQ_ID" =~ ^REQ-[0-9]+$ ]]; then
    echo "Error: Invalid REQ-ID format. Expected: REQ-XXX"
    exit 1
fi

# ============================================================================
# Helper Functions
# ============================================================================

find_delta_dir() {
    local req_dir="$1"
    local slug="$2"
    local deltas_dir="$req_dir/deltas"

    # Try exact match first
    if [[ -d "$deltas_dir/$slug" ]]; then
        echo "$deltas_dir/$slug"
        return 0
    fi

    # Try to find by suffix (slug without date prefix)
    for dir in "$deltas_dir"/*-"$slug"; do
        if [[ -d "$dir" ]]; then
            echo "$dir"
            return 0
        fi
    done

    return 1
}

extract_frontmatter_value() {
    local file="$1"
    local key="$2"
    grep -E "^$key:" "$file" | head -1 | sed "s/$key:[[:space:]]*\"\?\([^\"]*\)\"\?/\1/"
}

count_section_items() {
    local file="$1"
    local section="$2"

    # Count ### Requirement: headers in the section
    awk -v section="$section" '
        /^## / { in_section = ($0 ~ section) }
        in_section && /^### Requirement:/ { count++ }
        END { print count+0 }
    ' "$file"
}

count_renamed_pairs() {
    local file="$1"

    # Count FROM:/TO: pairs in RENAMED section
    awk '
        /^## RENAMED/ { in_section = 1 }
        /^## / && !/^## RENAMED/ { in_section = 0 }
        in_section && /^- FROM:/ { count++ }
        END { print count+0 }
    ' "$file"
}

# ============================================================================
# Main Logic
# ============================================================================

REQ_DIR="$PROJECT_ROOT/devflow/requirements/$REQ_ID"
DELTAS_DIR="$REQ_DIR/deltas"

if [[ ! -d "$REQ_DIR" ]]; then
    echo "Error: Requirement directory not found: $REQ_DIR"
    exit 1
fi

# Find the delta directory
DELTA_DIR=$(find_delta_dir "$REQ_DIR" "$DELTA_SLUG")

if [[ -z "$DELTA_DIR" || ! -d "$DELTA_DIR" ]]; then
    echo "Error: Delta not found: $DELTA_SLUG"
    echo "Available deltas:"
    ls -1 "$DELTAS_DIR" 2>/dev/null || echo "  (none)"
    exit 1
fi

DELTA_ID=$(basename "$DELTA_DIR")
DELTA_FILE="$DELTA_DIR/delta.md"
PRD_FILE="$REQ_DIR/PRD.md"

if [[ ! -f "$DELTA_FILE" ]]; then
    echo "Error: Delta file not found: $DELTA_FILE"
    exit 1
fi

# Extract metadata
STATUS=$(extract_frontmatter_value "$DELTA_FILE" "status")
TITLE=$(extract_frontmatter_value "$DELTA_FILE" "title")
CREATED_AT=$(extract_frontmatter_value "$DELTA_FILE" "created_at")

echo "Delta: $DELTA_ID"
echo "Title: $TITLE"
echo "Status: $STATUS"
echo "Created: $CREATED_AT"
echo ""

# Count changes
ADDED_COUNT=$(count_section_items "$DELTA_FILE" "ADDED Requirements")
MODIFIED_COUNT=$(count_section_items "$DELTA_FILE" "MODIFIED Requirements")
REMOVED_COUNT=$(count_section_items "$DELTA_FILE" "REMOVED Requirements")
RENAMED_COUNT=$(count_renamed_pairs "$DELTA_FILE")

echo "Changes:"
printf "  ADDED:     %d requirement(s)\n" "$ADDED_COUNT"
printf "  MODIFIED:  %d requirement(s)\n" "$MODIFIED_COUNT"
printf "  REMOVED:   %d requirement(s)\n" "$REMOVED_COUNT"
printf "  RENAMED:   %d requirement(s)\n" "$RENAMED_COUNT"
echo ""

# Validation
echo "Validation:"

VALIDATION_PASSED=true

# Check if PRD.md exists
if [[ ! -f "$PRD_FILE" ]]; then
    echo "  ✗ PRD.md not found"
    VALIDATION_PASSED=false
else
    echo "  ✓ PRD.md exists"
fi

# Check for empty delta
TOTAL_CHANGES=$((ADDED_COUNT + MODIFIED_COUNT + REMOVED_COUNT + RENAMED_COUNT))
if [[ $TOTAL_CHANGES -eq 0 ]]; then
    echo "  ✗ No changes defined in delta"
    VALIDATION_PASSED=false
else
    echo "  ✓ Delta contains $TOTAL_CHANGES change(s)"
fi

# Try to use TypeScript parser for detailed validation
if [[ -f "$PARSER_SCRIPT" ]]; then
    # Parse delta and check for errors
    PARSE_OUTPUT=$(npx ts-node "$PARSER_SCRIPT" parse "$DELTA_FILE" 2>&1) || {
        echo "  ✗ Delta parsing failed"
        VALIDATION_PASSED=false
    }

    if [[ -n "$PARSE_OUTPUT" && "$PARSE_OUTPUT" != *"Error"* ]]; then
        echo "  ✓ Delta syntax is valid"
    fi
fi

# Check status for apply readiness
case "$STATUS" in
    draft)
        echo "  ⚠ Status is 'draft' - needs review before apply"
        ;;
    review)
        echo "  ⚠ Status is 'review' - needs approval before apply"
        ;;
    approved)
        echo "  ✓ Status is 'approved' - ready to apply"
        ;;
    applied)
        echo "  ✓ Status is 'applied' - already applied"
        ;;
    *)
        echo "  ✗ Unknown status: $STATUS"
        VALIDATION_PASSED=false
        ;;
esac

echo ""

if $VALIDATION_PASSED; then
    if [[ "$STATUS" == "approved" ]]; then
        echo "✓ Ready to apply"
        echo ""
        echo "Run: /flow:delta apply $REQ_ID $DELTA_SLUG"
    elif [[ "$STATUS" == "applied" ]]; then
        echo "✓ Already applied"
    else
        echo "⚠ Validation passed, but status needs to be 'approved' before apply"
    fi
else
    echo "✗ Validation failed - please fix issues before applying"
fi
