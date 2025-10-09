#!/usr/bin/env bash

# run_all_constitution_tests.sh - 运行所有 Constitution 测试套件
#
# 执行所有 Constitution 一致性验证测试

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# 测试套件列表
# ============================================================================

declare -a TEST_SUITES=(
    "test_version_consistency.sh"
    "test_article_coverage.sh"
    "test_template_completeness.sh"
    "test_agent_assignment.sh"
)

# ============================================================================
# 运行测试
# ============================================================================

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  CC-DevFlow Constitution Test Suite${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

total_suites=0
passed_suites=0
failed_suites=0
skipped_suites=0

for test_suite in "${TEST_SUITES[@]}"; do
    test_file="$SCRIPT_DIR/$test_suite"

    if [[ ! -f "$test_file" ]]; then
        echo -e "${YELLOW}⚠${NC}  Skipping $test_suite (not found)"
        ((skipped_suites++))
        continue
    fi

    ((total_suites++))

    echo -e "${BLUE}▶${NC}  Running $test_suite..."
    echo ""

    # 给脚本添加执行权限
    chmod +x "$test_file"

    # 运行测试
    if bash "$test_file"; then
        echo -e "${GREEN}✅${NC}  $test_suite PASSED"
        ((passed_suites++))
    else
        echo -e "${RED}❌${NC}  $test_suite FAILED"
        ((failed_suites++))
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
done

# ============================================================================
# 总结报告
# ============================================================================

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Test Summary${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Total Test Suites: $total_suites"
echo -e "  ${GREEN}Passed: $passed_suites${NC}"
if [[ $failed_suites -gt 0 ]]; then
    echo -e "  ${RED}Failed: $failed_suites${NC}"
fi
if [[ $skipped_suites -gt 0 ]]; then
    echo -e "  ${YELLOW}Skipped: $skipped_suites${NC}"
fi
echo ""

# 计算成功率
if [[ $total_suites -gt 0 ]]; then
    success_rate=$((passed_suites * 100 / total_suites))
    echo "  Success Rate: $success_rate%"
    echo ""
fi

if [[ $failed_suites -eq 0 ]]; then
    echo -e "${GREEN}✅ All Constitution tests passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some Constitution tests failed${NC}"
    echo ""
    echo "Fix the failing tests and run again:"
    echo "  bash $0"
    echo ""
    exit 1
fi
