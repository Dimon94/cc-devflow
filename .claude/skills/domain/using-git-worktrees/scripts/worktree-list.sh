#!/usr/bin/env bash
# =============================================================================
# worktree-list.sh - List all git worktrees
# =============================================================================
#
# Usage: worktree-list.sh [OPTIONS]
#
# OPTIONS:
#   --json              Output in JSON format
#   --verbose, -v       Show detailed information
#   --help, -h          Show help message
#
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

JSON_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            JSON_MODE=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            cat << 'EOF'
Usage: worktree-list.sh [OPTIONS]

List all git worktrees.

OPTIONS:
  --json              Output in JSON format
  --verbose, -v       Show detailed information
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
# Get Main Repo
# =============================================================================

MAIN_REPO=$(git rev-parse --show-toplevel 2>/dev/null)
if [[ -z "$MAIN_REPO" ]]; then
    echo "ERROR: Not in a git repository" >&2
    exit 1
fi

# =============================================================================
# List Worktrees
# =============================================================================

if $JSON_MODE; then
    echo "["
    first=true
    while IFS= read -r line; do
        if [[ "$line" =~ ^worktree ]]; then
            if ! $first; then
                echo ","
            fi
            first=false
            path="${line#worktree }"
        elif [[ "$line" =~ ^HEAD ]]; then
            head="${line#HEAD }"
        elif [[ "$line" =~ ^branch ]]; then
            branch="${line#branch refs/heads/}"
            # Extract REQ_ID from path
            req_id=""
            if [[ "$path" =~ -([A-Z]+-[0-9]+)$ ]]; then
                req_id="${BASH_REMATCH[1]}"
            fi
            printf '{"path":"%s","branch":"%s","head":"%s","req_id":"%s"}' \
                "$path" "$branch" "$head" "$req_id"
        elif [[ "$line" =~ ^detached ]]; then
            branch="(detached)"
            req_id=""
            if [[ "$path" =~ -([A-Z]+-[0-9]+)$ ]]; then
                req_id="${BASH_REMATCH[1]}"
            fi
            printf '{"path":"%s","branch":"%s","head":"%s","req_id":"%s"}' \
                "$path" "$branch" "$head" "$req_id"
        fi
    done < <(git worktree list --porcelain)
    echo ""
    echo "]"
else
    echo "Git Worktrees:"
    echo ""

    if $VERBOSE; then
        git worktree list --porcelain | while IFS= read -r line; do
            if [[ "$line" =~ ^worktree ]]; then
                path="${line#worktree }"
                echo "Path:   $path"
            elif [[ "$line" =~ ^HEAD ]]; then
                echo "HEAD:   ${line#HEAD }"
            elif [[ "$line" =~ ^branch ]]; then
                echo "Branch: ${line#branch refs/heads/}"
                echo ""
            elif [[ "$line" =~ ^detached ]]; then
                echo "Branch: (detached)"
                echo ""
            fi
        done
    else
        git worktree list
    fi
fi
