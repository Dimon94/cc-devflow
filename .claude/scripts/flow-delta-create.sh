#!/bin/bash
# [INPUT]: 依赖 DELTA_SPEC_TEMPLATE.md
# [OUTPUT]: 创建 deltas/{date}-{slug}/delta.md
# [POS]: scripts 的 delta spec 创建脚本，被 /flow:delta create 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE_FILE="$PROJECT_ROOT/.claude/docs/templates/DELTA_SPEC_TEMPLATE.md"

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-delta-create.sh <REQ-ID> <slug> [title]

Create a new delta spec for a requirement.

Arguments:
    REQ-ID          Requirement ID (e.g., REQ-123)
    slug            Short identifier for the delta (e.g., add-2fa)
    title           Optional title (defaults to slug with spaces)

Examples:
    flow-delta-create.sh REQ-123 add-2fa
    flow-delta-create.sh REQ-123 add-2fa "Add Two-Factor Authentication"
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID="$1"
SLUG="$2"
TITLE="${3:-}"

if [[ -z "$REQ_ID" || -z "$SLUG" ]]; then
    echo "Error: REQ-ID and slug are required"
    usage
fi

# Validate REQ-ID format
if [[ ! "$REQ_ID" =~ ^REQ-[0-9]+$ ]]; then
    echo "Error: Invalid REQ-ID format. Expected: REQ-XXX"
    exit 1
fi

# Generate title from slug if not provided
if [[ -z "$TITLE" ]]; then
    TITLE=$(echo "$SLUG" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
fi

# ============================================================================
# Main Logic
# ============================================================================

REQ_DIR="$PROJECT_ROOT/devflow/requirements/$REQ_ID"

if [[ ! -d "$REQ_DIR" ]]; then
    echo "Error: Requirement directory not found: $REQ_DIR"
    exit 1
fi

# Generate delta_id with date prefix
DATE_PREFIX=$(date +"%Y-%m-%d")
DELTA_ID="${DATE_PREFIX}-${SLUG}"
DELTA_DIR="$REQ_DIR/deltas/$DELTA_ID"
DELTA_FILE="$DELTA_DIR/delta.md"
TASKS_FILE="$DELTA_DIR/tasks.md"

# Check if delta already exists
if [[ -d "$DELTA_DIR" ]]; then
    echo "Error: Delta already exists: $DELTA_DIR"
    exit 1
fi

# Create delta directory
mkdir -p "$DELTA_DIR"

# Generate timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create delta.md from template
if [[ -f "$TEMPLATE_FILE" ]]; then
    sed -e "s/{DELTA_ID}/$DELTA_ID/g" \
        -e "s/{REQ_ID}/$REQ_ID/g" \
        -e "s/{TITLE}/$TITLE/g" \
        -e "s/{TIMESTAMP}/$TIMESTAMP/g" \
        -e "s/{AUTHOR}/Claude/g" \
        "$TEMPLATE_FILE" > "$DELTA_FILE"
else
    # Create minimal delta spec
    cat > "$DELTA_FILE" << EOF
---
delta_id: "$DELTA_ID"
req_id: "$REQ_ID"
title: "$TITLE"
created_at: "$TIMESTAMP"
status: "draft"
---

# Delta: $TITLE

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Summary

{简要描述变更内容}

---

## ADDED Requirements

### Requirement: {Name}

{Description}

#### Scenario: {Scenario Name}

- GIVEN {precondition}
- WHEN {action}
- THEN {expected result}

---

## MODIFIED Requirements

### Requirement: {Name}

{New description}

(Previously: {old description})

---

## REMOVED Requirements

### Requirement: {Name}

**Reason**: {why removed}

**Migration**: {how to migrate}

---

## RENAMED Requirements

- FROM: {Old Name}
- TO: {New Name}

---

**Author**: Claude
**Reviewed By**: Pending
EOF
fi

# Create tasks.md for delta-specific tasks
cat > "$TASKS_FILE" << EOF
---
delta_id: "$DELTA_ID"
req_id: "$REQ_ID"
created_at: "$TIMESTAMP"
---

# Tasks for Delta: $TITLE

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Tasks

- [ ] T001: Review delta specification
- [ ] T002: Implement changes
- [ ] T003: Update tests
- [ ] T004: Update documentation

## Notes

Add implementation notes here.
EOF

echo "✅ Created delta: $DELTA_ID"
echo ""
echo "Files created:"
echo "  - $DELTA_FILE"
echo "  - $TASKS_FILE"
echo ""
echo "Next steps:"
echo "  1. Edit delta.md to add ADDED/MODIFIED/REMOVED/RENAMED sections"
echo "  2. Run '/flow:delta status $REQ_ID $SLUG' to validate"
echo "  3. Change status to 'approved' when ready"
echo "  4. Run '/flow:delta apply $REQ_ID $SLUG' to apply changes"
