#!/usr/bin/env bash
# =============================================================================
# validate-research.sh - Research.md 质量验证脚本
# =============================================================================
# Purpose: 验证 research.md 是否符合 spec-kit Decision/Rationale/Alternatives 格式
#          确保无 TODO 占位符、无空章节、格式完整
#
# Usage:
#   validate-research.sh <REQ_DIR> [--strict]
#
# Exit Codes:
#   0 - 验证通过
#   1 - 验证失败（输出具体错误）
#
# Constitution Compliance:
#   - Article X.1 (Forced Clarification): 检查 NEEDS CLARIFICATION 标记
#   - Article X.2 (No Speculation): 禁止推测性技术细节
#   - Article I.1 (Complete Implementation): 禁止 TODO/PLACEHOLDER
# =============================================================================

set -euo pipefail

# ────────────────────────────────────────────────────────────────────────────
# Configuration
# ────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# shellcheck source=.claude/scripts/common.sh
source "$SCRIPT_DIR/common.sh"

STRICT_MODE=false

# ────────────────────────────────────────────────────────────────────────────
# Usage
# ────────────────────────────────────────────────────────────────────────────

usage() {
  cat <<'USAGE'
Usage: validate-research.sh <REQ_DIR> [--strict]

Validates research.md quality and structure:
  - Checks for mandatory sections (Research Summary, Decisions, etc.)
  - Validates Decision/Rationale/Alternatives blocks
  - Detects TODO placeholders and empty content
  - Verifies NEEDS CLARIFICATION markers

Arguments:
  REQ_DIR    Path to requirement directory (e.g., devflow/requirements/REQ-123)
  --strict   Exit with code 1 if any validation fails (default: warnings only)

Examples:
  validate-research.sh devflow/requirements/REQ-123
  validate-research.sh devflow/requirements/REQ-123 --strict
USAGE
}

# ────────────────────────────────────────────────────────────────────────────
# Argument Parsing
# ────────────────────────────────────────────────────────────────────────────

if [[ $# -lt 1 ]] || [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

REQ_DIR="$1"
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict)
      STRICT_MODE=true
      shift
      ;;
    *)
      echo "❌ Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

# ────────────────────────────────────────────────────────────────────────────
# Validation Functions
# ────────────────────────────────────────────────────────────────────────────

validate_file_exists() {
  local research_md="$REQ_DIR/research/research.md"

  if [[ ! -f "$research_md" ]]; then
    echo "❌ LEVEL 1 FAILED: research.md not found at $research_md"
    return 1
  fi

  echo "✅ LEVEL 1 PASSED: research.md exists"
  return 0
}

validate_structure() {
  local research_md="$REQ_DIR/research/research.md"
  local errors=0

  echo "🔍 LEVEL 2: Validating structure..."

  # 必需章节检查
  local required_sections=(
    "Research Summary"
    "Decisions"
  )

  for section in "${required_sections[@]}"; do
    if ! grep -qE "^##\s+$section" "$research_md"; then
      echo "  ❌ Missing section: ## $section"
      ((errors++))
    else
      echo "  ✅ Found section: ## $section"
    fi
  done

  # 检查至少有一个 Decision block
  if ! grep -qE "^###\s+R[0-9]+" "$research_md"; then
    echo "  ❌ No Decision blocks found (expected ### R001, R002, etc.)"
    ((errors++))
  else
    local decision_count
    decision_count=$(grep -cE "^###\s+R[0-9]+" "$research_md" || echo 0)
    echo "  ✅ Found $decision_count Decision block(s)"
  fi

  if [[ $errors -eq 0 ]]; then
    echo "✅ LEVEL 2 PASSED: Structure valid"
    return 0
  else
    echo "❌ LEVEL 2 FAILED: $errors structure error(s)"
    return 1
  fi
}

