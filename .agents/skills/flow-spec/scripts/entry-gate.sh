#!/bin/bash
# ============================================================================
# flow-spec Entry Gate
# ============================================================================
# [INPUT]: REQ_ID (参数或自动检测)
# [OUTPUT]: 验证结果 (exit code 0=pass, 1=fail)
# [POS]: flow-spec 的入口检查，验证前置条件
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# ============================================================================

set -euo pipefail

# ============================================================================
# 参数解析
# ============================================================================

REQ_ID=""
SKIP_TECH=false
SKIP_UI=false
RETRY=false
FROM_STAGE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tech)
            SKIP_TECH=true
            shift
            ;;
        --skip-ui)
            SKIP_UI=true
            shift
            ;;
        --retry)
            RETRY=true
            shift
            ;;
        --from=*)
            FROM_STAGE="${1#*=}"
            shift
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            fi
            shift
            ;;
    esac
done

# ============================================================================
# REQ_ID 解析
# ============================================================================

if [[ -z "$REQ_ID" ]]; then
    # 尝试从分支名推断
    BRANCH=$(git branch --show-current 2>/dev/null || echo "")
    if [[ "$BRANCH" =~ feature/(REQ-[0-9]+) ]]; then
        REQ_ID="${BASH_REMATCH[1]}"
    fi
fi

if [[ -z "$REQ_ID" ]]; then
    # 尝试从 orchestration_status.json 获取
    STATUS_FILE="devflow/requirements/*/orchestration_status.json"
    for f in $STATUS_FILE; do
        if [[ -f "$f" ]]; then
            REQ_ID=$(jq -r '.req_id // empty' "$f" 2>/dev/null || echo "")
            if [[ -n "$REQ_ID" ]]; then
                break
            fi
        fi
    done
fi

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: REQ_ID not provided and cannot be auto-detected"
    echo "Usage: entry-gate.sh REQ-XXX [--skip-tech] [--skip-ui]"
    exit 1
fi

# ============================================================================
# 路径定义
# ============================================================================

REQ_DIR="devflow/requirements/${REQ_ID}"
BRAINSTORM_FILE="${REQ_DIR}/BRAINSTORM.md"
RESEARCH_FILE="${REQ_DIR}/research/research.md"
STATUS_FILE="${REQ_DIR}/orchestration_status.json"

# ============================================================================
# 检查 1: REQ_ID 格式
# ============================================================================

if [[ ! "$REQ_ID" =~ ^REQ-[0-9]+$ ]]; then
    echo "ERROR: Invalid REQ_ID format: $REQ_ID"
    echo "Expected: REQ-XXX (e.g., REQ-001, REQ-123)"
    exit 1
fi

echo "✓ REQ_ID format valid: $REQ_ID"

# ============================================================================
# 检查 2: 目录存在
# ============================================================================

if [[ ! -d "$REQ_DIR" ]]; then
    echo "ERROR: Requirement directory not found: $REQ_DIR"
    echo "Run /flow-init first"
    exit 1
fi

echo "✓ Requirement directory exists: $REQ_DIR"

# ============================================================================
# 检查 3: BRAINSTORM.md 存在
# ============================================================================

if [[ ! -f "$BRAINSTORM_FILE" ]]; then
    echo "ERROR: BRAINSTORM.md not found: $BRAINSTORM_FILE"
    echo "Run /flow-init first"
    exit 1
fi

echo "✓ BRAINSTORM.md exists"

# ============================================================================
# 检查 4: Research 完成
# ============================================================================

if [[ ! -f "$RESEARCH_FILE" ]]; then
    echo "ERROR: research.md not found: $RESEARCH_FILE"
    echo "Run /flow-init with research first"
    exit 1
fi

# 检查 research.md 无 TODO/PLACEHOLDER
if grep -qE '\{\{[A-Z_]+\}\}|TODO|TBD|PLACEHOLDER' "$RESEARCH_FILE"; then
    echo "WARNING: research.md contains TODO/PLACEHOLDER markers"
    echo "Consider completing research before proceeding"
fi

echo "✓ Research file exists"

# ============================================================================
# 检查 5: Status Check
# ============================================================================

if [[ -f "$STATUS_FILE" ]]; then
    CURRENT_STATUS=$(jq -r '.status // "unknown"' "$STATUS_FILE")

    VALID_STATUSES=("initialized" "spec_failed" "prd_complete" "tech_design_complete" "ui_complete")

    if [[ "$RETRY" == "true" ]]; then
        echo "✓ Retry mode: bypassing status check"
    elif [[ ! " ${VALID_STATUSES[*]} " =~ " ${CURRENT_STATUS} " ]]; then
        echo "ERROR: Invalid status for /flow-spec: $CURRENT_STATUS"
        echo "Valid statuses: ${VALID_STATUSES[*]}"
        exit 1
    else
        echo "✓ Status valid: $CURRENT_STATUS"
    fi
else
    echo "WARNING: orchestration_status.json not found, creating..."
fi

# ============================================================================
# 输出结果
# ============================================================================

echo ""
echo "============================================"
echo "Entry Gate PASSED"
echo "============================================"
echo "REQ_ID: $REQ_ID"
echo "REQ_DIR: $REQ_DIR"
echo "SKIP_TECH: $SKIP_TECH"
echo "SKIP_UI: $SKIP_UI"
echo "FROM_STAGE: ${FROM_STAGE:-prd}"
echo "============================================"

# 输出 JSON 供后续脚本使用
cat << EOF
{
  "req_id": "$REQ_ID",
  "req_dir": "$REQ_DIR",
  "skip_tech": $SKIP_TECH,
  "skip_ui": $SKIP_UI,
  "from_stage": "${FROM_STAGE:-prd}",
  "brainstorm_file": "$BRAINSTORM_FILE",
  "research_file": "$RESEARCH_FILE"
}
EOF

exit 0
