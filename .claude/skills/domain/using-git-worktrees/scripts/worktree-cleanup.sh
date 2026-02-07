#!/usr/bin/env bash
# =============================================================================
# worktree-cleanup.sh - Clean up git worktrees
# =============================================================================
#
# Usage: worktree-cleanup.sh [REQ_ID] [OPTIONS]
#
# ARGUMENTS:
#   REQ_ID              Specific requirement to clean up (optional)
#
# OPTIONS:
#   --merged            Clean up all worktrees with merged branches
#   --force             Force removal even if branch not merged
#   --dry-run           Show what would be cleaned without doing it
#   --json              Output in JSON format
#   --help, -h          Show help message
#
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

REQ_ID=""
MERGED_ONLY=false
FORCE=false
DRY_RUN=false
JSON_MODE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --merged)
            MERGED_ONLY=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --json)
            JSON_MODE=true
            shift
            ;;
        --help|-h)
            cat << 'EOF'
Usage: worktree-cleanup.sh [REQ_ID] [OPTIONS]

Clean up git worktrees.

ARGUMENTS:
  REQ_ID              Specific requirement to clean up (optional)

OPTIONS:
  --merged            Clean up all worktrees with merged branches
  --force             Force removal even if branch not merged
  --dry-run           Show what would be cleaned without doing it
  --json              Output in JSON format
  --help, -h          Show help message

EXAMPLES:
  worktree-cleanup.sh REQ-123           # Clean specific worktree
  worktree-cleanup.sh --merged          # Clean all merged worktrees
  worktree-cleanup.sh --merged --dry-run # Preview cleanup
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

# =============================================================================
# Source Common Functions
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_SH="$SCRIPT_DIR/../../../scripts/common.sh"

if [[ -f "$COMMON_SH" ]]; then
    source "$COMMON_SH"
fi

# =============================================================================
# Get Main Repo
# =============================================================================

MAIN_REPO=$(git rev-parse --show-toplevel 2>/dev/null)
if [[ -z "$MAIN_REPO" ]]; then
    echo "ERROR: Not in a git repository" >&2
    exit 1
fi

REPO_NAME=$(basename "$MAIN_REPO")

# =============================================================================
# Cleanup Functions
# =============================================================================

cleanup_worktree() {
    local path="$1"
    local branch="$2"
    local force_flag=""

    if $FORCE; then
        force_flag="--force"
    fi

    if $DRY_RUN; then
        if ! $JSON_MODE; then
            echo "[DRY-RUN] Would remove: $path (branch: $branch)"
        fi
        return 0
    fi

    # Remove worktree
    git -C "$MAIN_REPO" worktree remove "$path" $force_flag 2>/dev/null || {
        if $FORCE; then
            rm -rf "$path"
        else
            echo "ERROR: Failed to remove worktree $path" >&2
            return 1
        fi
    }

    # Delete branch if not main/master
    if [[ "$branch" != "main" && "$branch" != "master" && -n "$branch" && "$branch" != "(detached)" ]]; then
        if $FORCE; then
            git -C "$MAIN_REPO" branch -D "$branch" 2>/dev/null || true
        else
            git -C "$MAIN_REPO" branch -d "$branch" 2>/dev/null || true
        fi
    fi

    if ! $JSON_MODE; then
        echo "Removed: $path (branch: $branch)"
    fi
}

# =============================================================================
# Main Logic
# =============================================================================

if [[ -n "$REQ_ID" ]]; then
    # Clean specific worktree
    REQ_ID=$(echo "$REQ_ID" | tr '[:lower:]' '[:upper:]')
    WORKTREE_DIR="$(dirname "$MAIN_REPO")/${REPO_NAME}-${REQ_ID}"

    if [[ ! -d "$WORKTREE_DIR" ]]; then
        if $JSON_MODE; then
            printf '{"error":"not_found","path":"%s"}\n' "$WORKTREE_DIR"
        else
            echo "ERROR: Worktree not found: $WORKTREE_DIR" >&2
        fi
        exit 1
    fi

    # Get branch name
    BRANCH=$(git -C "$WORKTREE_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

    cleanup_worktree "$WORKTREE_DIR" "$BRANCH"

    if $JSON_MODE; then
        printf '{"cleaned":[{"path":"%s","branch":"%s"}]}\n' "$WORKTREE_DIR" "$BRANCH"
    fi

elif $MERGED_ONLY; then
    # Clean all merged worktrees
    cleaned=()

    while IFS= read -r line; do
        if [[ "$line" =~ ^worktree ]]; then
            path="${line#worktree }"
        elif [[ "$line" =~ ^branch ]]; then
            branch="${line#branch refs/heads/}"

            # Skip main repo
            if [[ "$path" == "$MAIN_REPO" ]]; then
                continue
            fi

            # Check if branch is merged into main
            if git -C "$MAIN_REPO" branch --merged main 2>/dev/null | grep -q "^\s*$branch$"; then
                cleanup_worktree "$path" "$branch"
                cleaned+=("$path")
            fi
        fi
    done < <(git worktree list --porcelain)

    if $JSON_MODE; then
        printf '{"cleaned":['
        first=true
        for p in "${cleaned[@]}"; do
            if ! $first; then printf ','; fi
            first=false
            printf '"%s"' "$p"
        done
        printf ']}\n'
    else
        if [[ ${#cleaned[@]} -eq 0 ]]; then
            echo "No merged worktrees to clean up."
        else
            echo ""
            echo "Cleaned ${#cleaned[@]} worktree(s)."
        fi
    fi

else
    echo "ERROR: Specify REQ_ID or use --merged flag. Use --help for usage." >&2
    exit 1
fi
