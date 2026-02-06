#!/bin/bash
# [INPUT]: 依赖 DELTA_SPEC_TEMPLATE.md
# [OUTPUT]: 创建 delta-specs/{module}/spec.md
# [POS]: scripts 的 delta spec 创建脚本，被 /flow-delta create 调用
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
Usage: flow-delta-create.sh <module> <description> [REQ-ID]

Create a new delta spec for a module.

Arguments:
    module          Module name (e.g., auth, payment, user)
    description     Brief description of changes

Options:
    REQ-ID          Requirement ID (auto-detected if not provided)

Examples:
    flow-delta-create.sh auth "Add 2FA support"
    flow-delta-create.sh payment "Integrate Stripe" REQ-007
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

MODULE="$1"
DESCRIPTION="$2"
REQ_ID="${3:-}"

if [[ -z "$MODULE" || -z "$DESCRIPTION" ]]; then
    echo "Error: module and description are required"
    usage
fi

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
    exit 1
fi

# ============================================================================
# Main Logic
# ============================================================================

REQ_DIR="$PROJECT_ROOT/devflow/requirements/$REQ_ID"
DELTA_DIR="$REQ_DIR/delta-specs/$MODULE"
SPEC_FILE="$DELTA_DIR/spec.md"

if [[ ! -d "$REQ_DIR" ]]; then
    echo "Error: Requirement directory not found: $REQ_DIR"
    exit 1
fi

# Create delta-specs directory
mkdir -p "$DELTA_DIR"

# Check if spec already exists
if [[ -f "$SPEC_FILE" ]]; then
    echo "Warning: Delta spec already exists: $SPEC_FILE"
    echo "Use an editor to modify it."
    exit 0
fi

# Generate timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create spec from template
if [[ -f "$TEMPLATE_FILE" ]]; then
    # Replace placeholders in template
    sed -e "s/{REQ_ID}/$REQ_ID/g" \
        -e "s/{MODULE_NAME}/$MODULE/g" \
        -e "s/{TIMESTAMP}/$TIMESTAMP/g" \
        -e "s/{AUTHOR}/Claude/g" \
        "$TEMPLATE_FILE" > "$SPEC_FILE"
else
    # Create minimal spec
    cat > "$SPEC_FILE" << EOF
---
req_id: "$REQ_ID"
module: "$MODULE"
created_at: "$TIMESTAMP"
version: "1.0.0"
status: "draft"
---

# Delta Spec: $MODULE

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

## Summary

$DESCRIPTION

---

## Changes

### ADDED

<!-- New specifications added by this requirement -->

### MODIFIED

<!-- Changes to existing specifications -->

### REMOVED

<!-- Specifications deprecated or removed -->

---

## Impact Analysis

### Affected Files

| File | Change Type | Description |
|------|-------------|-------------|

### Dependencies

- Requires: None
- Blocks: None

---

**Author**: Claude
**Reviewed By**: Pending
EOF
fi

echo "✅ Created delta spec: $SPEC_FILE"
echo ""
echo "Next steps:"
echo "  1. Edit the spec to add ADDED/MODIFIED/REMOVED sections"
echo "  2. Run '/flow-delta diff $REQ_ID' to review changes"
echo "  3. Run '/flow-delta sync $REQ_ID' before release"
