#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 common.sh 提供 REQ 路径、时间与校验能力，依赖 jq 输出安全 JSON，接收 REQ_ID/title/description。
# [OUTPUT]: 创建 requirement 或 bug 的最薄目录骨架；对 requirement 写入 harness-state 与 intent memory scaffold。
# [POS]: flow-init/scripts 的 bootstrap 脚本，被 skill 与测试复用。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

REQ_ID=""
TITLE=""
DESCRIPTION=""
INTERACTIVE=false
JSON_MODE=false
AUTO_ID=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --title)
            TITLE="${2:-}"
            shift 2
            ;;
        --description)
            DESCRIPTION="${2:-}"
            shift 2
            ;;
        --branch-title|--worktree)
            shift
            if [[ $# -gt 0 && "$1" != --* ]]; then
                shift
            fi
            ;;
        --skip-git|--branch-only)
            # Deprecated: kept for compatibility, ignored.
            shift
            ;;
        --interactive|-i)
            INTERACTIVE=true
            shift
            ;;
        --json)
            JSON_MODE=true
            shift
            ;;
        --auto-id)
            AUTO_ID=true
            shift
            ;;
        --help|-h)
            cat <<'EOF'
Usage: create-requirement.sh [REQ_ID] [OPTIONS]

Create the thinnest CC-DevFlow requirement or bug scaffold.

ARGUMENTS:
  REQ_ID              Requirement ID (REQ-XXX or BUG-XXX format)

OPTIONS:
  --title TITLE       Requirement title
  --description DESC  Brief description
  --interactive, -i   Prompt for missing values
  --json              Output results as JSON
  --auto-id           Auto-select next available REQ-ID when missing or duplicated
  --help, -h          Show this help message

CANONICAL OUTPUT (REQ):
  devflow/requirements/REQ-XXX/
  ├── README.md
  ├── harness-state.json
  └── research/

  devflow/intent/REQ-XXX/
  ├── summary.md
  ├── facts.md
  ├── decision-log.md
  ├── plan.md
  ├── resume-index.md
  ├── delegation-map.md
  ├── checkpoints/
  └── artifacts/
      ├── briefs/
      └── results/

NOTE:
  Compatibility files such as EXECUTION_LOG.md / orchestration_status.json
  are no longer created by default here.
EOF
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage information." >&2
            exit 1
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            else
                echo "ERROR: Too many arguments. Use --help for usage information." >&2
                exit 1
            fi
            shift
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_SH="$SCRIPT_DIR/common.sh"
if [[ ! -f "$COMMON_SH" ]]; then
    COMMON_SH="$SCRIPT_DIR/../../../../scripts/common.sh"
fi
source "$COMMON_SH"

seed_file() {
    local path="$1"
    local content="$2"
    if [[ ! -f "$path" ]]; then
        printf '%s' "$content" > "$path"
    fi
}

build_goal() {
    local req_id="$1"
    local title="$2"
    if [[ -n "$title" ]]; then
        printf 'Deliver %s: %s' "$req_id" "$title"
    else
        printf 'Deliver %s safely with auditable checkpoints.' "$req_id"
    fi
}

if $INTERACTIVE; then
    if [[ -z "$REQ_ID" ]]; then
        suggested_req_id=$(next_available_req_id "$(get_repo_root)")
        read -r -p "Requirement ID (REQ-XXX or BUG-XXX) [${suggested_req_id}]: " input_req_id
        input_req_id=$(echo "${input_req_id}" | tr '[:lower:]' '[:upper:]')
        if [[ -z "$input_req_id" ]]; then
            AUTO_ID=true
            REQ_ID="$suggested_req_id"
        else
            REQ_ID="$input_req_id"
        fi
    fi

    if [[ -z "$TITLE" ]]; then
        read -r -p "Requirement Title: " TITLE
    fi

    if [[ -z "$DESCRIPTION" ]]; then
        read -r -p "Brief Description (optional): " DESCRIPTION
    fi
fi

REPO_ROOT=$(get_repo_root)

if [[ -z "$REQ_ID" ]]; then
    AUTO_ID=true
    REQ_ID=$(next_available_req_id "$REPO_ROOT")
fi

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: Unable to determine next requirement ID" >&2
    exit 1
fi

REQ_ID=$(echo "$REQ_ID" | tr '[:lower:]' '[:upper:]')
validate_req_id "$REQ_ID" || exit 1

if req_id_in_use "$REPO_ROOT" "$REQ_ID"; then
    if $AUTO_ID; then
        while req_id_in_use "$REPO_ROOT" "$REQ_ID"; do
            REQ_ID=$(next_available_req_id "$REPO_ROOT")
        done
    else
        echo "ERROR: Requirement directory already exists: $(get_req_dir "$REPO_ROOT" "$REQ_ID")" >&2
        exit 1
    fi
fi

REQ_TYPE=$(get_req_type "$REQ_ID")
REQ_DIR=$(get_req_dir "$REPO_ROOT" "$REQ_ID")
INTENT_DIR="$REPO_ROOT/devflow/intent/$REQ_ID"
INTENT_ARTIFACTS_DIR="$INTENT_DIR/artifacts"
GOAL=$(build_goal "$REQ_ID" "$TITLE")
NOW_ISO=$(get_beijing_time_iso)
NOW_FULL=$(get_beijing_time_full)

