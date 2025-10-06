#!/usr/bin/env bash
# test_check_task_status.sh - 测试 check-task-status.sh

# 加载测试框架
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

# 脚本路径
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CHECK_STATUS_SCRIPT="$REPO_ROOT/scripts/check-task-status.sh"

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

# 创建带有不同阶段任务的需求环境
setup_requirement_with_phased_tasks() {
    local req_id="$1"
    local req_dir="$TEST_TMP_DIR/.claude/docs/requirements/$req_id"

    mkdir -p "$req_dir"

    # 创建带阶段的 TASKS.md
    cat > "$req_dir/TASKS.md" << 'EOF'
# Tasks for REQ-001

## Phase 1: Setup

- [x] **T001**: Initialize project structure
- [x] **T002**: Setup development environment

## Phase 2: Tests First

- [ ] **T003**: Write unit tests for authentication
- [x] **T004**: Write integration tests

## Phase 3: Implementation

- [ ] **T005**: Implement user authentication
- [ ] **T006**: Add password validation
- [x] **T007**: Setup database schema
EOF

    echo "$req_dir"
}

# 创建简单任务列表
setup_requirement_with_simple_tasks() {
    local req_id="$1"
    local req_dir="$TEST_TMP_DIR/.claude/docs/requirements/$req_id"

    mkdir -p "$req_dir"

    cat > "$req_dir/TASKS.md" << 'EOF'
# Tasks for REQ-002

- [ ] **T001**: Task 1
- [x] **T002**: Task 2
- [ ] **T003**: Task 3
- [x] **T004**: Task 4
EOF

    echo "$req_dir"
}

