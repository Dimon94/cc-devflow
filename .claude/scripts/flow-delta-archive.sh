#!/bin/bash
# [INPUT]: 依赖 delta-specs/ 目录
# [OUTPUT]: 归档到 devflow/archive/
# [POS]: scripts 的 delta spec 归档脚本，被 /flow-delta archive 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ARCHIVE_DIR="$PROJECT_ROOT/devflow/archive"

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID="${1:-}"

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
    echo "Usage: flow-delta-archive.sh [REQ-ID]"
    exit 1
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

# Create archive directory with date prefix
DATE_PREFIX=$(date +"%Y-%m")
ARCHIVE_TARGET="$ARCHIVE_DIR/$DATE_PREFIX/$REQ_ID/delta-specs"

echo "Archiving delta-specs for $REQ_ID..."
echo "  From: $DELTA_DIR"
echo "  To: $ARCHIVE_TARGET"

# Create archive directory
mkdir -p "$ARCHIVE_TARGET"

# Copy delta-specs to archive
cp -r "$DELTA_DIR"/* "$ARCHIVE_TARGET/"

# Remove original delta-specs
rm -rf "$DELTA_DIR"

echo ""
echo "✅ Delta specs archived successfully"
echo ""
echo "Archive location: $ARCHIVE_TARGET"
