#!/bin/bash
# [INPUT]: 依赖 delta-specs/{module}/spec.md
# [OUTPUT]: 同步到 devflow/specs/ SSOT
# [POS]: scripts 的 delta spec 同步脚本，被 /flow-delta sync 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SPECS_DIR="$PROJECT_ROOT/devflow/specs"

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-delta-sync.sh [REQ-ID] [--dry-run]

Synchronize delta specs to the SSOT (devflow/specs/).

Arguments:
    REQ-ID          Requirement ID (auto-detected if not provided)

Options:
    --dry-run       Show what would be done without making changes

Examples:
    flow-delta-sync.sh REQ-007
    flow-delta-sync.sh --dry-run
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            fi
            shift
            ;;
    esac
done

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
    usage
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

echo "Syncing delta specs for $REQ_ID..."
echo ""

ADDED_COUNT=0
MODIFIED_COUNT=0
REMOVED_COUNT=0

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

    echo "Processing: $MODULE"

    # Create target directory in SSOT
    TARGET_DIR="$SPECS_DIR/modules/$MODULE"

    if $DRY_RUN; then
        echo "  [DRY-RUN] Would create: $TARGET_DIR"
    else
        mkdir -p "$TARGET_DIR"
    fi

    # For now, just copy the delta spec to SSOT
    # A more sophisticated implementation would parse ADDED/MODIFIED/REMOVED
    # and apply changes incrementally
    TARGET_FILE="$TARGET_DIR/spec.md"

    if $DRY_RUN; then
        echo "  [DRY-RUN] Would sync: $SPEC_FILE → $TARGET_FILE"
    else
        cp "$SPEC_FILE" "$TARGET_FILE"
        echo "  ✓ Synced to $TARGET_FILE"
    fi

    ((ADDED_COUNT++))
done

echo ""
echo "Sync Summary:"
echo "  Modules synced: $ADDED_COUNT"

if $DRY_RUN; then
    echo ""
    echo "This was a dry run. No changes were made."
    echo "Run without --dry-run to apply changes."
fi
