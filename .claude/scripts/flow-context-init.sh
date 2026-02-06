#!/bin/bash
# [INPUT]: 依赖 .claude/docs/templates/context/*.jsonl.template
# [OUTPUT]: 创建 devflow/requirements/{REQ}/context/ 目录
# [POS]: scripts 的 context 初始化脚本，被 /flow-context init 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATES_DIR="$PROJECT_ROOT/.claude/docs/templates/context"

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-context-init.sh <REQ-ID> [--type <backend|frontend|fullstack>]

Initialize context directory for a requirement.

Arguments:
    REQ-ID      Requirement ID (e.g., REQ-007)

Options:
    --type      Project type (default: fullstack)
                - backend: Exclude frontend specs
                - frontend: Exclude backend specs
                - fullstack: Include all specs

Examples:
    flow-context-init.sh REQ-007
    flow-context-init.sh REQ-007 --type backend
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID=""
PROJECT_TYPE="fullstack"

while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            PROJECT_TYPE="$2"
            shift 2
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

if [[ -z "$REQ_ID" ]]; then
    echo "Error: REQ-ID is required"
    usage
fi

# Validate REQ-ID format
if [[ ! "$REQ_ID" =~ ^REQ-[0-9]+$ ]]; then
    echo "Error: Invalid REQ-ID format. Expected REQ-XXX (e.g., REQ-007)"
    exit 1
fi

# ============================================================================
# Main Logic
# ============================================================================

REQ_DIR="$PROJECT_ROOT/devflow/requirements/$REQ_ID"
CONTEXT_DIR="$REQ_DIR/context"

# Check if requirement directory exists
if [[ ! -d "$REQ_DIR" ]]; then
    echo "Error: Requirement directory not found: $REQ_DIR"
    exit 1
fi

# Create context directory
mkdir -p "$CONTEXT_DIR"

echo "Initializing context for $REQ_ID (type: $PROJECT_TYPE)..."

# Copy templates
for template in "$TEMPLATES_DIR"/*.jsonl.template; do
    if [[ -f "$template" ]]; then
        filename=$(basename "$template" .template)
        target="$CONTEXT_DIR/$filename"

        # Skip if already exists
        if [[ -f "$target" ]]; then
            echo "  ⏭️  Skipping $filename (already exists)"
            continue
        fi

        # Copy and filter based on project type
        case $PROJECT_TYPE in
            backend)
                # Remove frontend spec entries
                grep -v 'devflow/spec/frontend' "$template" > "$target" || cp "$template" "$target"
                ;;
            frontend)
                # Remove backend spec entries
                grep -v 'devflow/spec/backend' "$template" > "$target" || cp "$template" "$target"
                ;;
            *)
                # Copy as-is
                cp "$template" "$target"
                ;;
        esac

        echo "  ✅ Created $filename"
    fi
done

echo ""
echo "Context initialized at: $CONTEXT_DIR"
echo ""
echo "Files created:"
ls -la "$CONTEXT_DIR"
