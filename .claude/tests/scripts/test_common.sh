#!/usr/bin/env bash
# test_common.sh - 测试 common.sh 的所有函数

# 加载测试框架
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

# 加载被测试的脚本
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$REPO_ROOT/scripts/common.sh"

# ============================================================================
# 测试钩子 - 在每个测试前清理git mock
# ============================================================================

setup_test() {
    clear_git_mocks
    unset DEVFLOW_REQ_ID  # 清理环境变量以避免干扰
}

# ============================================================================
# 测试 get_repo_root 函数
# ============================================================================

test_get_repo_root_in_git_repo() {
    describe "get_repo_root should return git root in git repository"

    # Mock git command
    mock_git "rev-parse --show-toplevel" "/fake/repo/path"

    # Act
    local result=$(get_repo_root)

    # Assert
    assert_equals "$result" "/fake/repo/path" "Should return git repo root"
}

test_get_repo_root_not_git_repo() {
    describe "get_repo_root should fall back to script location when not in git repo"

    # Mock git to fail
    mock_git "rev-parse --show-toplevel" "" "1"

    # Act
    local result=$(get_repo_root)

    # Assert - 验证返回的路径存在且包含 .claude 目录
    assert_dir_exists "$result" "Should return existing directory"
    assert_dir_exists "$result/.claude" "Should return path with .claude subdirectory"
}

# ============================================================================
# 测试 get_current_req_id 函数
# ============================================================================

test_get_current_req_id_from_env() {
    describe "get_current_req_id should use DEVFLOW_REQ_ID if set"

    # Arrange
    export DEVFLOW_REQ_ID="REQ-999"

    # Act
    local result=$(get_current_req_id)

    # Assert
    assert_equals "$result" "REQ-999" "Should return env var value"

    # Cleanup
    unset DEVFLOW_REQ_ID
}

test_get_current_req_id_from_git_branch() {
    describe "get_current_req_id should extract from git branch name"

    # Mock git branch command
    mock_git "rev-parse --abbrev-ref HEAD" "feature/REQ-123-test-feature"

    # Act
    local result=$(get_current_req_id)

    # Assert
    assert_equals "$result" "REQ-123" "Should extract REQ-123 from branch"
}

test_get_current_req_id_bug_format() {
    describe "get_current_req_id should extract BUG-XXX format"

    # Mock git branch command
    mock_git "rev-parse --abbrev-ref HEAD" "bugfix/BUG-456-fix-login"

    # Act
    local result=$(get_current_req_id)

    # Assert
    assert_equals "$result" "BUG-456" "Should extract BUG-456 from branch"
}

test_get_current_req_id_no_match() {
    describe "get_current_req_id should return empty when no match found"

    # Mock git branch without REQ/BUG pattern
    mock_git "rev-parse --abbrev-ref HEAD" "main"

    # Act
    local result=$(get_current_req_id)

    # Assert
    assert_equals "$result" "" "Should return empty string when no match"
}

# ============================================================================
# 测试 validate_req_id 函数
# ============================================================================

test_validate_req_id_valid_req() {
    describe "validate_req_id should accept valid REQ format"

    # Act & Assert
    assert_success validate_req_id "REQ-123"
}

test_validate_req_id_valid_bug() {
    describe "validate_req_id should accept valid BUG format"

    # Act & Assert
    assert_success validate_req_id "BUG-456"
}

test_validate_req_id_empty() {
    describe "validate_req_id should reject empty string"

    # Act & Assert
    assert_failure validate_req_id ""
}

test_validate_req_id_invalid_format() {
    describe "validate_req_id should reject invalid format"

    # Act & Assert
    assert_failure validate_req_id "REQ123"  # Missing dash
    assert_failure validate_req_id "REQ-"    # Missing number
    assert_failure validate_req_id "TASK-123"  # Wrong prefix
}

# ============================================================================
# 测试 get_req_type 函数
# ============================================================================

test_get_req_type_requirement() {
    describe "get_req_type should return 'requirement' for REQ-XXX"

    # Act
    local result=$(get_req_type "REQ-123")

    # Assert
    assert_equals "$result" "requirement" "Should return 'requirement'"
}

test_get_req_type_bug() {
    describe "get_req_type should return 'bug' for BUG-XXX"

    # Act
    local result=$(get_req_type "BUG-456")

    # Assert
    assert_equals "$result" "bug" "Should return 'bug'"
}

# ============================================================================
# 测试 has_git 函数
# ============================================================================

test_has_git_available() {
    describe "has_git should return success when git is available"

    # Mock git command
    mock_git "rev-parse --show-toplevel" "/some/path"

    # Act & Assert
    assert_success has_git
}

test_has_git_not_available() {
    describe "has_git should return failure when git is not available"

    # Mock git to fail
    mock_git "rev-parse --show-toplevel" "" "1"

    # Act & Assert
    assert_failure has_git
}

# ============================================================================
# 测试 log_event 函数 (如果存在)
# ============================================================================

test_log_event_creates_entry() {
    describe "log_event should create log entry in EXECUTION_LOG.md"

    # Arrange
    local req_id="REQ-123"
    local log_dir="$TEST_TMP_DIR/.claude/docs/requirements/$req_id"
    mkdir -p "$log_dir"
    local log_file="$log_dir/EXECUTION_LOG.md"
    touch "$log_file"

    # Mock get_repo_root to return test directory
    mock_function "get_repo_root" "echo '$TEST_TMP_DIR'"

    # Act
    if type log_event &>/dev/null; then
        log_event "$req_id" "Test event"

        # Assert
        assert_file_exists "$log_file" "Log file should exist"
        local content=$(cat "$log_file")
        assert_contains "$content" "Test event" "Should contain event message"
    else
        # 如果函数不存在，跳过此测试
        describe "  (log_event function not found - skipping)"
        return 0
    fi
}

# ============================================================================
# 运行所有测试
# ============================================================================

run_tests \
    test_get_repo_root_in_git_repo \
    test_get_repo_root_not_git_repo \
    test_get_current_req_id_from_env \
    test_get_current_req_id_from_git_branch \
    test_get_current_req_id_bug_format \
    test_get_current_req_id_no_match \
    test_validate_req_id_valid_req \
    test_validate_req_id_valid_bug \
    test_validate_req_id_empty \
    test_validate_req_id_invalid_format \
    test_get_req_type_requirement \
    test_get_req_type_bug \
    test_has_git_available \
    test_has_git_not_available \
    test_log_event_creates_entry