#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 .claude/tests/test-framework.sh 与 .claude/scripts/create-requirement.sh。
# [OUTPUT]: 回归验证 requirement/bug bootstrap 脚手架、workspace pointer 与兼容参数解析。
# [POS]: .claude/tests/scripts 的脚手架测试，守住 create-requirement 已切到 harness + intent memory 主线。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CREATE_REQUIREMENT_SCRIPT="$REPO_ROOT/scripts/create-requirement.sh"
COMMON_SCRIPT="$REPO_ROOT/scripts/common.sh"

setup_test() {
    unset DEVFLOW_REQ_ID
}

prepare_test_scripts() {
    local test_scripts_dir="$TEST_TMP_DIR/.claude/scripts"
    mkdir -p "$test_scripts_dir"
    cp "$CREATE_REQUIREMENT_SCRIPT" "$test_scripts_dir/"
    cp "$COMMON_SCRIPT" "$test_scripts_dir/"
}

run_create_requirement() {
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    local args=("$@")

    prepare_test_scripts

    (
        cd "$TEST_TMP_DIR"
        bash "$TEST_TMP_DIR/.claude/scripts/create-requirement.sh" "${args[@]}" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    cat "$output_file"
}

last_exit_code() {
    cat "$TEST_TMP_DIR/exitcode.txt"
}

test_help_flag() {
    describe "Should show help with --help"

    local output
    output=$(bash "$CREATE_REQUIREMENT_SCRIPT" --help 2>&1)

    assert_contains "$output" "Usage:" "Should show usage"
    assert_contains "$output" "CANONICAL OUTPUT (REQ)" "Should describe canonical scaffold"
}

test_create_requirement_scaffold() {
    describe "Should create canonical requirement scaffold"

    local req_id="REQ-123"
    local output
    output=$(run_create_requirement "$req_id" --title "Agent Autopilot" --json)

    local req_dir="$TEST_TMP_DIR/devflow/requirements/$req_id"
    local intent_dir="$TEST_TMP_DIR/devflow/intent/$req_id"

    assert_equals "$(last_exit_code)" "0" "Should create requirement successfully"
    assert_json_valid "$output" "Should emit valid JSON"
    assert_json_field "$output" "req_id" "$req_id" "Should report created requirement ID"
    assert_json_field "$output" "harness_state_file" "$req_dir/harness-state.json" "Should report harness-state path"

    assert_file_exists "$req_dir/harness-state.json" "Should create harness-state.json"
    assert_file_exists "$intent_dir/summary.md" "Should create summary memory"
    assert_file_exists "$intent_dir/facts.md" "Should create facts memory"
    assert_file_exists "$intent_dir/decision-log.md" "Should create decision log"
    assert_file_exists "$intent_dir/plan.md" "Should create plan memory"
    assert_file_exists "$intent_dir/resume-index.md" "Should create resume index"
    assert_file_exists "$intent_dir/delegation-map.md" "Should create delegation map"
    assert_dir_exists "$intent_dir/artifacts/briefs" "Should create briefs directory"
    assert_dir_exists "$intent_dir/artifacts/results" "Should create results directory"
    assert_file_exists "$TEST_TMP_DIR/devflow/workspace/.current-req" "Should update workspace pointer"
    assert_equals "$(cat "$TEST_TMP_DIR/devflow/workspace/.current-req")" "$req_id" "Should point workspace to new requirement"
    assert_file_not_exists "$req_dir/EXECUTION_LOG.md" "Should not create legacy EXECUTION_LOG.md"
    assert_file_not_exists "$req_dir/orchestration_status.json" "Should not create legacy orchestration_status.json"
}

test_deprecated_branch_title_flag_does_not_swallow_json() {
    describe "Should ignore deprecated branch flags without swallowing later options"

    local req_id="REQ-124"
    local output
    output=$(run_create_requirement "$req_id" --branch-title "agent-first" --json)

    assert_equals "$(last_exit_code)" "0" "Should succeed with deprecated branch-title flag"
    assert_json_valid "$output" "Should still honor --json after deprecated flag"
}

test_auto_id_skips_existing_requirement() {
    describe "Should allocate next free REQ when --auto-id is used"

    mkdir -p "$TEST_TMP_DIR/devflow/requirements/REQ-001"

    local output
    output=$(run_create_requirement --auto-id --json)

    assert_equals "$(last_exit_code)" "0" "Should create requirement with auto ID"
    assert_json_field "$output" "req_id" "REQ-002" "Should skip existing REQ-001"
    assert_file_exists "$TEST_TMP_DIR/devflow/requirements/REQ-002/harness-state.json" "Should create next available requirement"
}

test_create_bug_scaffold() {
    describe "Should create bug scaffold in devflow/bugs"

    local bug_id="BUG-200"
    local output
    output=$(run_create_requirement "$bug_id" --title "Fix planner drift" --json)

    local bug_dir="$TEST_TMP_DIR/devflow/bugs/$bug_id"

    assert_equals "$(last_exit_code)" "0" "Should create bug successfully"
    assert_json_valid "$output" "Should emit valid JSON for bug"
    assert_json_field "$output" "req_type" "bug" "Should report bug type"
    assert_file_exists "$bug_dir/status.json" "Should create bug status.json"
    assert_dir_not_exists "$TEST_TMP_DIR/devflow/intent/$bug_id" "Should not create intent memory for bug bootstrap"
    assert_file_exists "$TEST_TMP_DIR/devflow/workspace/.current-req" "Should update workspace pointer for bug"
    assert_equals "$(cat "$TEST_TMP_DIR/devflow/workspace/.current-req")" "$bug_id" "Should point workspace to new bug"
}

run_tests \
    test_help_flag \
    test_create_requirement_scaffold \
    test_deprecated_branch_title_flag_does_not_swallow_json \
    test_auto_id_skips_existing_requirement \
    test_create_bug_scaffold
