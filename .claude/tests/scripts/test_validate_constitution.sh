#!/usr/bin/env bash
# test_validate_constitution.sh - 测试 validate-constitution.sh (基础测试)

# 加载测试框架
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

# 脚本路径
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VALIDATE_SCRIPT="$REPO_ROOT/scripts/validate-constitution.sh"

# ============================================================================
# 测试帮助信息
# ============================================================================

test_help_flag() {
    describe "Should show help with --help"

    # Act
    local output=$(bash "$VALIDATE_SCRIPT" --help 2>&1)

    # Assert
    assert_contains "$output" "Usage:" "Should show usage"
    assert_contains "$output" "validate-constitution.sh" "Should mention script name"
    assert_contains "$output" "--type" "Should document --type option"
}

test_help_short_flag() {
    describe "Should show help with -h"

    # Act
    local output=$(bash "$VALIDATE_SCRIPT" -h 2>&1)

    # Assert
    assert_contains "$output" "Usage:" "Should show usage with -h"
}

# ============================================================================
# 测试基本功能 (简化测试，验证脚本可执行)
# ============================================================================

test_script_executes() {
    describe "Should execute without critical errors"

    # Act - 使用 --help 确保脚本可以运行
    local exit_code=0
    bash "$VALIDATE_SCRIPT" --help >/dev/null 2>&1 || exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Script should be executable"
}

test_has_required_options() {
    describe "Help should document all required options"

    # Act
    local output=$(bash "$VALIDATE_SCRIPT" --help 2>&1)

    # Assert
    assert_contains "$output" "--type" "Should have --type option"
    assert_contains "$output" "--severity" "Should have --severity option"
    assert_contains "$output" "--json" "Should have --json option"
    assert_contains "$output" "--verbose" "Should have --verbose option"
}

# ============================================================================
# 运行所有测试
# ============================================================================

run_tests \
    test_help_flag \
    test_help_short_flag \
    test_script_executes \
    test_has_required_options
