#!/bin/bash
# ============================================================================
# flow-spec Exit Gate
# ============================================================================
# [INPUT]: REQ_ID, 生成的文件列表
# [OUTPUT]: 验证结果 (exit code 0=pass, 1=fail)
# [POS]: flow-spec 的出口检查，验证所有输出文件
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# ============================================================================

set -euo pipefail

# ============================================================================
# 参数解析
# ============================================================================

REQ_ID=""
SKIP_TECH=false
SKIP_UI=false

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
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: REQ_ID required"
    exit 1
fi

# ============================================================================
# 路径定义
# ============================================================================

REQ_DIR="devflow/requirements/${REQ_ID}"
PRD_FILE="${REQ_DIR}/PRD.md"
TECH_FILE="${REQ_DIR}/TECH_DESIGN.md"
UI_FILE="${REQ_DIR}/UI_PROTOTYPE.html"
EPIC_FILE="${REQ_DIR}/EPIC.md"
TASKS_FILE="${REQ_DIR}/TASKS.md"
STATUS_FILE="${REQ_DIR}/orchestration_status.json"

ERRORS=()
WARNINGS=()

# ============================================================================
# 检查 1: PRD.md
# ============================================================================

echo "Checking PRD.md..."

if [[ ! -f "$PRD_FILE" ]]; then
    ERRORS+=("PRD.md not found")
else
    # 检查 placeholder
    if grep -qE '\{\{[A-Z_]+\}\}' "$PRD_FILE"; then
        ERRORS+=("PRD.md contains {{PLACEHOLDER}} markers")
    fi
    echo "✓ PRD.md exists and valid"
fi

# ============================================================================
# 检查 2: TECH_DESIGN.md (如果未跳过)
# ============================================================================

if [[ "$SKIP_TECH" == "false" ]]; then
    echo "Checking TECH_DESIGN.md..."

    if [[ ! -f "$TECH_FILE" ]]; then
        ERRORS+=("TECH_DESIGN.md not found (use --skip-tech to skip)")
    else
        if grep -qE '\{\{[A-Z_]+\}\}' "$TECH_FILE"; then
            ERRORS+=("TECH_DESIGN.md contains {{PLACEHOLDER}} markers")
        fi

        # 检查必需章节
        if ! grep -q "## 1. System Architecture" "$TECH_FILE"; then
            WARNINGS+=("TECH_DESIGN.md missing System Architecture section")
        fi
        if ! grep -q "## 4. API Design" "$TECH_FILE"; then
            WARNINGS+=("TECH_DESIGN.md missing API Design section")
        fi

        echo "✓ TECH_DESIGN.md exists"
    fi
else
    echo "⊘ TECH_DESIGN.md skipped"
fi

# ============================================================================
# 检查 3: UI_PROTOTYPE.html (如果未跳过)
# ============================================================================

if [[ "$SKIP_UI" == "false" ]]; then
    echo "Checking UI_PROTOTYPE.html..."

    # 检查 PRD 是否有 UI 关键词
    HAS_UI_KEYWORDS=false
    if [[ -f "$PRD_FILE" ]]; then
        if grep -qiE '用户界面|前端|页面|交互|UI|界面设计' "$PRD_FILE"; then
            HAS_UI_KEYWORDS=true
        fi
    fi

    if [[ "$HAS_UI_KEYWORDS" == "true" ]]; then
        if [[ ! -f "$UI_FILE" ]]; then
            WARNINGS+=("UI_PROTOTYPE.html not found but PRD contains UI keywords")
        else
            echo "✓ UI_PROTOTYPE.html exists"
        fi
    else
        echo "⊘ UI_PROTOTYPE.html not required (no UI keywords in PRD)"
    fi
else
    echo "⊘ UI_PROTOTYPE.html skipped"
fi

# ============================================================================
# 检查 4: EPIC.md
# ============================================================================

echo "Checking EPIC.md..."