validate_content_quality() {
  local research_md="$REQ_DIR/research/research.md"
  local errors=0

  echo "🔍 LEVEL 3: Validating content quality..."

  # 检查 TODO 占位符
  local todo_count
  todo_count=$(grep -ciE "TODO|FIXME|XXX|PLACEHOLDER" "$research_md" 2>/dev/null || echo "0")
  todo_count=$(echo "$todo_count" | head -1)  # 只取第一行
  if [[ $todo_count -gt 0 ]]; then
    echo "  ❌ Found $todo_count TODO/PLACEHOLDER marker(s):"
    grep -niE "TODO|FIXME|XXX|PLACEHOLDER" "$research_md" | head -5 | while IFS= read -r line; do
      echo "     $line"
    done
    ((errors++))
  else
    echo "  ✅ No TODO/PLACEHOLDER markers"
  fi

  # 检查 {{PLACEHOLDER}} 格式
  local placeholder_count
  placeholder_count=$(grep -coE '\{\{[^}]+\}\}' "$research_md" 2>/dev/null || echo "0")
  placeholder_count=$(echo "$placeholder_count" | head -1)  # 只取第一行
  if [[ $placeholder_count -gt 0 ]]; then
    echo "  ❌ Found $placeholder_count {{PLACEHOLDER}} marker(s)"
    grep -nE '\{\{[^}]+\}\}' "$research_md" | head -5 | while IFS= read -r line; do
      echo "     $line"
    done
    ((errors++))
  else
    echo "  ✅ No {{PLACEHOLDER}} markers"
  fi

  # 检查 Decision/Rationale/Alternatives 完整性
  local decision_blocks
  decision_blocks=$(grep -cE "^###\s+R[0-9]+" "$research_md" 2>/dev/null || echo "0")
  decision_blocks=$(echo "$decision_blocks" | head -1)  # 只取第一行

  if [[ $decision_blocks -gt 0 ]]; then
    echo "  🔍 Checking $decision_blocks Decision block(s)..."

    local incomplete_blocks=0
    while IFS= read -r block_line; do
      local block_num
      block_num=$(echo "$block_line" | grep -oE "R[0-9]+")

      # 检查该 block 是否有 Decision/Rationale/Alternatives
      local has_decision has_rationale has_alternatives
      has_decision=$(grep -cE "^- Decision:|^- \*\*Decision\*\*:" "$research_md" 2>/dev/null || echo "0")
      has_decision=$(echo "$has_decision" | head -1)
      has_rationale=$(grep -cE "^- Rationale:|^- \*\*Rationale\*\*:" "$research_md" 2>/dev/null || echo "0")
      has_rationale=$(echo "$has_rationale" | head -1)
      has_alternatives=$(grep -cE "^- Alternatives considered:|^- \*\*Alternatives Considered\*\*:" "$research_md" 2>/dev/null || echo "0")
      has_alternatives=$(echo "$has_alternatives" | head -1)

      if [[ $has_decision -eq 0 ]] || [[ $has_rationale -eq 0 ]] || [[ $has_alternatives -eq 0 ]]; then
        echo "     ❌ Block $block_num: incomplete (missing Decision/Rationale/Alternatives)"
        ((incomplete_blocks++))
      fi
    done < <(grep -nE "^###\s+R[0-9]+" "$research_md")

    if [[ $incomplete_blocks -gt 0 ]]; then
      echo "  ❌ $incomplete_blocks block(s) incomplete"
      ((errors++))
    else
      echo "  ✅ All Decision blocks complete"
    fi
  fi

  # 检查空章节
  if grep -qE "^##.*\n\n_No research" "$research_md"; then
    echo "  ⚠️  Found empty sections (acceptable if research not started)"
  fi

  if [[ $errors -eq 0 ]]; then
    echo "✅ LEVEL 3 PASSED: Content quality valid"
    return 0
  else
    echo "❌ LEVEL 3 FAILED: $errors content error(s)"
    return 1
  fi
}

