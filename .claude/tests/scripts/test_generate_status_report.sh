#!/usr/bin/env bash
# test_generate_status_report.sh - 测试 generate-status-report.sh (基础测试)

# 加载测试框架
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

# 脚本路径
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT_SCRIPT="$REPO_ROOT/scripts/generate-status-report.sh"

# ============================================================================
# 测试帮助信息
# ============================================================================

test_help_flag() {
    describe "Should show help with --help"

    # Act
    local output=$(bash "$REPORT_SCRIPT" --help 2>&1)

    # Assert
    assert_contains "$output" "用法:" "Should show usage"
    assert_contains "$output" "generate-status-report.sh" "Should mention script name"
}

test_help_short_flag() {
    describe "Should show help with -h"

    # Act
    local output=$(bash "$REPORT_SCRIPT" -h 2>&1)

    # Assert
    assert_contains "$output" "用法:" "Should show usage with -h"
}

# ============================================================================
# 测试基本功能
# ============================================================================

test_script_executes() {
    describe "Should execute without critical errors"

    # Act
    local exit_code=0
    bash "$REPORT_SCRIPT" --help >/dev/null 2>&1 || exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Script should be executable"
}

test_has_required_options() {
    describe "Help should document required options"

    # Act
    local output=$(bash "$REPORT_SCRIPT" --help 2>&1)

    # Assert
    assert_contains "$output" "--format" "Should have --format option"
    assert_contains "$output" "--output" "Should have --output option"
}

# ============================================================================
# 运行所有测试
# ============================================================================

run_tests \
    test_help_flag \
    test_help_short_flag \
    test_script_executes \
    test_has_required_options
