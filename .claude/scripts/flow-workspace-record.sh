#!/bin/bash
# [INPUT]: 依赖 journal-*.md
# [OUTPUT]: 追加记录到 journal
# [POS]: scripts 的 workspace 记录脚本，被 /flow-workspace record 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKSPACE_DIR="$PROJECT_ROOT/devflow/workspace"
MAX_JOURNAL_LINES=2000

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << EOF
Usage: flow-workspace-record.sh <message> [--task TASK_ID]

Record progress to the journal.

Arguments:
    message         Progress message

Options:
    --task          Associated task ID (e.g., T015)
    --phase         Current phase (e.g., flow-dev)

Examples:
    flow-workspace-record.sh "Completed authentication middleware"
    flow-workspace-record.sh "Fixed rate limiting bug" --task T015
EOF
    exit 1
}

# ============================================================================
# Parse Arguments
# ============================================================================

MESSAGE=""
TASK_ID=""
PHASE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --task)
            TASK_ID="$2"
            shift 2
            ;;
        --phase)
            PHASE="$2"
            shift 2
            ;;
        --help|-h)
            usage
            ;;
        *)
            if [[ -z "$MESSAGE" ]]; then
                MESSAGE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$MESSAGE" ]]; then
    echo "Error: message is required"
    usage
fi

# ============================================================================
# Detect Developer and Workspace
# ============================================================================

DEVELOPER="${DEVFLOW_DEVELOPER:-$(whoami)}"
DEV_WORKSPACE="$WORKSPACE_DIR/$DEVELOPER"

if [[ ! -d "$DEV_WORKSPACE" ]]; then
    echo "Workspace not found for $DEVELOPER"
    echo "Run '/flow-workspace init $DEVELOPER' first."
    exit 1
fi

# ============================================================================
# Main Logic
# ============================================================================

# Find latest journal
LATEST_JOURNAL=$(ls -1 "$DEV_WORKSPACE"/journal-*.md 2>/dev/null | sort -V | tail -1)

if [[ -z "$LATEST_JOURNAL" ]]; then
    # Create first journal
    LATEST_JOURNAL="$DEV_WORKSPACE/journal-1.md"
    cat > "$LATEST_JOURNAL" << EOF
---
developer: "$DEVELOPER"
journal_number: 1
created_at: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
---

# Developer Journal: $DEVELOPER

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

---
EOF
fi

# Check if journal is too long
LINE_COUNT=$(wc -l < "$LATEST_JOURNAL")
if [[ $LINE_COUNT -ge $MAX_JOURNAL_LINES ]]; then
    # Create new journal
    JOURNAL_NUM=$(basename "$LATEST_JOURNAL" | grep -oE '[0-9]+' || echo "1")
    NEW_NUM=$((JOURNAL_NUM + 1))
    LATEST_JOURNAL="$DEV_WORKSPACE/journal-$NEW_NUM.md"

    cat > "$LATEST_JOURNAL" << EOF
---
developer: "$DEVELOPER"
journal_number: $NEW_NUM
created_at: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
---

# Developer Journal: $DEVELOPER (continued)

> **[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md

---
EOF
    echo "Created new journal: $(basename "$LATEST_JOURNAL")"
fi

# Build entry
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
ENTRY="## [$TIMESTAMP] Progress Update

"

if [[ -n "$TASK_ID" ]]; then
    ENTRY+="**Task**: $TASK_ID
"
fi

if [[ -n "$PHASE" ]]; then
    ENTRY+="**Phase**: $PHASE
"
fi

ENTRY+="
$MESSAGE

---
"

# Append to journal
echo "$ENTRY" >> "$LATEST_JOURNAL"

echo "✅ Recorded to $(basename "$LATEST_JOURNAL")"
