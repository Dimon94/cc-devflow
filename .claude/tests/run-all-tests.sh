#!/usr/bin/env bash
# run-all-tests.sh - 运行所有测试套件

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 使用说明
usage() {
    cat << EOF
用法: $0 [选项]

运行 CC-DevFlow 测试套件

选项:
  -h, --help              显示此帮助信息
  --scripts               只运行脚本测试
  --commands              只运行命令测试
  --e2e                   只运行端到端测试
  --verbose               详细输出
  --quiet                 安静模式，只显示摘要
  --coverage              生成覆盖率报告
  --fail-fast             第一个失败测试后停止

示例:
  $0                      # 运行所有测试
  $0 --scripts            # 只运行脚本测试
  $0 --verbose            # 详细模式
  $0 --fail-fast          # 快速失败模式

EOF
    exit 0
}

# 解析参数
RUN_SCRIPTS=false
RUN_COMMANDS=false
RUN_E2E=false
VERBOSE=false
QUIET=false
COVERAGE=false
FAIL_FAST=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        --scripts)
            RUN_SCRIPTS=true
            shift
            ;;
        --commands)
            RUN_COMMANDS=true
            shift
            ;;
        --e2e)
            RUN_E2E=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            export VERBOSE=true
            shift
            ;;
        --quiet)
            QUIET=true
            export QUIET=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --fail-fast)
            FAIL_FAST=true
            shift
            ;;
        *)
            echo "错误: 未知参数 $1" >&2
            usage
            ;;
    esac
done

# 如果没有指定类别，运行所有测试
if [[ "$RUN_SCRIPTS" == "false" && "$RUN_COMMANDS" == "false" && "$RUN_E2E" == "false" ]]; then
    RUN_SCRIPTS=true
    RUN_COMMANDS=true
    RUN_E2E=true
fi

# 统计
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# 运行测试套件
run_test_suite() {
    local test_file="$1"
    local suite_name=$(basename "$test_file" .sh)

    ((TOTAL_SUITES++))

    if [[ "$QUIET" != "true" ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BOLD}Running: $suite_name${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    fi

    if bash "$test_file"; then
        ((PASSED_SUITES++))
        if [[ "$QUIET" != "true" ]]; then
            echo -e "${GREEN}✓ Suite passed: $suite_name${NC}"
        fi
        return 0
    else
        ((FAILED_SUITES++))
        echo -e "${RED}✗ Suite failed: $suite_name${NC}"

        if [[ "$FAIL_FAST" == "true" ]]; then
            echo -e "${YELLOW}Fail-fast mode enabled, stopping...${NC}"
            print_final_summary
            exit 1
        fi
        return 1
    fi
}

# 打印最终摘要
print_final_summary() {
    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  Final Test Summary${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Total Suites:  ${BOLD}$TOTAL_SUITES${NC}"
    echo -e "Passed Suites: ${GREEN}${BOLD}$PASSED_SUITES${NC}"
    echo -e "Failed Suites: ${RED}${BOLD}$FAILED_SUITES${NC}"
    echo ""

    if [[ $FAILED_SUITES -eq 0 ]]; then
        echo -e "${GREEN}${BOLD}✓ ALL TEST SUITES PASSED${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}${BOLD}✗ SOME TEST SUITES FAILED${NC}"
        echo ""
        return 1
    fi
}

# 主逻辑
main() {
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  CC-DevFlow Test Runner${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""

    # 运行脚本测试
    if [[ "$RUN_SCRIPTS" == "true" ]]; then
        echo -e "${YELLOW}Running Script Tests...${NC}"
        echo ""

        for test_file in "$SCRIPT_DIR"/scripts/test_*.sh; do
            if [[ -f "$test_file" ]]; then
                run_test_suite "$test_file"
            fi
        done
    fi

    # 运行命令测试
    if [[ "$RUN_COMMANDS" == "true" ]]; then
        echo -e "${YELLOW}Running Command Tests...${NC}"
        echo ""

        for test_file in "$SCRIPT_DIR"/commands/test_*.sh; do
            if [[ -f "$test_file" ]]; then
                run_test_suite "$test_file"
            else
                if [[ "$QUIET" != "true" ]]; then
                    echo -e "${YELLOW}No command tests found yet${NC}"
                fi
                break
            fi
        done
    fi

    # 运行端到端测试
    if [[ "$RUN_E2E" == "true" ]]; then
        echo -e "${YELLOW}Running End-to-End Tests...${NC}"
        echo ""

        for test_file in "$SCRIPT_DIR"/e2e/test_*.sh; do
            if [[ -f "$test_file" ]]; then
                run_test_suite "$test_file"
            else
                if [[ "$QUIET" != "true" ]]; then
                    echo -e "${YELLOW}No e2e tests found yet${NC}"
                fi
                break
            fi
        done
    fi

    # 生成覆盖率报告
    if [[ "$COVERAGE" == "true" ]]; then
        echo ""
        echo -e "${YELLOW}Generating coverage report...${NC}"
        echo -e "${YELLOW}(Coverage reporting not yet implemented)${NC}"
    fi

    # 打印最终摘要
    print_final_summary
}

# 运行主逻辑并捕获退出码
main
exit_code=$?

exit $exit_code