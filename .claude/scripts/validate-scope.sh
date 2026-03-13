#!/usr/bin/env bash
# [INPUT]: 依赖 proposal.md 和 Delta spec.md
# [OUTPUT]: 生成 scope-creep-report.md
# [POS]: 反扩散检查脚本，被 /flow:spec 和 /flow:verify 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

REQ_ID="${1:-}"
if [[ -z "$REQ_ID" ]]; then
  error "Usage: validate-scope.sh <REQ-ID>"
  exit 1
fi

REQ_DIR="devflow/requirements/${REQ_ID}"
PROPOSAL_FILE="${REQ_DIR}/proposal.md"
REPORT_FILE="${REQ_DIR}/scope-creep-report.md"

# ============================================================================
# Validation
# ============================================================================

if [[ ! -f "$PROPOSAL_FILE" ]]; then
  error "proposal.md not found: $PROPOSAL_FILE"
  exit 1
fi

# 查找所有 Delta spec.md 文件
DELTA_SPECS=$(find "${REQ_DIR}/specs" -name "spec.md" 2>/dev/null || true)

if [[ -z "$DELTA_SPECS" ]]; then
  warn "No Delta specs found in ${REQ_DIR}/specs/"
  exit 0
fi

# ============================================================================
# Extract Original Intent
# ============================================================================

info "Extracting original intent from proposal.md..."

# 提取 ## What 章节（原始需求描述）
ORIGINAL_INTENT=$(awk '
  /^## What/ { flag=1; next }
  /^## / { flag=0 }
  flag { print }
' "$PROPOSAL_FILE" | sed '/^$/d')

if [[ -z "$ORIGINAL_INTENT" ]]; then
  warn "No 'What' section found in proposal.md"
  ORIGINAL_INTENT="(No explicit requirements found)"
fi

# ============================================================================
# Extract Delta Requirements
# ============================================================================

info "Extracting ADDED requirements from Delta specs..."

ADDED_REQUIREMENTS=""
SCOPE_CREEP_COUNT=0

while IFS= read -r delta_file; do
  module=$(basename "$(dirname "$delta_file")")

  # 提取 ADDED Requirements 章节
  added=$(awk '
    /^## ADDED Requirements/ { flag=1; next }
    /^## / { flag=0 }
    flag && /^### Requirement:/ { print $0 }
  ' "$delta_file")

  if [[ -n "$added" ]]; then
    ADDED_REQUIREMENTS+="
### Module: $module
$added
"
  fi
done <<< "$DELTA_SPECS"

# ============================================================================
# Detect Scope Creep
# ============================================================================

info "Detecting scope creep..."

# 简单启发式：检查 ADDED 需求中的关键词是否在原始意图中出现
CREEP_ITEMS=""

while IFS= read -r line; do
  if [[ "$line" =~ ^###\ Requirement:\ (.+)$ ]]; then
    req_name="${BASH_REMATCH[1]}"

    # 提取关键词（去除常见词）
    keywords=$(echo "$req_name" | tr '[:upper:]' '[:lower:]' | \
      sed -e 's/the //g' -e 's/a //g' -e 's/an //g' -e 's/and //g' | \
      tr -s ' ' '\n' | grep -v '^$')

    # 检查关键词是否在原始意图中
    found=false
    while IFS= read -r keyword; do
      if echo "$ORIGINAL_INTENT" | grep -qi "$keyword"; then
        found=true
        break
      fi
    done <<< "$keywords"

    if [[ "$found" == "false" ]]; then
      CREEP_ITEMS+="- ⚠️ $req_name (not mentioned in original intent)
"
      ((SCOPE_CREEP_COUNT++))
    else
      CREEP_ITEMS+="- ✅ $req_name
"
    fi
  fi
done <<< "$ADDED_REQUIREMENTS"

# ============================================================================
# Generate Report
# ============================================================================

info "Generating scope-creep-report.md..."

cat > "$REPORT_FILE" <<EOF
# Scope Creep Report - ${REQ_ID}

> **Generated**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
> **Status**: $([ $SCOPE_CREEP_COUNT -eq 0 ] && echo "✅ No scope creep detected" || echo "⚠️ Potential scope creep detected")

---

## Original Intent (from proposal.md)

${ORIGINAL_INTENT}

---

## Current Delta (from specs/)

${ADDED_REQUIREMENTS:-No ADDED requirements found}

---

## Analysis

${CREEP_ITEMS:-No requirements to analyze}

---

## Summary

- **Total ADDED requirements**: $(echo "$ADDED_REQUIREMENTS" | grep -c "^### Requirement:" || echo 0)
- **Potential scope creep**: ${SCOPE_CREEP_COUNT}

## Recommendation

EOF

if [[ $SCOPE_CREEP_COUNT -eq 0 ]]; then
  cat >> "$REPORT_FILE" <<EOF
✅ All ADDED requirements align with original intent. Safe to proceed.
EOF
else
  cat >> "$REPORT_FILE" <<EOF
⚠️ ${SCOPE_CREEP_COUNT} requirement(s) may be beyond original scope.

**Action Required**:
1. Review each ⚠️ marked requirement
2. If necessary, update proposal.md to include these features
3. If not necessary, remove from Delta specs
4. Consider creating separate REQs for additional features

**Constitutional Reference**: Article X - Requirement Boundary
EOF
fi

# ============================================================================
# Output
# ============================================================================

success "Scope creep report generated: $REPORT_FILE"

if [[ $SCOPE_CREEP_COUNT -gt 0 ]]; then
  warn "⚠️ Potential scope creep detected: ${SCOPE_CREEP_COUNT} requirement(s)"
  echo ""
  echo "Review the report and confirm before proceeding:"
  echo "  cat $REPORT_FILE"
  exit 1
else
  success "✅ No scope creep detected"
  exit 0
fi
