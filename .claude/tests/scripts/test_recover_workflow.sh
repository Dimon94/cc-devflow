#!/usr/bin/env bash
# test_recover_workflow.sh - 测试 recover-workflow.sh (基础测试)

# 加载测试框架
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

# 脚本路径
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RECOVER_SCRIPT="$REPO_ROOT/scripts/recover-workflow.sh"

# 注意: recover-workflow.sh 依赖真实的仓库环境
# 这里只测试基本功能和帮助信息

# ============================================================================
# 辅助函数
# ============================================================================

# 创建测试专用的 common.sh
create_test_common() {
    local test_common="$TEST_TMP_DIR/scripts/common.sh"
    mkdir -p "$(dirname "$test_common")"

    sed '/^get_repo_root()/,/^}/c\
get_repo_root() {\
    echo "'"$TEST_TMP_DIR"'"\
}' "$REPO_ROOT/scripts/common.sh" > "$test_common"
}

# 创建需求环境（带状态）
setup_requirement_with_status() {
    local req_id="$1"
    local status="$2"
    local phase="$3"

    local req_dir="$TEST_TMP_DIR/devflow/requirements/$req_id"
    mkdir -p "$req_dir"/{research,tasks}

    # 创建状态文件
    cat > "$req_dir/orchestration_status.json" << EOF
{
  "reqId": "$req_id",
  "title": "Test Requirement",
  "status": "$status",
  "phase": "$phase",
  "createdAt": "2025-10-01T00:00:00Z",
  "updatedAt": "2025-10-01T00:00:00Z"
}
EOF

    # 创建基础文档
    echo "# PRD" > "$req_dir/PRD.md"
    echo "# Execution Log" > "$req_dir/EXECUTION_LOG.md"

    echo "$req_dir"
}

# 运行 recover-workflow.sh
run_recover() {
    local req_id="$1"
    shift
    local args=("$@")

    export DEVFLOW_REQ_ID="$req_id"

    local test_scripts_dir="$TEST_TMP_DIR/scripts"
    mkdir -p "$test_scripts_dir"

    create_test_common
    cp "$RECOVER_SCRIPT" "$test_scripts_dir/"

    (
        cd "$TEST_TMP_DIR"
        bash "$test_scripts_dir/recover-workflow.sh" "${args[@]}" 2>&1
    )
}

# ============================================================================
# 测试帮助信息
# ============================================================================

test_help_flag() {
    describe "Should show help with --help"

    # Act - 直接运行脚本
    local output=$(bash "$RECOVER_SCRIPT" --help 2>&1)

    # Assert
    assert_contains "$output" "用法:" "Should show usage"
    assert_contains "$output" "恢复" "Should mention recovery"
}

test_script_executes() {
    describe "Should execute without critical errors"

    # Act
    local exit_code=0
    bash "$RECOVER_SCRIPT" --help >/dev/null 2>&1 || exit_code=$?

    # Assert
    assert_equals "$exit_code" "0" "Script should be executable"
}

test_has_required_options() {
    describe "Help should document required options"

    # Act
    local output=$(bash "$RECOVER_SCRIPT" --help 2>&1)

    # Assert
    assert_contains "$output" "--from" "Should have --from option"
    assert_contains "$output" "--dry-run" "Should have --dry-run option"
    assert_contains "$output" "--force" "Should have --force option"
}

# ============================================================================
# 测试状态检测
# ============================================================================

test_detect_workflow_status() {
    describe "Should detect workflow status correctly"

    # Arrange
    setup_requirement_with_status "REQ-001" "prd_complete" "epic_planning"

    # Act
    local output=$(run_recover "REQ-001" --dry-run 2>&1)

    # Assert
    assert_contains "$output" "REQ-001" "Should show requirement ID"
    assert_contains "$output" "prd_complete\|epic" "Should show status or phase"
}

# ============================================================================
# 测试恢复策略
# ============================================================================

test_recovery_from_prd_complete() {
    describe "Should suggest Epic stage from prd_complete"

    # Arrange
    setup_requirement_with_status "REQ-002" "prd_complete" "epic_planning"

    # Act
    local output=$(run_recover "REQ-002" --dry-run 2>&1)

    # Assert
    assert_contains "$output" "epic\|Epic\|EPIC" "Should mention Epic stage"
}

