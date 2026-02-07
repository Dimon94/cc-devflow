#!/usr/bin/env bash
# =============================================================================
# worktree-status.sh - Check current worktree status
# =============================================================================
#
# Usage: worktree-status.sh [OPTIONS]
#
# OPTIONS:
#   --json              Output in JSON format
#   --help, -h          Show help message
#
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

JSON_MODE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            JSON_MODE=true
            shift
            ;;
        --help|-h)
            cat << 'EOF'
Usage: worktree-status.sh [OPTIONS]

Check current worktree status.

OPTIONS:
  --json              Output in JSON format
  --help, -h          Show help message
EOF
            exit 0
            ;;
        *)
            echo "ERROR: Unknown option '$1'. Use --help for usage." >&2
            exit 1
            ;;
    esac
done

# =============================================================================
# Source Common Functions
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_SH="$SCRIPT_DIR/../../../scripts/common.sh"

if [[ -f "$COMMON_SH" ]]; then
    source "$COMMON_SH"
fi

# =============================================================================
# Gather Information
# =============================================================================

CURRENT_DIR=$(pwd)
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")

if [[ -z "$GIT_ROOT" ]]; then
    if $JSON_MODE; then
        printf '{"error":"not_git_repo"}\n'
    else
        echo "ERROR: Not in a git repository" >&2
    fi
    exit 1
fi

# Check if in worktree
IS_WORKTREE=false
MAIN_REPO=""
WORKTREE_COUNT=0

# Get worktree info
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
if [[ "$GIT_DIR" == *".git/worktrees/"* ]]; then
    IS_WORKTREE=true
    # Extract main repo path from gitdir file
    MAIN_REPO=$(cat "$GIT_ROOT/.git" 2>/dev/null | sed 's/gitdir: //' | sed 's|/.git/worktrees/.*||')
else
    MAIN_REPO="$GIT_ROOT"
fi

# Count worktrees
WORKTREE_COUNT=$(git worktree list | wc -l | tr -d ' ')

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# Extract REQ_ID from path or branch
REQ_ID=""
if [[ "$GIT_ROOT" =~ -([A-Z]+-[0-9]+)$ ]]; then
    REQ_ID="${BASH_REMATCH[1]}"
elif [[ "$BRANCH" =~ (REQ-[0-9]+|BUG-[0-9]+) ]]; then
    REQ_ID="${BASH_REMATCH[1]}"
fi

# Check git status
HAS_CHANGES=false
if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
    HAS_CHANGES=true
fi

# =============================================================================
# Output
# =============================================================================

if $JSON_MODE; then
    printf '{"current_dir":"%s","git_root":"%s","is_worktree":%s,"main_repo":"%s","branch":"%s","req_id":"%s","worktree_count":%d,"has_changes":%s}\n' \
        "$CURRENT_DIR" \
        "$GIT_ROOT" \
        "$IS_WORKTREE" \
        "$MAIN_REPO" \
        "$BRANCH" \
        "$REQ_ID" \
        "$WORKTREE_COUNT" \
        "$HAS_CHANGES"
else
    echo "Worktree Status"
    echo "==============="
    echo ""
    echo "Current Directory: $CURRENT_DIR"
    echo "Git Root:          $GIT_ROOT"
    echo "Is Worktree:       $IS_WORKTREE"
    echo "Main Repo:         $MAIN_REPO"
    echo "Branch:            $BRANCH"
    if [[ -n "$REQ_ID" ]]; then
        echo "Requirement ID:    $REQ_ID"
    fi
    echo "Total Worktrees:   $WORKTREE_COUNT"
    echo "Has Changes:       $HAS_CHANGES"
    echo ""

    if $IS_WORKTREE; then
        echo "You are in a worktree. Main repo is at: $MAIN_REPO"
    else
        echo "You are in the main repository."
    fi
fi
