#!/usr/bin/env bash

# Test suite for sync-task-marks.sh

# Source the test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

# Script paths
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SYNC_SCRIPT="$REPO_ROOT/scripts/sync-task-marks.sh"

# ============================================================================
# Helper functions
# ============================================================================

# Create test-specific common.sh
create_test_common() {
    local test_common="$TEST_TMP_DIR/scripts/common.sh"
    mkdir -p "$(dirname "$test_common")"

    # Create minimal common.sh with custom functions from stdin
    if [[ ! -t 0 ]]; then
        cat > "$test_common"
    else
        # Default minimal implementation
        cat > "$test_common" <<'EOF'
get_repo_root() {
    echo "/tmp/test"
}

get_requirement_paths() {
    echo 'REQ_ID=""'
    echo 'REQ_DIR=""'
    echo 'REPO_ROOT="/tmp/test"'
}

log_event() {
    echo "LOG: $*" >&2
}
EOF
    fi

    echo "$test_common"
}

# ============================================================================
# Tests
# ============================================================================

# Test: Help message
test_help_message() {
    local output=$(bash "$SYNC_SCRIPT" --help 2>&1)
    assert_contains "$output" "Usage: sync-task-marks.sh"
    assert_contains "$output" "--dry-run"
    assert_contains "$output" "--auto-mark"
}

# Test: Error when no requirement ID
test_no_requirement_id() {
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    # Create temp common.sh with get_requirement_paths that returns empty REQ_ID
    create_test_common <<'COMMON_EOF'
get_requirement_paths() {
    echo 'REQ_ID=""'
    echo 'REQ_DIR=""'
    echo 'REPO_ROOT="'"$REPO_ROOT"'"'
}

log_event() {
    echo "LOG: $*" >&2
}
COMMON_EOF

    (
        bash "$SYNC_SCRIPT" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local exit_code=$(cat "$exit_code_file")
    local output=$(cat "$output_file")

    assert_equals "$exit_code" "1"
    assert_contains "$output" "ERROR: No requirement ID found"
}

# Test: Error when requirement directory not found
test_requirement_directory_not_found() {
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

    # Create temp common.sh
    create_test_common <<COMMON_EOF
get_requirement_paths() {
    echo 'REQ_ID="REQ-999"'
    echo 'REQ_DIR="$TEST_TMP_DIR/nonexistent"'
    echo 'REPO_ROOT="$REPO_ROOT"'
}

log_event() {
    echo "LOG: \$*" >&2
}
COMMON_EOF

    (
        bash "$SYNC_SCRIPT" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local exit_code=$(cat "$exit_code_file")
    local output=$(cat "$output_file")

    assert_equals "$exit_code" "1"
    assert_contains "$output" "ERROR: Requirement directory not found"
}

# Test: Error when TASKS.md not found
test_tasks_file_not_found() {
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    local req_dir="$TEST_TMP_DIR/requirements/REQ-001"

    mkdir -p "$req_dir"

    # Create temp common.sh
    create_test_common <<COMMON_EOF
get_requirement_paths() {
    echo 'REQ_ID="REQ-001"'
    echo 'REQ_DIR="$req_dir"'
    echo 'REPO_ROOT="$REPO_ROOT"'
}

log_event() {
    echo "LOG: \$*" >&2
}
COMMON_EOF

    (
        bash "$SYNC_SCRIPT" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local exit_code=$(cat "$exit_code_file")
    local output=$(cat "$output_file")

    assert_equals "$exit_code" "1"
    assert_contains "$output" "ERROR: TASKS.md not found"
}

# Test: All tasks completed
test_all_tasks_completed() {
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    local req_dir="$TEST_TMP_DIR/requirements/REQ-001"

    mkdir -p "$req_dir"

    # Create TASKS.md with all completed tasks
    cat > "$req_dir/TASKS.md" <<'EOF'
# Tasks: REQ-001

## Phase 1: Setup
- [x] **T001** Initialize project structure
- [x] **T002** Setup dependencies

## Phase 2: Tests First
- [x] **T003** Write user creation test
EOF

    # Create temp common.sh
    create_test_common <<COMMON_EOF
get_requirement_paths() {
    echo 'REQ_ID="REQ-001"'
    echo 'REQ_DIR="$req_dir"'
    echo 'REPO_ROOT="$REPO_ROOT"'
}

log_event() {
    echo "LOG: \$*" >&2
}
COMMON_EOF

    (
        bash "$SYNC_SCRIPT" > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local exit_code=$(cat "$exit_code_file")
    local output=$(cat "$output_file")

    assert_equals "$exit_code" "0"
    assert_contains "$output" "All tasks are marked as complete"
}

# Test: List uncompleted tasks
test_list_uncompleted_tasks() {
    local output_file="$TEST_TMP_DIR/output.txt"
    local exit_code_file="$TEST_TMP_DIR/exitcode.txt"
    local req_dir="$TEST_TMP_DIR/requirements/REQ-001"

    mkdir -p "$req_dir"

    # Create TASKS.md with mixed completion status
    cat > "$req_dir/TASKS.md" <<'EOF'
# Tasks: REQ-001

## Phase 1: Setup
- [x] **T001** Initialize project structure
- [ ] **T002** Setup dependencies

## Phase 2: Tests First
- [ ] **T003** Write user creation test
- [x] **T004** Write login test
EOF

    # Create temp common.sh
    create_test_common <<COMMON_EOF
get_requirement_paths() {
    echo 'REQ_ID="REQ-001"'
    echo 'REQ_DIR="$req_dir"'
    echo 'REPO_ROOT="$REPO_ROOT"'
}

log_event() {
    echo "LOG: \$*" >&2
}
COMMON_EOF

    (
        bash "$SYNC_SCRIPT" --dry-run > "$output_file" 2>&1
        echo $? > "$exit_code_file"
    )

    local exit_code=$(cat "$exit_code_file")
    local output=$(cat "$output_file")

    assert_equals "$exit_code" "0"
    assert_contains "$output" "Completed:       2"
    assert_contains "$output" "Remaining:       2"
    assert_contains "$output" "T002"
    assert_contains "$output" "T003"
    assert_contains "$output" "DRY RUN"
}

# Test: Dry run shows commands
test_dry_run_shows_commands() {
    local output_file="$TEST_TMP_DIR/output.txt"
    local req_dir="$TEST_TMP_DIR/requirements/REQ-001"

    mkdir -p "$req_dir"

    cat > "$req_dir/TASKS.md" <<'EOF'
# Tasks: REQ-001

- [ ] **T001** Task one
- [ ] **T002** Task two
EOF

    create_test_common <<COMMON_EOF
get_requirement_paths() {
    echo 'REQ_ID="REQ-001"'
    echo 'REQ_DIR="$req_dir"'
    echo 'REPO_ROOT="$REPO_ROOT"'
}

log_event() {
    echo "LOG: \$*" >&2
}
COMMON_EOF

    bash "$SYNC_SCRIPT" --dry-run > "$output_file" 2>&1

    local output=$(cat "$output_file")

    assert_contains "$output" "mark-task-complete.sh T001"
    assert_contains "$output" "mark-task-complete.sh T002"
}

# Run all tests
run_tests \
    test_help_message \
    test_no_requirement_id \
    test_requirement_directory_not_found \
    test_tasks_file_not_found \
    test_all_tasks_completed \
    test_list_uncompleted_tasks \
    test_dry_run_shows_commands
