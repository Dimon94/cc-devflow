#!/usr/bin/env bash
# test_setup_epic.sh - 测试 setup-epic.sh

# 加载测试框架
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

# 脚本路径
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SETUP_EPIC_SCRIPT="$REPO_ROOT/scripts/setup-epic.sh"

# ============================================================================
# 辅助函数
# ============================================================================

# 创建测试专用的 common.sh
create_test_common() {
    local test_common="$TEST_TMP_DIR/scripts/common.sh"
    mkdir -p "$(dirname "$test_common")"

    # Use awk instead of sed for proper variable substitution
    awk -v tmpdir="$TEST_TMP_DIR" '
    /^get_repo_root\(\)/ {
        print "get_repo_root() {"
        print "    echo \"" tmpdir "\""
        print "}"
        in_function = 1
        next
    }
    in_function && /^}/ {
        in_function = 0
        next
    }
    !in_function {
        print
    }
    ' "$REPO_ROOT/scripts/common.sh" > "$test_common.tmp"

    mv "$test_common.tmp" "$test_common"
}

# 创建完整的需求环境（带 PRD.md）
setup_requirement_with_prd() {
    local req_id="$1"
    local req_dir="$TEST_TMP_DIR/devflow/requirements/$req_id"

    mkdir -p "$req_dir"/{research,tasks}

    # 创建 PRD.md
    cat > "$req_dir/PRD.md" << 'EOF'
# Product Requirements Document

## Overview
Test PRD content

## Requirements
- Requirement 1
- Requirement 2
EOF

    # 创建 EXECUTION_LOG.md
    echo "# Execution Log" > "$req_dir/EXECUTION_LOG.md"

    # 创建状态文件
    cat > "$req_dir/orchestration_status.json" << EOF
{
  "reqId": "$req_id",
  "title": "Test Requirement",
  "status": "prd_complete",
  "phase": "epic_planning",
  "createdAt": "2025-10-01T00:00:00Z",
  "updatedAt": "2025-10-01T00:00:00Z"
}
EOF

    echo "$req_dir"
}

# 运行 setup-epic.sh
run_setup_epic() {
    local req_id="$1"
    shift
    local args=("$@")

    # 设置环境
    export DEVFLOW_REQ_ID="$req_id"

    # 创建测试专用的脚本副本
    local test_scripts_dir="$TEST_TMP_DIR/scripts"
    mkdir -p "$test_scripts_dir"

    # 创建测试专用的 common.sh
    create_test_common

    # 复制 setup-epic.sh 到测试目录
    cp "$SETUP_EPIC_SCRIPT" "$test_scripts_dir/"

    # 在测试目录中运行脚本
    (
        cd "$TEST_TMP_DIR"
        bash "$test_scripts_dir/setup-epic.sh" "${args[@]}" 2>&1
    )
}

# ============================================================================
# 测试帮助信息
# ============================================================================

test_help_flag() {
    describe "Should show help with --help"

    # Arrange
    local test_scripts_dir="$TEST_TMP_DIR/scripts"
    mkdir -p "$test_scripts_dir"
    create_test_common
    cp "$SETUP_EPIC_SCRIPT" "$test_scripts_dir/"

    # Act
    local output=$(
        cd "$TEST_TMP_DIR"
        bash "$test_scripts_dir/setup-epic.sh" --help 2>&1
    )

    # Assert
    assert_contains "$output" "Usage:" "Should show usage"
    assert_contains "$output" "setup-epic.sh" "Should mention script name"
    assert_contains "$output" "--json" "Should document --json flag"
}

test_help_short_flag() {
    describe "Should show help with -h"

    # Arrange
    local test_scripts_dir="$TEST_TMP_DIR/scripts"
    mkdir -p "$test_scripts_dir"
    create_test_common
    cp "$SETUP_EPIC_SCRIPT" "$test_scripts_dir/"

    # Act
    local output=$(
        cd "$TEST_TMP_DIR"
        bash "$test_scripts_dir/setup-epic.sh" -h 2>&1
    )

    # Assert
    assert_contains "$output" "Usage:" "Should show usage with -h"
}

# ============================================================================
# 测试无 REQ_ID 的情况
# ============================================================================