mkdir -p "$REQ_DIR/research"

if [[ "$REQ_TYPE" == "bug" ]]; then
    cat > "$REQ_DIR/status.json" <<EOF
{
  "bugId": "$REQ_ID",
  "title": "${TITLE:-"To be defined"}",
  "status": "initialized",
  "phase": "analysis",
  "severity": "unknown",
  "createdAt": "$NOW_ISO",
  "updatedAt": "$NOW_ISO"
}
EOF
else
    mkdir -p \
        "$INTENT_DIR/checkpoints" \
        "$INTENT_ARTIFACTS_DIR/briefs" \
        "$INTENT_ARTIFACTS_DIR/results"

    cat > "$REQ_DIR/harness-state.json" <<EOF
{
  "changeId": "$REQ_ID",
  "goal": "$GOAL",
  "status": "initialized",
  "initializedAt": "$NOW_ISO",
  "updatedAt": "$NOW_ISO"
}
EOF

    seed_file "$INTENT_DIR/summary.md" "# Summary: $REQ_ID

- Goal: $GOAL
- Created: $NOW_FULL
"

    seed_file "$INTENT_DIR/facts.md" "# Facts: $REQ_ID

- Initial title: ${TITLE:-"To be defined"}
"

    seed_file "$INTENT_DIR/decision-log.md" "# Decision Log

## $NOW_ISO
- Event: requirement_bootstrapped
- Stage: converge
- Reason: Created initial requirement and intent scaffold
"

    seed_file "$INTENT_DIR/plan.md" "# Plan: $REQ_ID

## Current Intent

- Goal: $GOAL
- Next: refine plan, then compile executable tasks
"

    seed_file "$INTENT_DIR/delegation-map.md" "# Delegation Map: $REQ_ID

- Default execution ladder: \`direct -> delegate -> team\`
"

    seed_file "$INTENT_DIR/resume-index.md" "# Resume Index: $REQ_ID

- Stage: \`discover\`
- Goal: $GOAL
- Lifecycle: initialized
- Updated At: $NOW_ISO

## Next Action

Run /flow:spec.
"
fi

cat > "$REQ_DIR/README.md" <<EOF
# $REQ_ID: ${TITLE:-"To be defined"}

**Status**: Initialized
**Type**: $REQ_TYPE
**Created**: $NOW_FULL

EOF

if [[ -n "$DESCRIPTION" ]]; then
    cat >> "$REQ_DIR/README.md" <<EOF
## Description
$DESCRIPTION

EOF
fi

cat >> "$REQ_DIR/README.md" <<EOF
## Canonical State

- \`harness-state.json\` / \`status.json\`: lifecycle state
- \`devflow/intent/<REQ>/\`: semantic memory and resume entry
- \`context-package.md\`: bootstrap bridge artifact (created by harness pack)

## Next Step

- Requirements: run \`/flow:spec "$REQ_ID"\`
- Bugs: continue with analysis / \`/flow:fix\`
EOF

mkdir -p "$REPO_ROOT/devflow/workspace"
printf '%s\n' "$REQ_ID" > "$REPO_ROOT/devflow/workspace/.current-req"

export DEVFLOW_REQ_ID="$REQ_ID"

if $JSON_MODE; then
    if [[ "$REQ_TYPE" == "bug" ]]; then
        jq -nc \
            --arg req_id "$REQ_ID" \
            --arg req_type "$REQ_TYPE" \
            --arg req_dir "$REQ_DIR" \
            --arg status_file "$REQ_DIR/status.json" \
            --arg title "${TITLE:-}" \
            --arg created_at "$NOW_ISO" \
            '{req_id:$req_id, req_type:$req_type, req_dir:$req_dir, status_file:$status_file, title:$title, created_at:$created_at}'
    else
        jq -nc \
            --arg req_id "$REQ_ID" \
            --arg req_type "$REQ_TYPE" \
            --arg req_dir "$REQ_DIR" \
            --arg intent_dir "$INTENT_DIR" \
            --arg harness_state_file "$REQ_DIR/harness-state.json" \
            --arg title "${TITLE:-}" \
            --arg created_at "$NOW_ISO" \
            '{req_id:$req_id, req_type:$req_type, req_dir:$req_dir, intent_dir:$intent_dir, harness_state_file:$harness_state_file, title:$title, created_at:$created_at}'
    fi
else
    echo ""
    echo "✅ Requirement scaffold created successfully!"
    echo ""
    echo "Requirement ID:    $REQ_ID"
    echo "Type:              $REQ_TYPE"
    echo "Directory:         $REQ_DIR"
    if [[ "$REQ_TYPE" != "bug" ]]; then
        echo "Intent Memory:     $INTENT_DIR"
        echo "Harness State:     $REQ_DIR/harness-state.json"
        echo ""
        echo "Next Steps:"
        echo "  1. Refine intent memory if the goal is still fuzzy"
        echo "  2. Run /flow:spec to compile executable tasks"
        echo "  3. Continue with /flow:dev and subsequent flow commands"
    else
        echo ""
        echo "Next Steps:"
        echo "  1. Run bug analysis"
        echo "  2. Continue with /flow:fix"
    fi
    echo ""
fi
