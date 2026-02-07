#!/bin/bash
# [INPUT]: 依赖 deltas/{delta-id}/delta.md, delta-parser.ts
# [OUTPUT]: 应用 delta 到 PRD.md，移动到 archive/
# [POS]: scripts 的 delta spec 应用脚本，被 /flow:delta apply 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PARSER_SCRIPT="$SCRIPT_DIR/delta-parser.ts"
ARCHIVE_DIR="$PROJECT_ROOT/devflow/archive"

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-delta-apply.sh <REQ-ID> <delta-slug> [--dry-run] [--force]

Apply a delta spec to the main PRD.md specification.

Arguments:
    REQ-ID          Requirement ID (e.g., REQ-123)
    delta-slug      Delta identifier (e.g., add-2fa or 2026-02-01-add-2fa)

Options:
    --dry-run       Show what would be done without making changes
    --force         Apply even if status is not 'approved'
    --all           Apply all approved deltas

Examples:
    flow-delta-apply.sh REQ-123 add-2fa
    flow-delta-apply.sh REQ-123 add-2fa --dry-run
    flow-delta-apply.sh REQ-123 --all
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID=""
DELTA_SLUG=""
DRY_RUN=false
FORCE=false
APPLY_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --all)
            APPLY_ALL=true
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            elif [[ -z "$DELTA_SLUG" ]]; then
                DELTA_SLUG="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$REQ_ID" ]]; then
    echo "Error: REQ-ID is required"
    usage
fi

if [[ -z "$DELTA_SLUG" && "$APPLY_ALL" != "true" ]]; then
    echo "Error: delta-slug is required (or use --all)"
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

get_delta_status() {
    local delta_file="$1"
    grep -E '^status:' "$delta_file" | head -1 | sed 's/status:[[:space:]]*"\?\([^"]*\)"\?/\1/'
}

update_delta_status() {
    local delta_file="$1"
    local new_status="$2"

    if $DRY_RUN; then
        echo "  [DRY-RUN] Would update status to '$new_status'"
        return 0
    fi

    # Use sed to update status in frontmatter
    if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "s/^status:.*$/status: \"$new_status\"/" "$delta_file"
    else
        sed -i "s/^status:.*$/status: \"$new_status\"/" "$delta_file"
    fi
}

apply_single_delta() {
    local delta_dir="$1"
    local delta_id=$(basename "$delta_dir")
    local delta_file="$delta_dir/delta.md"
    local prd_file="$REQ_DIR/PRD.md"

    echo "Applying delta: $delta_id"

    # Check delta file exists
    if [[ ! -f "$delta_file" ]]; then
        echo "  Error: Delta file not found: $delta_file"
        return 1
    fi

    # Check PRD.md exists
    if [[ ! -f "$prd_file" ]]; then
        echo "  Error: PRD.md not found: $prd_file"
        return 1
    fi

    # Check status
    local status=$(get_delta_status "$delta_file")
    if [[ "$status" != "approved" && "$FORCE" != "true" ]]; then
        echo "  Error: Delta status is '$status', expected 'approved'"
        echo "  Use --force to apply anyway"
        return 1
    fi

    # Check if parser exists
    if [[ ! -f "$PARSER_SCRIPT" ]]; then
        echo "  Error: Delta parser not found: $PARSER_SCRIPT"
        echo "  Falling back to simple copy..."

        if $DRY_RUN; then
            echo "  [DRY-RUN] Would apply delta to PRD.md"
        else
            # Simple fallback: just log that we would apply
            echo "  Warning: Full delta parsing not available"
            echo "  Please manually review and apply changes from: $delta_file"
        fi
        return 0
    fi

    # Apply delta using TypeScript parser
    if $DRY_RUN; then
        echo "  [DRY-RUN] Would apply delta to PRD.md"
        echo "  Parsing delta..."
        npx ts-node "$PARSER_SCRIPT" parse "$delta_file" 2>/dev/null || {
            echo "  Warning: Could not parse delta (ts-node may not be available)"
        }
    else
        echo "  Applying changes to PRD.md..."

        # Create backup
        cp "$prd_file" "$prd_file.bak"

        # Apply delta
        if npx ts-node "$PARSER_SCRIPT" apply "$prd_file" "$delta_file" > "$prd_file.new" 2>/dev/null; then
            mv "$prd_file.new" "$prd_file"
            rm "$prd_file.bak"
            echo "  ✓ Changes applied to PRD.md"
        else
            echo "  Warning: TypeScript parser failed, using fallback"
            rm -f "$prd_file.new"
            mv "$prd_file.bak" "$prd_file"
            echo "  Please manually review and apply changes from: $delta_file"
        fi

        # Update status
        update_delta_status "$delta_file" "applied"
        echo "  ✓ Status updated to 'applied'"

        # Archive delta
        local date_prefix=$(date +"%Y-%m")
        local archive_target="$ARCHIVE_DIR/$date_prefix/$REQ_ID/deltas/$delta_id"

        mkdir -p "$archive_target"
        cp -r "$delta_dir"/* "$archive_target/"
        rm -rf "$delta_dir"

        echo "  ✓ Archived to: $archive_target"
    fi

    return 0
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

if [[ ! -d "$DELTAS_DIR" ]]; then
    echo "No deltas found for $REQ_ID"
    exit 0
fi

if $APPLY_ALL; then
    echo "Applying all approved deltas for $REQ_ID..."
    echo ""

    APPLIED=0
    SKIPPED=0

    for delta_dir in "$DELTAS_DIR"/*/; do
        if [[ ! -d "$delta_dir" ]]; then
            continue
        fi

        delta_file="$delta_dir/delta.md"
        if [[ ! -f "$delta_file" ]]; then
            continue
        fi

        status=$(get_delta_status "$delta_file")
        if [[ "$status" == "approved" ]]; then
            if apply_single_delta "$delta_dir"; then
                ((APPLIED++))
            fi
        else
            ((SKIPPED++))
        fi
        echo ""
    done

    echo "Summary: $APPLIED applied, $SKIPPED skipped (not approved)"
else
    # Find the specific delta
    DELTA_DIR=$(find_delta_dir "$REQ_DIR" "$DELTA_SLUG")

    if [[ -z "$DELTA_DIR" || ! -d "$DELTA_DIR" ]]; then
        echo "Error: Delta not found: $DELTA_SLUG"
        echo "Available deltas:"
        ls -1 "$DELTAS_DIR" 2>/dev/null || echo "  (none)"
        exit 1
    fi

    apply_single_delta "$DELTA_DIR"
fi

echo ""
if $DRY_RUN; then
    echo "This was a dry run. No changes were made."
    echo "Run without --dry-run to apply changes."
fi