test_recovery_from_initialized() {
    describe "Should suggest PRD stage from initialized"

    # Arrange
    setup_requirement_with_status "REQ-003" "initialized" "planning"

    # Act
    local output=$(run_recover "REQ-003" --dry-run 2>&1)

    # Assert
    assert_contains "$output" "prd\|PRD" "Should mention PRD stage"
}

test_recovery_from_epic_complete() {
    describe "Should suggest dev stage from epic_complete"

    # Arrange
    setup_requirement_with_status "REQ-004" "epic_complete" "epic_complete"

    # Act
    local output=$(run_recover "REQ-004" --dry-run 2>&1)

    # Assert
    assert_contains "$output" "dev\|开发" "Should mention dev stage"
}

# ============================================================================
# 测试 --from 选项
# ============================================================================

test_from_option_override() {
    describe "Should respect --from option to override detection"

    # Arrange
    setup_requirement_with_status "REQ-005" "prd_complete" "epic_planning"

    # Act
    local output=$(run_recover "REQ-005" --from dev --dry-run 2>&1)

    # Assert
    assert_contains "$output" "dev\|开发" "Should start from dev as specified"
}

# ============================================================================
# 测试 dry-run 模式
# ============================================================================

test_dry_run_mode() {
    describe "Should show recovery plan in dry-run mode"

    # Arrange
    setup_requirement_with_status "REQ-006" "prd_complete" "epic_planning"

    # Act
    local output=$(run_recover "REQ-006" --dry-run 2>&1)

    # Assert
    assert_contains "$output" "恢复计划\|Recovery Plan\|执行步骤" "Should show recovery plan"
    assert_contains "$output" "flow-\|/flow" "Should show flow commands"
}

# ============================================================================
# 测试文档完整性检查
# ============================================================================

test_check_prd_exists() {
    describe "Should check for PRD.md existence"

    # Arrange
    local req_dir=$(setup_requirement_with_status "REQ-007" "prd_complete" "epic_planning")

    # Act
    local output=$(run_recover "REQ-007" --dry-run 2>&1)

    # Assert
    assert_contains "$output" "PRD\|文档" "Should mention PRD or documents"
}

test_check_epic_if_exists() {
    describe "Should check for EPIC.md if it exists"

    # Arrange
    local req_dir=$(setup_requirement_with_status "REQ-008" "epic_complete" "epic_complete")
    echo "# EPIC" > "$req_dir/EPIC.md"

    # Act
    local output=$(run_recover "REQ-008" --dry-run 2>&1)

    # Assert
    assert_contains "$output" "EPIC\|Epic\|文档" "Should detect EPIC presence"
}

# ============================================================================
# 测试错误处理
# ============================================================================

test_missing_requirement_dir() {
    describe "Should fail when requirement directory doesn't exist"

    # Arrange - 不创建需求目录

    # Act
    local exit_code=0
    local output=$(run_recover "REQ-NOTEXIST" --dry-run 2>&1) || exit_code=$?

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail when dir missing"
}

test_missing_status_file() {
    describe "Should handle missing status file gracefully"

    # Arrange - 创建目录但不创建状态文件
    local req_id="REQ-009"
    local req_dir="$TEST_TMP_DIR/devflow/requirements/$req_id"
    mkdir -p "$req_dir"
    echo "# PRD" > "$req_dir/PRD.md"

    # Act
    local exit_code=0
    local output=$(run_recover "REQ-009" --dry-run 2>&1) || exit_code=$?

    # Assert
    assert_not_equals "$exit_code" "0" "Should fail without status file"
}

# ============================================================================
# 测试已完成需求
# ============================================================================

test_completed_requirement() {
    describe "Should indicate no recovery needed for completed requirement"

    # Arrange
    setup_requirement_with_status "REQ-010" "completed" "completed"

    # Act
    local exit_code=0
    local output=$(run_recover "REQ-010" --dry-run 2>&1) || exit_code=$?

    # Assert - 已完成应该退出成功但提示无需恢复
    if [[ $exit_code -eq 0 ]]; then
        assert_contains "$output" "完成\|complete" "Should mention completion"
    fi
}

# ============================================================================
# 运行所有测试 (仅基础测试，完整测试需要真实Git环境)
# ============================================================================

run_tests \
    test_help_flag \
    test_script_executes \
    test_has_required_options
