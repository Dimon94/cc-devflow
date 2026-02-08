#!/bin/bash
# [INPUT]: 依赖 common.sh、workspace/.current-req、journal-*.md
# [OUTPUT]: 更新当前开发者的 REQ 指针，并输出/执行 worktree 切换动作
# [POS]: scripts 的 workspace 切换脚本，被 /flow-workspace switch 与 start --switch 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKSPACE_DIR="$PROJECT_ROOT/devflow/workspace"
COMMON_SH="$SCRIPT_DIR/common.sh"

if [[ -f "$COMMON_SH" ]]; then
    source "$COMMON_SH"
fi

# ============================================================================
# Usage
# ============================================================================

usage() {
    cat << 'EOF'
Usage: flow-workspace-switch.sh REQ_ID [OPTIONS]

Switch workspace context to a target requirement.

Arguments:
  REQ_ID                 Requirement ID (REQ-XXX or BUG-XXX)

Options:
  --developer NAME       Developer name (default: DEVFLOW_DEVELOPER or current user)
  --print-cd             Print `cd "<worktree>"` for eval-style switching
  --cd                   Try to execute cd (effective only when script is sourced)
  --json                 Output in JSON format
  --help, -h             Show help

Examples:
  flow-workspace-switch.sh REQ-123
  flow-workspace-switch.sh REQ-123 --print-cd
  eval "$(flow-workspace-switch.sh REQ-123 --print-cd)"
  source flow-workspace-switch.sh REQ-123 --cd
EOF
}

# ============================================================================
# Parse Arguments
# ============================================================================

REQ_ID=""
DEVELOPER="${DEVFLOW_DEVELOPER:-$(whoami)}"
PRINT_CD=false
DO_CD=false
JSON_MODE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --developer)
            DEVELOPER="$2"
            shift 2
            ;;
        --print-cd)
            PRINT_CD=true
            shift
            ;;
        --cd)
            DO_CD=true
            shift
            ;;
        --json)
            JSON_MODE=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage." >&2
            exit 1
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            else
                echo "ERROR: Too many arguments. Use --help for usage." >&2
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: REQ_ID is required. Use --help for usage." >&2
    exit 1
fi

# Normalize and validate REQ_ID
REQ_ID=$(echo "$REQ_ID" | tr '[:lower:]' '[:upper:]')
if declare -f validate_req_id >/dev/null 2>&1; then
    validate_req_id "$REQ_ID" || exit 1
fi

# ============================================================================
# Resolve Workspace
# ============================================================================

DEV_WORKSPACE="$WORKSPACE_DIR/$DEVELOPER"
if [[ ! -d "$DEV_WORKSPACE" ]]; then
    echo "ERROR: Workspace not found for '$DEVELOPER': $DEV_WORKSPACE" >&2
    echo "Run '/flow-workspace init $DEVELOPER' first." >&2
    exit 1
fi

# Update current requirement pointer
echo "$REQ_ID" > "$DEV_WORKSPACE/.current-req"

# Append a lightweight journal entry
LATEST_JOURNAL=$(ls -1 "$DEV_WORKSPACE"/journal-*.md 2>/dev/null | sort -V | tail -1)
if [[ -z "$LATEST_JOURNAL" ]]; then
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

TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
cat >> "$LATEST_JOURNAL" << EOF
## [$TIMESTAMP] Requirement Switch

**REQ**: $REQ_ID

Switched workspace pointer to \`$REQ_ID\`.

---
EOF

# Resolve worktree path
WORKTREE_DIR=""
WORKTREE_EXISTS=false
if declare -f get_worktree_dir_for_req >/dev/null 2>&1; then
    WORKTREE_DIR=$(get_worktree_dir_for_req "$REQ_ID" 2>/dev/null || echo "")
fi
if [[ -n "$WORKTREE_DIR" && -d "$WORKTREE_DIR" ]]; then
    WORKTREE_EXISTS=true
fi

# Source detection: cd can only affect caller shell when sourced
IS_SOURCED=false
if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
    IS_SOURCED=true
fi

CD_EXECUTED=false
if $DO_CD; then
    if ! $WORKTREE_EXISTS; then
        echo "ERROR: Worktree not found for $REQ_ID: $WORKTREE_DIR" >&2
        exit 1
    fi

    if $IS_SOURCED; then
        cd "$WORKTREE_DIR"
        CD_EXECUTED=true
    fi
fi

# ============================================================================
# Output
# ============================================================================

if $JSON_MODE; then
    printf '{"developer":"%s","req_id":"%s","workspace":"%s","worktree_dir":"%s","worktree_exists":%s,"cd_executed":%s}\n' \
        "$DEVELOPER" \
        "$REQ_ID" \
        "$DEV_WORKSPACE" \
        "$WORKTREE_DIR" \
        "$WORKTREE_EXISTS" \
        "$CD_EXECUTED"
    return 0 2>/dev/null || exit 0
fi

if $PRINT_CD; then
    if $WORKTREE_EXISTS; then
        printf 'cd "%s"\n' "$WORKTREE_DIR"
        return 0 2>/dev/null || exit 0
    fi
    echo "ERROR: Worktree not found for $REQ_ID: $WORKTREE_DIR" >&2
    exit 1
fi

echo "✅ Workspace switched"
echo "Developer:         $DEVELOPER"
echo "Current REQ:       $REQ_ID"
echo "Workspace:         $DEV_WORKSPACE"
if [[ -n "$WORKTREE_DIR" ]]; then
    echo "Expected Worktree: $WORKTREE_DIR"
fi
echo "Worktree Exists:   $WORKTREE_EXISTS"

if $DO_CD; then
    if $CD_EXECUTED; then
        echo "Directory switched to: $PWD"
    else
        echo ""
        echo "⚠️  --cd 未生效（脚本以子进程运行，无法修改父 Shell 目录）"
        echo "Use one of:"
        echo "  source .claude/scripts/flow-workspace-switch.sh $REQ_ID --cd"
        echo "  eval \"\$(.claude/scripts/flow-workspace-switch.sh $REQ_ID --print-cd)\""
    fi
elif $WORKTREE_EXISTS; then
    echo ""
    echo "Next:"
    echo "  cd \"$WORKTREE_DIR\""
else
    echo ""
    echo "Worktree is missing. Create it with flow-init (default mode) or worktree-create script."
fi

return 0 2>/dev/null || exit 0
