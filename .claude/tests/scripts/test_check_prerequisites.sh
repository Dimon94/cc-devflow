#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 .claude/tests/test-framework.sh 与 .claude/scripts/check-prerequisites.sh。
# [OUTPUT]: 回归验证 bootstrap-only requirement、canonical path 输出与 task source 判定语义。
# [POS]: .claude/tests/scripts 的前置条件契约测试，守住 check-prerequisites 已切到 harness/intent 主线。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CHECK_PREREQ_SCRIPT="$REPO_ROOT/scripts/check-prerequisites.sh"
COMMON_SCRIPT="$REPO_ROOT/scripts/common.sh"

setup_test() {
    unset DEVFLOW_REQ_ID
}

prepare_test_scripts() {
    local test_scripts_dir="$TEST_TMP_DIR/.claude/scripts"
    mkdir -p "$test_scripts_dir"
    cp "$CHECK_PREREQ_SCRIPT" "$test_scripts_dir/"
    cp "$COMMON_SCRIPT" "$test_scripts_dir/"
}

req_dir_for() {
    local req_id="$1"
    if [[ "$req_id" == BUG-* ]]; then
        echo "$TEST_TMP_DIR/devflow/bugs/$req_id"
    else
        echo "$TEST_TMP_DIR/devflow/requirements/$req_id"
    fi
}

bootstrap_requirement() {
    local req_id="$1"
    local req_dir
    req_dir=$(req_dir_for "$req_id")
    local intent_dir="$TEST_TMP_DIR/devflow/intent/$req_id"

    mkdir -p "$req_dir/research" "$intent_dir"

    cat > "$req_dir/harness-state.json" <<EOF
{
  "changeId": "$req_id",
  "goal": "Deliver $req_id safely",
  "status": "initialized"
}
EOF

    cat > "$req_dir/context-package.md" <<EOF
# Context Package: $req_id
EOF

    cat > "$intent_dir/resume-index.md" <<EOF
# Resume Index: $req_id
EOF

    mkdir -p "$TEST_TMP_DIR/devflow/workspace"
    printf '%s\n' "$req_id" > "$TEST_TMP_DIR/devflow/workspace/.current-req"

    echo "$req_dir"
}

full_requirement() {
    local req_id="$1"
    local req_dir
    req_dir=$(bootstrap_requirement "$req_id")
    mkdir -p "$req_dir/tasks"
    echo "# PRD" > "$req_dir/PRD.md"
    echo "$req_dir"
}