if [[ ! -f "$EPIC_FILE" ]]; then
    ERRORS+=("EPIC.md not found")
else
    if grep -qE '\{\{[A-Z_]+\}\}' "$EPIC_FILE"; then
        ERRORS+=("EPIC.md contains {{PLACEHOLDER}} markers")
    fi
    echo "✓ EPIC.md exists and valid"
fi

# ============================================================================
# 检查 5: TASKS.md
# ============================================================================

echo "Checking TASKS.md..."

if [[ ! -f "$TASKS_FILE" ]]; then
    ERRORS+=("TASKS.md not found")
else
    if grep -qE '\{\{[A-Z_]+\}\}' "$TASKS_FILE"; then
        ERRORS+=("TASKS.md contains {{PLACEHOLDER}} markers")
    fi

    # 检查 TDD 顺序: Phase 2 (Tests) 应该在 Phase 3 (Implementation) 之前
    PHASE2_LINE=$(grep -n "Phase 2" "$TASKS_FILE" | head -1 | cut -d: -f1 || echo "0")
    PHASE3_LINE=$(grep -n "Phase 3" "$TASKS_FILE" | head -1 | cut -d: -f1 || echo "0")

    if [[ "$PHASE2_LINE" -gt 0 && "$PHASE3_LINE" -gt 0 ]]; then
        if [[ "$PHASE2_LINE" -gt "$PHASE3_LINE" ]]; then
            ERRORS+=("TASKS.md TDD order incorrect: Phase 2 (Tests) should come before Phase 3 (Implementation)")
        else
            echo "✓ TASKS.md TDD order correct"
        fi
    fi

    echo "✓ TASKS.md exists"
fi

# ============================================================================
# 更新状态
# ============================================================================

if [[ ${#ERRORS[@]} -eq 0 ]]; then
    echo "Updating orchestration_status.json..."

    # 构建输出文件列表
    OUTPUTS='["PRD.md", "EPIC.md", "TASKS.md"'
    if [[ "$SKIP_TECH" == "false" && -f "$TECH_FILE" ]]; then
        OUTPUTS+=', "TECH_DESIGN.md"'
    fi
    if [[ "$SKIP_UI" == "false" && -f "$UI_FILE" ]]; then
        OUTPUTS+=', "UI_PROTOTYPE.html"'
    fi
    OUTPUTS+=']'

    # 更新状态文件
    if [[ -f "$STATUS_FILE" ]]; then
        jq --arg status "spec_complete" \
           --arg phase "spec" \
           --argjson outputs "$OUTPUTS" \
           '.status = $status | .phase = $phase | .outputs = $outputs | .updated_at = now | .spec_completed_at = now' \
           "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    fi

    echo "✓ Status updated to spec_complete"
fi

# ============================================================================
# 输出结果
# ============================================================================

echo ""
echo "============================================"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo "Exit Gate FAILED"
    echo "============================================"
    echo ""
    echo "ERRORS:"
    for err in "${ERRORS[@]}"; do
        echo "  ✗ $err"
    done
fi

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    echo ""
    echo "WARNINGS:"
    for warn in "${WARNINGS[@]}"; do
        echo "  ⚠ $warn"
    done
fi

if [[ ${#ERRORS[@]} -eq 0 ]]; then
    echo "Exit Gate PASSED"
    echo "============================================"
    echo ""
    echo "Generated files:"
    echo "  - PRD.md"
    [[ "$SKIP_TECH" == "false" && -f "$TECH_FILE" ]] && echo "  - TECH_DESIGN.md"
    [[ "$SKIP_UI" == "false" && -f "$UI_FILE" ]] && echo "  - UI_PROTOTYPE.html"
    echo "  - EPIC.md"
    echo "  - TASKS.md"
    echo ""
    echo "Next step: /flow-dev \"$REQ_ID\""
    exit 0
else
    exit 1
fi