test_no_req_id_error() {
    describe "Should fail when no REQ_ID is available"

    # Arrange - 创建测试脚本副本但不设置 REQ_ID
    local test_scripts_dir="$TEST_TMP_DIR/scripts"
    mkdir -p "$test_scripts_dir"
    create_test_common
    cp "$SETUP_EPIC_SCRIPT" "$test_scripts_dir/"

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    (
        cd "$TEST_TMP_DIR"
        bash "$test_scripts_dir/setup-epic.sh" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail without REQ_ID"
        assert_contains "$output" "ERROR" "Should show error message"

}

# ============================================================================
# 测试必需文件验证
# ============================================================================

test_missing_req_dir() {
    describe "Should fail when requirement directory doesn't exist"

    # Arrange - 不创建需求目录，使用合法ID格式
    local req_id="REQ-999"

    # 创建测试脚本环境
    local test_scripts_dir="$TEST_TMP_DIR/scripts"
    mkdir -p "$test_scripts_dir"
    create_test_common
    cp "$SETUP_EPIC_SCRIPT" "$test_scripts_dir/"

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    (
        cd "$TEST_TMP_DIR"
        export DEVFLOW_REQ_ID="$req_id"
        bash "$test_scripts_dir/setup-epic.sh" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail when REQ_DIR missing"
    assert_contains "$output" "Requirement directory not found" "Should mention missing directory"
}

test_missing_prd_file() {
    describe "Should fail when PRD.md doesn't exist"

    # Arrange - 创建目录但不创建 PRD.md
    local req_id="REQ-998"
    local req_dir="$TEST_TMP_DIR/devflow/requirements/$req_id"
    mkdir -p "$req_dir"

    # 创建测试脚本环境
    local test_scripts_dir="$TEST_TMP_DIR/scripts"
    mkdir -p "$test_scripts_dir"
    create_test_common
    cp "$SETUP_EPIC_SCRIPT" "$test_scripts_dir/"

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    (
        cd "$TEST_TMP_DIR"
        export DEVFLOW_REQ_ID="$req_id"
        bash "$test_scripts_dir/setup-epic.sh" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail when PRD.md missing"
    assert_contains "$output" "PRD.md not found" "Should mention missing PRD"
}

# ============================================================================
# 测试 EPIC 和 TASKS 文件创建
# ============================================================================

test_create_epic_file() {
    describe "Should create EPIC.md when it doesn't exist"

    # Arrange
    local req_id="REQ-002"
    local req_dir=$(setup_requirement_with_prd "$req_id")

    # Act
    local output=$(run_setup_epic "$req_id" 2>&1)
    local exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Should succeed"
    assert_file_exists "$req_dir/EPIC.md" "EPIC.md should be created"

    # 检查文件内容
    local content=$(cat "$req_dir/EPIC.md")
    assert_contains "$content" "Epic: $req_id" "Should contain Epic title"
}

test_create_tasks_file() {
    describe "Should create TASKS.md when it doesn't exist"

    # Arrange
    local req_id="REQ-003"
    local req_dir=$(setup_requirement_with_prd "$req_id")

    # Act
    local output=$(run_setup_epic "$req_id" 2>&1)
    local exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Should succeed"
    assert_file_exists "$req_dir/TASKS.md" "TASKS.md should be created"

    # 检查文件内容
    local content=$(cat "$req_dir/TASKS.md")
    assert_contains "$content" "Tasks: $req_id" "Should contain Tasks title"
}

test_skip_existing_epic() {
    describe "Should not overwrite existing EPIC.md"

    # Arrange
    local req_id="REQ-004"
    local req_dir=$(setup_requirement_with_prd "$req_id")

    # 创建已存在的 EPIC.md
    echo "# Existing Epic Content" > "$req_dir/EPIC.md"

    # Act
    local output=$(run_setup_epic "$req_id" 2>&1)
    local exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Should succeed"
    local content=$(cat "$req_dir/EPIC.md")
    assert_contains "$content" "Existing Epic Content" "Should preserve existing content"
}

test_skip_existing_tasks() {
    describe "Should not overwrite existing TASKS.md"

    # Arrange
    local req_id="REQ-005"
    local req_dir=$(setup_requirement_with_prd "$req_id")

    # 创建已存在的 TASKS.md
    echo "# Existing Tasks Content" > "$req_dir/TASKS.md"

    # Act
    local output=$(run_setup_epic "$req_id" 2>&1)
    local exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Should succeed"
    local content=$(cat "$req_dir/TASKS.md")
    assert_contains "$content" "Existing Tasks Content" "Should preserve existing content"
}

# ============================================================================
# 测试 JSON 输出
# ============================================================================

test_json_output() {
    describe "Should output valid JSON with --json"

    # Arrange
    local req_id="REQ-006"
    setup_requirement_with_prd "$req_id"

    # Act
    local output=$(run_setup_epic "$req_id" --json 2>&1)

    # Assert
    assert_json_valid "$output" "Should be valid JSON"
}

test_json_output_fields() {
    describe "JSON should include all required fields"

    # Arrange
    local req_id="REQ-007"
    setup_requirement_with_prd "$req_id"

    # Act
    local output=$(run_setup_epic "$req_id" --json 2>&1)

    # Assert
    assert_contains "$output" "\"REQ_ID\"" "Should have REQ_ID field"
    assert_contains "$output" "\"EPIC_FILE\"" "Should have EPIC_FILE field"
    assert_contains "$output" "\"TASKS_FILE\"" "Should have TASKS_FILE field"
    assert_contains "$output" "\"PRD_FILE\"" "Should have PRD_FILE field"
}

# ============================================================================
# 测试 BUG 类型需求
# ============================================================================

test_bug_type_requirement() {
    describe "Should handle BUG-XXX format"

    # Arrange
    local req_id="BUG-999"
    setup_requirement_with_prd "$req_id"

    # Act
    local exit_code=0
    local output=$(run_setup_epic "$req_id" --json 2>&1) || exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Should handle BUG format"
    assert_contains "$output" "BUG-999" "Should preserve BUG ID"
}

# ============================================================================
# 测试错误处理
# ============================================================================

test_invalid_option() {
    describe "Should reject invalid options"

    # Arrange
    local test_scripts_dir="$TEST_TMP_DIR/scripts"
    mkdir -p "$test_scripts_dir"
    create_test_common
    cp "$SETUP_EPIC_SCRIPT" "$test_scripts_dir/"

    # Act
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    (
        cd "$TEST_TMP_DIR"
        export DEVFLOW_REQ_ID="REQ-001"
        bash "$test_scripts_dir/setup-epic.sh" --invalid-option > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail on invalid option"
    assert_contains "$output" "Unknown option" "Should mention unknown option"
}

# ============================================================================
# 运行所有测试
# ============================================================================

run_tests \
    test_help_flag \
    test_help_short_flag \
    test_no_req_id_error \
    test_missing_req_dir \
    test_missing_prd_file \
    test_create_epic_file \
    test_create_tasks_file \
    test_skip_existing_epic \
    test_skip_existing_tasks \
    test_json_output \
    test_json_output_fields \
    test_bug_type_requirement \
    test_invalid_option
