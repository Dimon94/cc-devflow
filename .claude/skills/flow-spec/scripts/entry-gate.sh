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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
COMMON_SH="${REPO_ROOT}/.claude/scripts/common.sh"

if [[ -f "$COMMON_SH" ]]; then
    # shellcheck source=/dev/null
    source "$COMMON_SH"
fi

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
    # 优先复用当前主线的 REQ 检测
    if declare -F get_current_req_id >/dev/null 2>&1; then
        REQ_ID="$(get_current_req_id)"
    fi
fi

if [[ -z "$REQ_ID" ]]; then
    # 兼容历史分支命名推断
    BRANCH=$(git branch --show-current 2>/dev/null || echo "")
    if [[ "$BRANCH" =~ feature/(REQ-[0-9]+) ]]; then
        REQ_ID="${BASH_REMATCH[1]}"
    fi
fi

if [[ -z "$REQ_ID" ]]; then
    # 最后回退兼容状态扫描
    STATUS_GLOB="devflow/requirements/*/orchestration_status.json"
    for f in $STATUS_GLOB; do
        if [[ -f "$f" ]]; then
            REQ_ID=$(jq -r '.reqId // .req_id // empty' "$f" 2>/dev/null || echo "")
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
HARNESS_STATE_FILE="${REQ_DIR}/harness-state.json"

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

if [[ -f "$HARNESS_STATE_FILE" ]]; then
    CURRENT_STATUS=$(jq -r '.status // "unknown"' "$HARNESS_STATE_FILE")
    PRIMARY_VALID_STATUSES=("initialized" "planned" "spec_failed")
    if [[ "$RETRY" == "true" ]]; then
        echo "✓ Retry mode: bypassing status check"
    elif [[ ! " ${PRIMARY_VALID_STATUSES[*]} " =~ " ${CURRENT_STATUS} " ]]; then
        echo "ERROR: Invalid harness status for /flow-spec: $CURRENT_STATUS"
        echo "Valid statuses: ${PRIMARY_VALID_STATUSES[*]}"
        exit 1
    else
        echo "✓ Harness status valid: $CURRENT_STATUS"
    fi
elif [[ -f "$STATUS_FILE" ]]; then
    CURRENT_STATUS=$(jq -r '.status // "unknown"' "$STATUS_FILE")
    PRIMARY_VALID_STATUSES=("initialized" "planned" "spec_failed")
    RAW_COMPAT_PHASE=$(jq -r '.phase // ""' "$STATUS_FILE")
    RAW_COMPAT_STAGE="$RAW_COMPAT_PHASE"
    if [[ -z "$RAW_COMPAT_STAGE" || "$RAW_COMPAT_STAGE" == "null" || "$RAW_COMPAT_STAGE" == "unknown" ]]; then
        RAW_COMPAT_STAGE="$CURRENT_STATUS"
    fi
    NORMALIZED_COMPAT_STAGE=""
    if declare -F normalize_mainline_stage >/dev/null 2>&1; then
        NORMALIZED_COMPAT_STAGE=$(normalize_mainline_stage "$RAW_COMPAT_STAGE")
    fi

    if [[ "$RETRY" == "true" ]]; then
        echo "✓ Retry mode: bypassing status check"
    elif [[ " ${PRIMARY_VALID_STATUSES[*]} " =~ " ${CURRENT_STATUS} " ]]; then
        echo "✓ Compatibility status valid: $CURRENT_STATUS"
    elif [[ "$NORMALIZED_COMPAT_STAGE" == "spec" ]]; then
        echo "WARNING: Compatibility state detected; normalized stage: $NORMALIZED_COMPAT_STAGE"
        echo "Proceeding via compatibility fallback; current mainline should prefer initialized/planned."
    else
        echo "ERROR: Invalid status for /flow-spec: $CURRENT_STATUS"
        echo "Valid statuses: ${PRIMARY_VALID_STATUSES[*]}"
        exit 1
    fi
else
    echo "WARNING: no harness-state/orchestration_status compatibility file found"
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
echo "FROM_STAGE: ${FROM_STAGE:-spec}"
echo "============================================"

# 输出 JSON 供后续脚本使用
cat << EOF
{
  "req_id": "$REQ_ID",
  "req_dir": "$REQ_DIR",
  "skip_tech": $SKIP_TECH,
  "skip_ui": $SKIP_UI,
  "from_stage": "${FROM_STAGE:-spec}",
  "brainstorm_file": "$BRAINSTORM_FILE",
  "research_file": "$RESEARCH_FILE"
}
EOF

exit 0