run_check_prereq() {
    local req_id="$1"
    shift
    local args=("$@")
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    prepare_test_scripts

    (
        cd "$TEST_TMP_DIR"
        export DEVFLOW_REQ_ID="$req_id"
        bash "$TEST_TMP_DIR/.claude/scripts/check-prerequisites.sh" "${args[@]}" > "$output_file" 2>&1
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
    output=$(bash "$CHECK_PREREQ_SCRIPT" --help 2>&1)

    assert_contains "$output" "Usage:" "Should show usage"
    assert_contains "$output" "--require-tasks" "Should document --require-tasks"
    assert_contains "$output" "task-manifest.json" "Should mention canonical task source"
}

test_no_req_id_error() {
    describe "Should fail when no REQ_ID is available"

    local output
    output=$(run_check_prereq "" 2>&1)
    local exit_code
    exit_code=$(last_exit_code)

    assert_not_equals "$exit_code" "0" "Should fail without REQ_ID"
    assert_contains "$output" "ERROR: No requirement ID found" "Should explain missing requirement context"
}

test_paths_only_mode_lists_canonical_paths() {
    describe "Should output canonical paths in --paths-only mode"

    local req_id="REQ-001"
    bootstrap_requirement "$req_id" >/dev/null

    local output
    output=$(run_check_prereq "$req_id" --paths-only)

    assert_contains "$output" "HARNESS_STATE_FILE:" "Should include HARNESS_STATE_FILE"
    assert_contains "$output" "CONTEXT_PACKAGE_FILE:" "Should include CONTEXT_PACKAGE_FILE"
    assert_contains "$output" "TASK_MANIFEST_FILE:" "Should include TASK_MANIFEST_FILE"
    assert_contains "$output" "RESUME_INDEX_FILE:" "Should include RESUME_INDEX_FILE"
}

test_paths_only_json_mode_lists_canonical_paths() {
    describe "Should output canonical paths in JSON with --paths-only --json"

    local req_id="REQ-002"
    bootstrap_requirement "$req_id" >/dev/null

    local output
    output=$(run_check_prereq "$req_id" --paths-only --json)

    assert_json_valid "$output" "Should output valid JSON"
    assert_json_field "$output" "HARNESS_STATE_FILE" "$TEST_TMP_DIR/devflow/requirements/$req_id/harness-state.json" "Should include harness-state path"
    assert_json_field "$output" "CONTEXT_PACKAGE_FILE" "$TEST_TMP_DIR/devflow/requirements/$req_id/context-package.md" "Should include context-package path"
    assert_json_field "$output" "RESUME_INDEX_FILE" "$TEST_TMP_DIR/devflow/intent/$req_id/resume-index.md" "Should include resume-index path"
}

test_bootstrap_only_requirement_succeeds() {
    describe "Should succeed for bootstrap-only requirement without PRD"

    local req_id="REQ-003"
    bootstrap_requirement "$req_id" >/dev/null

    run_check_prereq "$req_id" >/dev/null
    local exit_code
    exit_code=$(last_exit_code)

    assert_equals "$exit_code" "0" "Should accept bootstrap-only requirement"
}

test_require_epic_needs_prd() {
    describe "Should require PRD.md when --require-epic is used"

    local req_id="REQ-004"
    bootstrap_requirement "$req_id" >/dev/null

    local output
    output=$(run_check_prereq "$req_id" --require-epic)
    local exit_code
    exit_code=$(last_exit_code)

    assert_not_equals "$exit_code" "0" "Should fail without PRD.md"
    assert_contains "$output" "PRD.md not found" "Should mention missing PRD"
}

test_require_tasks_fails_without_task_input() {
    describe "Should fail with --require-tasks when no task source exists"

    local req_id="REQ-005"
    full_requirement "$req_id" >/dev/null

    local output
    output=$(run_check_prereq "$req_id" --require-tasks)
    local exit_code
    exit_code=$(last_exit_code)

    assert_not_equals "$exit_code" "0" "Should fail without task sources"
    assert_contains "$output" "Expected one of: task-manifest.json, TASKS.md, or non-empty tasks/ directory." "Should mention accepted task inputs"
}

test_require_tasks_accepts_task_manifest() {
    describe "Should accept task-manifest.json as executable task input"

    local req_id="REQ-006"
    local req_dir
    req_dir=$(full_requirement "$req_id")
    cat > "$req_dir/task-manifest.json" <<'EOF'
{"tasks":[{"id":"T-1","title":"Implement thin harness spine"}]}
EOF

    run_check_prereq "$req_id" --require-tasks >/dev/null
    local exit_code
    exit_code=$(last_exit_code)

    assert_equals "$exit_code" "0" "Should accept task-manifest.json"
}

test_require_tasks_accepts_tasks_markdown() {
    describe "Should accept TASKS.md as executable task input"

    local req_id="REQ-007"
    local req_dir
    req_dir=$(full_requirement "$req_id")
    echo "- [ ] Task 1" > "$req_dir/TASKS.md"

    run_check_prereq "$req_id" --require-tasks >/dev/null
    local exit_code
    exit_code=$(last_exit_code)

    assert_equals "$exit_code" "0" "Should accept TASKS.md"
}

test_require_tasks_accepts_non_empty_tasks_dir() {
    describe "Should accept non-empty tasks/ as executable task input"

    local req_id="REQ-008"
    local req_dir
    req_dir=$(full_requirement "$req_id")
    echo "# task" > "$req_dir/tasks/TASK_001.md"

    run_check_prereq "$req_id" --require-tasks >/dev/null
    local exit_code
    exit_code=$(last_exit_code)

    assert_equals "$exit_code" "0" "Should accept non-empty tasks directory"
}

test_json_output_lists_canonical_docs() {
    describe "Should list canonical docs in JSON output"

    local req_id="REQ-009"
    local req_dir
    req_dir=$(full_requirement "$req_id")
    echo "# Test Plan" > "$req_dir/TEST_PLAN.md"
    cat > "$req_dir/task-manifest.json" <<'EOF'
{"tasks":[{"id":"T-1"}]}
EOF

    local output
    output=$(run_check_prereq "$req_id" --json)

    assert_json_valid "$output" "Should output valid JSON"
    assert_contains "$output" "\"harness-state.json\"" "Should include harness-state"
    assert_contains "$output" "\"context-package.md\"" "Should include context-package"
    assert_contains "$output" "\"task-manifest.json\"" "Should include task-manifest"
    assert_contains "$output" "\"resume-index.md\"" "Should include resume-index"
    assert_contains "$output" "\"TEST_PLAN.md\"" "Should include test plan"
}

test_include_tasks_lists_task_sources() {
    describe "Should list task sources when --include-tasks is enabled"

    local req_id="REQ-010"
    local req_dir
    req_dir=$(full_requirement "$req_id")
    echo "# task" > "$req_dir/tasks/TASK_001.md"

    local output
    output=$(run_check_prereq "$req_id" --include-tasks --json)

    assert_contains "$output" "\"tasks/\"" "Should include tasks directory in AVAILABLE_DOCS"
}

test_bug_requirement_uses_bug_directory() {
    describe "Should resolve BUG requirements from devflow/bugs"

    local req_id="BUG-011"
    local req_dir
    req_dir=$(bootstrap_requirement "$req_id")
    cat > "$req_dir/status.json" <<EOF
{"bugId":"$req_id","status":"initialized"}
EOF

    local output
    output=$(run_check_prereq "$req_id" --json)
    local exit_code
    exit_code=$(last_exit_code)

    assert_equals "$exit_code" "0" "Should accept bug requirements"
    assert_contains "$output" "\"REQ_TYPE\":\"bug\"" "Should report bug type"
    assert_contains "$output" "\"REQ_DIR\":\"$req_dir\"" "Should point to bug directory"
}

test_invalid_option() {
    describe "Should reject invalid options"

    local output
    output=$(run_check_prereq "REQ-012" --invalid-option)
    local exit_code
    exit_code=$(last_exit_code)

    assert_not_equals "$exit_code" "0" "Should fail on invalid option"
    assert_contains "$output" "Unknown option" "Should mention unknown option"
}

run_tests \
    test_help_flag \
    test_no_req_id_error \
    test_paths_only_mode_lists_canonical_paths \
    test_paths_only_json_mode_lists_canonical_paths \
    test_bootstrap_only_requirement_succeeds \
    test_require_epic_needs_prd \
    test_require_tasks_fails_without_task_input \
    test_require_tasks_accepts_task_manifest \
    test_require_tasks_accepts_tasks_markdown \
    test_require_tasks_accepts_non_empty_tasks_dir \
    test_json_output_lists_canonical_docs \
    test_include_tasks_lists_task_sources \
    test_bug_requirement_uses_bug_directory \
    test_invalid_option
