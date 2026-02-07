#!/usr/bin/env bash
# =============================================================================
# worktree-create.sh - Create a new git worktree for requirement development
# =============================================================================
#
# Usage: worktree-create.sh REQ_ID [TITLE] [OPTIONS]
#
# ARGUMENTS:
#   REQ_ID              Requirement ID (REQ-XXX or BUG-XXX format)
#   TITLE               Optional title for branch naming
#
# OPTIONS:
#   --existing-branch   Use existing branch instead of creating new one
#   --force             Force creation even if worktree exists
#   --json              Output in JSON format
#   --help, -h          Show help message
#
# EXAMPLES:
#   worktree-create.sh REQ-123 "User Authentication"
#   worktree-create.sh REQ-123 --existing-branch
#   worktree-create.sh BUG-456 "Fix Login Issue"
#
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# =============================================================================
# Argument Parsing
# =============================================================================

REQ_ID=""
TITLE=""
EXISTING_BRANCH=false
FORCE=false
JSON_MODE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --existing-branch)
            EXISTING_BRANCH=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --json)
            JSON_MODE=true
            shift
            ;;
        --help|-h)
            cat << 'EOF'
Usage: worktree-create.sh REQ_ID [TITLE] [OPTIONS]

Create a new git worktree for requirement development.

ARGUMENTS:
  REQ_ID              Requirement ID (REQ-XXX or BUG-XXX format)
  TITLE               Optional title for branch naming

OPTIONS:
  --existing-branch   Use existing branch instead of creating new one
  --force             Force creation even if worktree exists
  --json              Output in JSON format
  --help, -h          Show help message

EXAMPLES:
  worktree-create.sh REQ-123 "User Authentication"
  worktree-create.sh REQ-123 --existing-branch
  worktree-create.sh BUG-456 "Fix Login Issue"
EOF
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage." >&2
            exit 1
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            elif [[ -z "$TITLE" ]]; then
                TITLE="$1"
            else
                echo "ERROR: Too many arguments. Use --help for usage." >&2
                exit 1
            fi
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
else
    echo "ERROR: common.sh not found at $COMMON_SH" >&2
    exit 1
fi

# =============================================================================
# Validation
# =============================================================================

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: REQ_ID is required. Use --help for usage." >&2
    exit 1
fi

# Normalize to uppercase
REQ_ID=$(echo "$REQ_ID" | tr '[:lower:]' '[:upper:]')

# Validate format
validate_req_id "$REQ_ID" || exit 1

# =============================================================================
# Path Calculation
# =============================================================================

MAIN_REPO=$(get_main_repo_path)
if [[ -z "$MAIN_REPO" ]]; then
    MAIN_REPO=$(git rev-parse --show-toplevel 2>/dev/null)
fi

if [[ -z "$MAIN_REPO" ]]; then
    echo "ERROR: Not in a git repository" >&2
    exit 1
fi

REPO_NAME=$(basename "$MAIN_REPO")
WORKTREE_DIR="$(dirname "$MAIN_REPO")/${REPO_NAME}-${REQ_ID}"

# Determine branch name
REQ_TYPE=$(get_req_type "$REQ_ID")
if [[ -n "$TITLE" ]]; then
    BRANCH_SUFFIX=$(slugify "$TITLE")
else
    BRANCH_SUFFIX="dev"
fi

if [[ "$REQ_TYPE" == "bug" ]]; then
    BRANCH_NAME="bugfix/${REQ_ID}-${BRANCH_SUFFIX}"
else
    BRANCH_NAME="feature/${REQ_ID}-${BRANCH_SUFFIX}"
fi

# =============================================================================
# Pre-flight Checks
# =============================================================================

# Check if worktree already exists
if [[ -d "$WORKTREE_DIR" ]]; then
    if $FORCE; then
        if ! $JSON_MODE; then
            echo "WARNING: Removing existing worktree at $WORKTREE_DIR" >&2
        fi
        git -C "$MAIN_REPO" worktree remove "$WORKTREE_DIR" --force 2>/dev/null || rm -rf "$WORKTREE_DIR"
    else
        if $JSON_MODE; then
            printf '{"error":"worktree_exists","path":"%s"}\n' "$WORKTREE_DIR"
        else
            echo "ERROR: Worktree already exists at $WORKTREE_DIR" >&2
            echo "Use --force to recreate or cd to existing worktree" >&2
        fi
        exit 1
    fi
fi

# Check if branch is already checked out in another worktree
if ! $EXISTING_BRANCH; then
    if git -C "$MAIN_REPO" rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
        # Branch exists, check if it's in use
        BRANCH_WORKTREE=$(git -C "$MAIN_REPO" worktree list --porcelain | grep -A2 "branch refs/heads/$BRANCH_NAME" | head -1 | sed 's/worktree //')
        if [[ -n "$BRANCH_WORKTREE" ]]; then
            if $JSON_MODE; then
                printf '{"error":"branch_in_use","branch":"%s","worktree":"%s"}\n' "$BRANCH_NAME" "$BRANCH_WORKTREE"
            else
                echo "ERROR: Branch $BRANCH_NAME is already checked out in $BRANCH_WORKTREE" >&2
            fi
            exit 1
        fi
        # Branch exists but not in use, use it
        EXISTING_BRANCH=true
    fi
fi

# =============================================================================
# Create Worktree
# =============================================================================

if ! $JSON_MODE; then
    echo "Creating worktree for $REQ_ID..." >&2
fi

if $EXISTING_BRANCH; then
    # Use existing branch
    git -C "$MAIN_REPO" worktree add "$WORKTREE_DIR" "$BRANCH_NAME"
else
    # Create new branch
    git -C "$MAIN_REPO" worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR"
fi

# =============================================================================
# Output
# =============================================================================

if $JSON_MODE; then
    printf '{"req_id":"%s","worktree_dir":"%s","branch":"%s","main_repo":"%s","created_at":"%s"}\n' \
        "$REQ_ID" \
        "$WORKTREE_DIR" \
        "$BRANCH_NAME" \
        "$MAIN_REPO" \
        "$(get_beijing_time_iso)"
else
    echo ""
    echo "✅ Worktree created successfully!"
    echo ""
    echo "Requirement ID:    $REQ_ID"
    echo "Worktree:          $WORKTREE_DIR"
    echo "Branch:            $BRANCH_NAME"
    echo "Main Repo:         $MAIN_REPO"
    echo ""
    echo "Next Steps:"
    echo "  cd $WORKTREE_DIR"
    echo "  claude  # Start new Claude Code session"
    echo ""
fi
