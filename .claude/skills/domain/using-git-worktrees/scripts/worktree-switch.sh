#!/usr/bin/env bash
# =============================================================================
# worktree-switch.sh - Switch to a worktree by REQ_ID
# =============================================================================
#
# Usage: worktree-switch.sh REQ_ID
#
# This script outputs the path to switch to. Use with:
#   cd $(worktree-switch.sh REQ-123)
#
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

REQ_ID=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h)
            cat << 'EOF'
Usage: worktree-switch.sh REQ_ID

Switch to a worktree by REQ_ID.

This script outputs the path to switch to. Use with:
  cd $(worktree-switch.sh REQ-123)

Or use the zw shell function:
  zw REQ-123
EOF
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage." >&2
            exit 1
            ;;
        *)
            REQ_ID="$1"
            shift
            ;;
    esac
done

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: REQ_ID is required. Use --help for usage." >&2
    exit 1
fi

# Normalize to uppercase
REQ_ID=$(echo "$REQ_ID" | tr '[:lower:]' '[:upper:]')

# =============================================================================
# Find Worktree
# =============================================================================

MAIN_REPO=$(git rev-parse --show-toplevel 2>/dev/null)
if [[ -z "$MAIN_REPO" ]]; then
    echo "ERROR: Not in a git repository" >&2
    exit 1
fi

REPO_NAME=$(basename "$MAIN_REPO")
WORKTREE_DIR="$(dirname "$MAIN_REPO")/${REPO_NAME}-${REQ_ID}"

if [[ -d "$WORKTREE_DIR" ]]; then
    echo "$WORKTREE_DIR"
else
    echo "ERROR: Worktree not found: $WORKTREE_DIR" >&2
    exit 1
fi