validate_constitution() {
  local research_md="$REQ_DIR/research/research.md"
  local errors=0

  echo "🔍 LEVEL 4: Constitution compliance check..."

  # Article X.1 (Forced Clarification)
  local needs_clarification_count
  needs_clarification_count=$(grep -ciE "NEEDS CLARIFICATION" "$research_md" 2>/dev/null || echo "0")
  needs_clarification_count=$(echo "$needs_clarification_count" | head -1)  # 只取第一行
  if [[ $needs_clarification_count -gt 0 ]]; then
    echo "  ✅ Article X.1: Found $needs_clarification_count NEEDS CLARIFICATION marker(s)"
  else
    echo "  ℹ️  Article X.1: No unresolved questions (acceptable if research complete)"
  fi

  # Article X.2 (No Speculation) - 检查推测性语言
  local speculation_patterns=(
    "might|maybe|probably|possibly|perhaps"
    "could be|should be|would be"
    "in the future|future-proof|预留|扩展性"
  )

  for pattern in "${speculation_patterns[@]}"; do
    if grep -qiE "$pattern" "$research_md"; then
      echo "  ⚠️  Article X.2: Found speculative language: '$pattern'"
      echo "     (Review context - acceptable if explaining rationale)"
    fi
  done

  # Article I.1 (Complete Implementation)
  if grep -qiE "暂时|临时|简化版|simplified|temporary|partial" "$research_md"; then
    echo "  ❌ Article I.1: Found partial implementation language"
    ((errors++))
  else
    echo "  ✅ Article I.1: No partial implementation markers"
  fi

  if [[ $errors -eq 0 ]]; then
    echo "✅ LEVEL 4 PASSED: Constitution compliant"
    return 0
  else
    echo "❌ LEVEL 4 FAILED: $errors constitution violation(s)"
    return 1
  fi
}

# ────────────────────────────────────────────────────────────────────────────
# Main Execution
# ────────────────────────────────────────────────────────────────────────────

main() {
  echo "════════════════════════════════════════════════════════════════════════"
  echo "Research.md Quality Validation"
  echo "════════════════════════════════════════════════════════════════════════"
  echo "REQ_DIR: $REQ_DIR"
  echo "MODE: $(if $STRICT_MODE; then echo "STRICT (fail on errors)"; else echo "LENIENT (warnings only)"; fi)"
  echo ""

  local total_errors=0

  # Run all validation levels
  validate_file_exists || ((total_errors++))
  echo ""

  validate_structure || ((total_errors++))
  echo ""

  validate_content_quality || ((total_errors++))
  echo ""

  validate_constitution || ((total_errors++))
  echo ""

  # ──────────────────────────────────────────────────────────────────────────
  # Final Report
  # ──────────────────────────────────────────────────────────────────────────

  echo "════════════════════════════════════════════════════════════════════════"
  if [[ $total_errors -eq 0 ]]; then
    echo "✅ ALL VALIDATIONS PASSED"
    echo "research.md is ready for /flow-prd"
    echo "════════════════════════════════════════════════════════════════════════"
    return 0
  else
    echo "❌ VALIDATION FAILED: $total_errors level(s) failed"
    echo ""
    echo "Next Steps:"
    echo "  1. Review errors above"
    echo "  2. Update research.md to fix issues"
    echo "  3. Re-run: validate-research.sh $REQ_DIR"
    echo ""
    echo "Common Fixes:"
    echo "  - Remove TODO markers → Fill with actual decisions"
    echo "  - Add missing sections → Use RESEARCH_TEMPLATE.md"
    echo "  - Complete Decision blocks → Add Rationale + Alternatives"
    echo "════════════════════════════════════════════════════════════════════════"

    if $STRICT_MODE; then
      return 1
    else
      echo "⚠️  Running in LENIENT mode - returning success despite errors"
      return 0
    fi
  fi
}

main
