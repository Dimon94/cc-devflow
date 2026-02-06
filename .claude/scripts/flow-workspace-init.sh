#!/bin/bash
# [INPUT]: 依赖 JOURNAL_TEMPLATE.md
# [OUTPUT]: 创建 devflow/workspace/{developer}/ 目录
# [POS]: scripts 的 workspace 初始化脚本，被 /flow-workspace init 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKSPACE_DIR="$PROJECT_ROOT/devflow/workspace"
TEMPLATE_FILE="$PROJECT_ROOT/.claude/docs/templates/JOURNAL_TEMPLATE.md"

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-workspace-init.sh [developer]

Initialize a workspace for a developer.

Arguments:
    developer       Developer name (default: current user)

Examples:
    flow-workspace-init.sh dimon
    flow-workspace-init.sh
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

DEVELOPER="${1:-$(whoami)}"

# ============================================================================
# Main Logic
# ============================================================================

DEV_WORKSPACE="$WORKSPACE_DIR/$DEVELOPER"

# Check if workspace already exists
if [[ -d "$DEV_WORKSPACE" ]]; then
    echo "Workspace already exists: $DEV_WORKSPACE"
    echo ""
    echo "Current state:"
    if [[ -f "$DEV_WORKSPACE/.current-req" ]]; then
        echo "  Current REQ: $(cat "$DEV_WORKSPACE/.current-req")"
    else
        echo "  Current REQ: None"
    fi
    JOURNAL_COUNT=$(ls -1 "$DEV_WORKSPACE"/journal-*.md 2>/dev/null | wc -l || echo "0")
    echo "  Journals: $JOURNAL_COUNT"
    exit 0
fi

# Create workspace directory
mkdir -p "$DEV_WORKSPACE"

# Create initial journal
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
DATE=$(date +"%Y-%m-%d")

cat > "$DEV_WORKSPACE/journal-1.md" << EOF
---
developer: "$DEVELOPER"
journal_number: 1
created_at: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
---

# Developer Journal: $DEVELOPER

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

---

## [$TIMESTAMP] Workspace Initialized

Workspace created for $DEVELOPER.

### Next Steps

1. Start a requirement with \`/flow-init "REQ-XXX|Title"\`
2. Use \`/flow-workspace record "message"\` to track progress
3. Use \`/flow-workspace start\` to recover context in new sessions

---
EOF

# Update workspace index
INDEX_FILE="$WORKSPACE_DIR/index.md"
if [[ -f "$INDEX_FILE" ]]; then
    # Add developer to index if not already present
    if ! grep -q "| $DEVELOPER |" "$INDEX_FILE"; then
        # Insert before the last line (which should be empty or a separator)
        sed -i.bak "/^| _template_ |/a\\
| $DEVELOPER | - | - | $DATE |" "$INDEX_FILE"
        rm -f "$INDEX_FILE.bak"
    fi
fi

echo "✅ Workspace initialized: $DEV_WORKSPACE"
echo ""
echo "Files created:"
ls -la "$DEV_WORKSPACE"
echo ""
echo "Next steps:"
echo "  1. Start a requirement: /flow-init \"REQ-XXX|Title\""
echo "  2. Record progress: /flow-workspace record \"message\""