# 运行 check-task-status.sh
run_check_status() {
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

    # 复制 check-task-status.sh 到测试目录
    cp "$CHECK_STATUS_SCRIPT" "$test_scripts_dir/"

    # 在测试目录中运行脚本
    (
        cd "$TEST_TMP_DIR"
        bash "$test_scripts_dir/check-task-status.sh" "${args[@]}" 2>&1
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
    cp "$CHECK_STATUS_SCRIPT" "$test_scripts_dir/"

    # Act
    local output=$(
        cd "$TEST_TMP_DIR"
        bash "$test_scripts_dir/check-task-status.sh" --help 2>&1
    )

    # Assert
    assert_contains "$output" "Usage:" "Should show usage"
    assert_contains "$output" "check-task-status.sh" "Should mention script name"
}

# ============================================================================
# 测试总体进度
# ============================================================================

test_overall_progress() {
    describe "Should show overall task progress"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act
    local output=$(run_check_status "REQ-002" 2>&1)
    local exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Should succeed"
    assert_contains "$output" "Completed:" "Should show completed count"
    assert_contains "$output" "Remaining:" "Should show remaining count"
    assert_contains "$output" "Progress:" "Should show progress percentage"
}

test_calculate_percentage() {
    describe "Should calculate progress percentage correctly"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act
    local output=$(run_check_status "REQ-002" 2>&1)

    # Assert - 2 complete out of 4 = 50%
    assert_contains "$output" "50%" "Should show 50% progress"
}

# ============================================================================
# 测试特定任务查询
# ============================================================================

test_check_complete_task() {
    describe "Should identify complete task status"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act
    local output=$(run_check_status "REQ-002" "T002" 2>&1)
    local exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Should succeed"
    assert_contains "$output" "✅" "Should show complete indicator"
    assert_contains "$output" "T002" "Should mention task ID"
    assert_contains "$output" "complete" "Should say complete"
}

test_check_pending_task() {
    describe "Should identify pending task status"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act
    local output=$(run_check_status "REQ-002" "T001" 2>&1)
    local exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Should succeed"
    assert_contains "$output" "⏳" "Should show pending indicator"
    assert_contains "$output" "T001" "Should mention task ID"
    assert_contains "$output" "pending" "Should say pending"
}

test_check_nonexistent_task() {
    describe "Should fail for non-existent task"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act - Use temp file pattern to capture exit code
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    (
        run_check_status "REQ-002" "T999" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail"
    assert_contains "$output" "not found" "Should say not found"
}

test_normalize_task_id_case() {
    describe "Should normalize task ID to uppercase"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act - use lowercase
    local output=$(run_check_status "REQ-002" "t001" 2>&1)
    local exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Should succeed"
    assert_contains "$output" "T001" "Should normalize to T001"
}

# ============================================================================
# 测试 JSON 输出
# ============================================================================

test_json_output_overall() {
    describe "Should output valid JSON for overall status"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act
    local output=$(run_check_status "REQ-002" --json 2>&1)

    # Assert
    assert_json_valid "$output" "Should be valid JSON"
}

test_json_output_fields() {
    describe "JSON should include all required fields"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act
    local output=$(run_check_status "REQ-002" --json 2>&1)

    # Assert
    assert_contains "$output" "\"req_id\"" "Should have req_id"
    assert_contains "$output" "\"total_tasks\"" "Should have total_tasks"
    assert_contains "$output" "\"completed\"" "Should have completed"
    assert_contains "$output" "\"remaining\"" "Should have remaining"
    assert_contains "$output" "\"percentage\"" "Should have percentage"
    assert_contains "$output" "\"next_task_id\"" "Should have next_task_id"
}

test_json_output_specific_task() {
    describe "Should output valid JSON for specific task"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act
    local output=$(run_check_status "REQ-002" "T001" --json 2>&1)

    # Assert
    assert_json_valid "$output" "Should be valid JSON"
    assert_contains "$output" "\"task_id\":\"T001\"" "Should have task_id"
    assert_contains "$output" "\"status\"" "Should have status"
}

# ============================================================================
# 测试阶段分解
# ============================================================================

test_phase_breakdown() {
    describe "Should show phase breakdown when available"

    # Arrange
    setup_requirement_with_phased_tasks "REQ-001"

    # Act
    local output=$(run_check_status "REQ-001" 2>&1)

    # Assert
    assert_contains "$output" "Phase Breakdown:" "Should show phase breakdown"
    assert_contains "$output" "Phase 1" "Should show Phase 1"
    assert_contains "$output" "Phase 2" "Should show Phase 2"
    assert_contains "$output" "Phase 3" "Should show Phase 3"
}

test_phase_json_output() {
    describe "JSON should include phase information"

    # Arrange
    setup_requirement_with_phased_tasks "REQ-001"

    # Act
    local output=$(run_check_status "REQ-001" --json 2>&1)

    # Assert
    assert_contains "$output" "\"phases\"" "Should have phases"
    assert_contains "$output" "\"phase_1\"" "Should have phase_1"
    assert_contains "$output" "\"phase_2\"" "Should have phase_2"
    assert_contains "$output" "\"phase_3\"" "Should have phase_3"
}

# ============================================================================
# 测试下一个任务
# ============================================================================

test_next_task() {
    describe "Should identify next pending task"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act
    local output=$(run_check_status "REQ-002" 2>&1)

    # Assert
    assert_contains "$output" "Next Task:" "Should show next task"
    assert_contains "$output" "T001" "Should show T001 as next"
}

test_all_tasks_complete() {
    describe "Should indicate when all tasks complete"

    # Arrange - 创建全部完成的任务
    local req_id="REQ-003"
    local req_dir="$TEST_TMP_DIR/.claude/docs/requirements/$req_id"
    mkdir -p "$req_dir"

    cat > "$req_dir/TASKS.md" << 'EOF'
# Tasks
- [x] **T001**: Done
- [x] **T002**: Done
EOF

    # Act
    local output=$(run_check_status "REQ-003" 2>&1)

    # Assert
    assert_contains "$output" "All tasks complete" "Should say all complete"
}

# ============================================================================
# 测试 Verbose 模式
# ============================================================================

test_verbose_mode() {
    describe "Should show detailed task list in verbose mode"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act
    local output=$(run_check_status "REQ-002" --verbose 2>&1)

    # Assert
    assert_contains "$output" "All Tasks:" "Should show all tasks header"
    assert_contains "$output" "T001" "Should list T001"
    assert_contains "$output" "T002" "Should list T002"
    assert_contains "$output" "T003" "Should list T003"
    assert_contains "$output" "T004" "Should list T004"
}

# ============================================================================
# 测试错误处理
# ============================================================================

test_missing_tasks_file() {
    describe "Should fail when TASKS.md doesn't exist"

    # Arrange - 创建需求目录但不创建 TASKS.md
    local req_id="REQ-004"
    local req_dir="$TEST_TMP_DIR/.claude/docs/requirements/$req_id"
    mkdir -p "$req_dir"

    # Act - Use temp file pattern to capture exit code
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    (
        run_check_status "REQ-004" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail"
    assert_contains "$output" "TASKS.md not found" "Should mention missing TASKS.md"
}

test_invalid_task_id_format() {
    describe "Should fail on invalid task ID format"

    # Arrange
    setup_requirement_with_simple_tasks "REQ-002"

    # Act - Use temp file pattern to capture exit code
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    (
        run_check_status "REQ-002" "INVALID" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail"
    assert_contains "$output" "Invalid task ID format" "Should mention format error"
}

test_invalid_option() {
    describe "Should reject invalid options"

    # Arrange
    local test_scripts_dir="$TEST_TMP_DIR/scripts"
    mkdir -p "$test_scripts_dir"
    create_test_common
    cp "$CHECK_STATUS_SCRIPT" "$test_scripts_dir/"

    # Act - Use temp file pattern to capture exit code
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    (
        cd "$TEST_TMP_DIR"
        bash "$test_scripts_dir/check-task-status.sh" --invalid > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local output=$(cat "$output_file")
    local exit_code=$(cat "$exit_code_file")

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail"
    assert_contains "$output" "Unknown option" "Should mention unknown option"
}

# ============================================================================
# 运行所有测试
# ============================================================================

run_tests \
    test_help_flag \
    test_overall_progress \
    test_calculate_percentage \
    test_check_complete_task \
    test_check_pending_task \
    test_check_nonexistent_task \
    test_normalize_task_id_case \
    test_json_output_overall \
    test_json_output_fields \
    test_json_output_specific_task \
    test_phase_breakdown \
    test_phase_json_output \
    test_next_task \
    test_all_tasks_complete \
    test_verbose_mode \
    test_missing_tasks_file \
    test_invalid_task_id_format \
    test_invalid_option
