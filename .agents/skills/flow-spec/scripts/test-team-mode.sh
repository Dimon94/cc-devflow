#!/usr/bin/env bash
# =============================================================================
# Integration Tests for flow-spec Team Mode
# =============================================================================
# [INPUT]: 依赖 team-init.sh, common.sh
# [OUTPUT]: 测试结果报告
# [POS]: flow-spec/scripts/ 的集成测试
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
source "$REPO_ROOT/.claude/scripts/common.sh"

# =============================================================================
# Test Framework
# =============================================================================

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TEST_TEMP_DIR=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Assert equals
# Args: $1 - actual, $2 - expected, $3 - message
assert_equals() {
    local actual="$1"
    local expected="$2"
    local message="${3:-Assertion failed}"

    TESTS_RUN=$((TESTS_RUN + 1))

    if [[ "$actual" == "$expected" ]]; then
        echo -e "${GREEN}  PASS${NC}: $message"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}  FAIL${NC}: $message"
        echo "    Expected: '$expected'"
        echo "    Actual:   '$actual'"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Assert not empty
# Args: $1 - value, $2 - message
assert_not_empty() {
    local value="$1"
    local message="${2:-Value should not be empty}"

    TESTS_RUN=$((TESTS_RUN + 1))

    if [[ -n "$value" ]]; then
        echo -e "${GREEN}  PASS${NC}: $message"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}  FAIL${NC}: $message"
        echo "    Value is empty"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Assert file exists
# Args: $1 - file path, $2 - message
assert_file_exists() {
    local file_path="$1"
    local message="${2:-File should exist}"

    TESTS_RUN=$((TESTS_RUN + 1))

    if [[ -f "$file_path" ]]; then
        echo -e "${GREEN}  PASS${NC}: $message"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}  FAIL${NC}: $message"
        echo "    File not found: $file_path"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Assert JSON field equals
# Args: $1 - json file, $2 - jq path, $3 - expected, $4 - message
assert_json_field() {
    local json_file="$1"
    local jq_path="$2"
    local expected="$3"
    local message="${4:-JSON field assertion}"

    local actual
    actual=$(jq -r "$jq_path" "$json_file" 2>/dev/null || echo "")

    assert_equals "$actual" "$expected" "$message"
}

# Assert JSON field not null
# Args: $1 - json file, $2 - jq path, $3 - message
assert_json_not_null() {
    local json_file="$1"
    local jq_path="$2"
    local message="${3:-JSON field should not be null}"

    TESTS_RUN=$((TESTS_RUN + 1))

    local value
    value=$(jq -r "$jq_path" "$json_file" 2>/dev/null || echo "null")

    if [[ "$value" != "null" ]] && [[ -n "$value" ]]; then
        echo -e "${GREEN}  PASS${NC}: $message"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}  FAIL${NC}: $message"
        echo "    Path '$jq_path' is null or empty"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Setup test environment
setup_test_env() {
    TEST_TEMP_DIR=$(mktemp -d)
    mkdir -p "$TEST_TEMP_DIR/devflow/requirements/REQ-TEST"

    # Create minimal orchestration_status.json
    cat > "$TEST_TEMP_DIR/devflow/requirements/REQ-TEST/orchestration_status.json" <<EOF
{
  "reqId": "REQ-TEST",
  "status": "initialized",
  "phase": "planning",
  "createdAt": "$(get_beijing_time_iso)",
  "updatedAt": "$(get_beijing_time_iso)"
}
EOF

    # Create minimal TASKS.md
    cat > "$TEST_TEMP_DIR/devflow/requirements/REQ-TEST/TASKS.md" <<EOF
# Tasks for REQ-TEST

## Phase 1: PRD
- [ ] **T001** Write PRD document
- [ ] **T002** Review PRD

## Phase 2: Design
- [ ] **T003** Create tech design
- [ ] **T004** Create UI prototype
EOF

    echo "$TEST_TEMP_DIR"
}

# Cleanup test environment
cleanup_test_env() {
    if [[ -n "$TEST_TEMP_DIR" ]] && [[ -d "$TEST_TEMP_DIR" ]]; then
        rm -rf "$TEST_TEMP_DIR"
    fi
}

# =============================================================================
# Test Cases
# =============================================================================

# Test 1: Mode Detection Tests
test_mode_detection() {
    echo ""
    echo -e "${YELLOW}=== Test Suite: Mode Detection ===${NC}"

    # Source team-init.sh functions
    source "$SCRIPT_DIR/team-init.sh"

    # Test 1.1: Full mode should return "team"
    local result
    result=$(detect_execution_mode "false" "false")
    assert_equals "$result" "team" "Full mode (no skip) should use team"

    # Test 1.2: Skip tech should return "subagent"
    result=$(detect_execution_mode "true" "false")
    assert_equals "$result" "subagent" "Skip tech should use subagent"

    # Test 1.3: Skip ui should return "subagent"
    result=$(detect_execution_mode "false" "true")
    assert_equals "$result" "subagent" "Skip ui should use subagent"

    # Test 1.4: Skip both should return "subagent"
    result=$(detect_execution_mode "true" "true")
    assert_equals "$result" "subagent" "Skip both should use subagent"
}

# Test 2: Team Initialization Tests
test_team_initialization() {
    echo ""
    echo -e "${YELLOW}=== Test Suite: Team Initialization ===${NC}"

    local temp_dir
    temp_dir=$(setup_test_env)

    # Source team-init.sh functions
    source "$SCRIPT_DIR/team-init.sh"

    # Test 2.1: Initialize team
    init_spec_team "$temp_dir" "REQ-TEST" > /dev/null 2>&1

    local status_file="$temp_dir/devflow/requirements/REQ-TEST/orchestration_status.json"

    # Test 2.2: Verify team mode
    assert_json_field "$status_file" ".team.mode" "parallel" "Team mode should be parallel"

    # Test 2.3: Verify team lead
    assert_json_field "$status_file" ".team.lead" "spec-lead" "Team lead should be spec-lead"

    # Test 2.4: Verify teammates count
    local teammates_count
    teammates_count=$(jq '.team.teammates | length' "$status_file")
    assert_equals "$teammates_count" "4" "Should have 4 teammates"

    # Test 2.5: Verify prd-writer exists
    local prd_writer
    prd_writer=$(jq -r '.team.teammates[] | select(.id == "prd-writer") | .role' "$status_file")
    assert_equals "$prd_writer" "analyst" "prd-writer should have analyst role"

    # Test 2.6: Verify tech-architect exists
    local tech_architect
    tech_architect=$(jq -r '.team.teammates[] | select(.id == "tech-architect") | .role' "$status_file")
    assert_equals "$tech_architect" "architect" "tech-architect should have architect role"

    # Test 2.7: Verify ui-designer exists
    local ui_designer
    ui_designer=$(jq -r '.team.teammates[] | select(.id == "ui-designer") | .role' "$status_file")
    assert_equals "$ui_designer" "designer" "ui-designer should have designer role"

    # Test 2.8: Verify planner exists
    local planner
    planner=$(jq -r '.team.teammates[] | select(.id == "planner") | .role' "$status_file")
    assert_equals "$planner" "planner" "planner should have planner role"

    # Test 2.9: Verify Ralph Loop initialized
    assert_json_not_null "$status_file" ".ralphLoop" "Ralph Loop should be initialized"

    # Test 2.10: Verify Ralph Loop enabled
    assert_json_field "$status_file" ".ralphLoop.enabled" "true" "Ralph Loop should be enabled"

    cleanup_test_env
}

# Test 3: Team Configuration Tests
test_team_configuration() {
    echo ""
    echo -e "${YELLOW}=== Test Suite: Team Configuration ===${NC}"

    # Test 3.1: Verify team-config.json exists
    local config_file="$SCRIPT_DIR/../team-config.json"
    assert_file_exists "$config_file" "team-config.json should exist"

    # Test 3.2: Verify config is valid JSON
    if jq empty "$config_file" 2>/dev/null; then
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${GREEN}  PASS${NC}: team-config.json is valid JSON"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${RED}  FAIL${NC}: team-config.json is not valid JSON"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    # Test 3.3: Verify required fields
    assert_json_field "$config_file" ".name" "spec-design-team" "Config name should be spec-design-team"
    assert_json_field "$config_file" ".mode" "parallel" "Config mode should be parallel"
    assert_json_field "$config_file" ".lead" "spec-lead" "Config lead should be spec-lead"

    # Test 3.4: Verify members array
    local members_count
    members_count=$(jq '.members | length' "$config_file")
    assert_equals "$members_count" "4" "Config should have 4 members"

    # Test 3.5: Verify workflow stages
    local stages_count
    stages_count=$(jq '.workflow.stages | length' "$config_file")
    assert_equals "$stages_count" "3" "Config should have 3 workflow stages"

    # Test 3.6: Verify negotiate topics
    local topics_count
    topics_count=$(jq '.communication.negotiate_topics | length' "$config_file")
    assert_not_empty "$topics_count" "Config should have negotiate topics"

    # Test 3.7: Verify quality gates
    assert_json_not_null "$config_file" ".quality_gates.entry" "Entry gate should be defined"
    assert_json_not_null "$config_file" ".quality_gates.exit" "Exit gate should be defined"
}

# Test 4: Common.sh Team Functions Tests
test_common_team_functions() {
    echo ""
    echo -e "${YELLOW}=== Test Suite: Common.sh Team Functions ===${NC}"

    local temp_dir
    temp_dir=$(setup_test_env)

    # Test 4.1: is_team_mode_enabled (before init)
    if ! is_team_mode_enabled "$temp_dir" "REQ-TEST"; then
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${GREEN}  PASS${NC}: Team mode not enabled before init"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${RED}  FAIL${NC}: Team mode should not be enabled before init"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    # Initialize team
    init_team_state "$temp_dir" "REQ-TEST" "parallel" "spec-lead"
    add_teammate "$temp_dir" "REQ-TEST" "test-dev" "developer"

    # Test 4.2: is_team_mode_enabled (after init)
    if is_team_mode_enabled "$temp_dir" "REQ-TEST"; then
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${GREEN}  PASS${NC}: Team mode enabled after init"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${RED}  FAIL${NC}: Team mode should be enabled after init"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    # Test 4.3: get_teammate
    local teammate
    teammate=$(get_teammate "$temp_dir" "REQ-TEST" "test-dev")
    local teammate_role
    teammate_role=$(echo "$teammate" | jq -r '.role')
    assert_equals "$teammate_role" "developer" "get_teammate should return correct role"

    # Test 4.4: update_teammate_status
    update_teammate_status "$temp_dir" "REQ-TEST" "test-dev" "working" "T001"
    teammate=$(get_teammate "$temp_dir" "REQ-TEST" "test-dev")
    local teammate_status
    teammate_status=$(echo "$teammate" | jq -r '.status')
    assert_equals "$teammate_status" "working" "update_teammate_status should update status"

    local current_task
    current_task=$(echo "$teammate" | jq -r '.currentTask')
    assert_equals "$current_task" "T001" "update_teammate_status should update currentTask"

    # Test 4.5: mark_teammate_task_complete
    mark_teammate_task_complete "$temp_dir" "REQ-TEST" "test-dev" "T001"
    teammate=$(get_teammate "$temp_dir" "REQ-TEST" "test-dev")
    teammate_status=$(echo "$teammate" | jq -r '.status')
    assert_equals "$teammate_status" "idle" "mark_teammate_task_complete should set status to idle"

    local completed_tasks
    completed_tasks=$(echo "$teammate" | jq -r '.completedTasks | length')
    assert_equals "$completed_tasks" "1" "mark_teammate_task_complete should add to completedTasks"

    # Test 4.6: assign_task_to_teammate
    assign_task_to_teammate "$temp_dir" "REQ-TEST" "T002" "test-dev"
    local status_file="$temp_dir/devflow/requirements/REQ-TEST/orchestration_status.json"
    local assigned_to
    assigned_to=$(jq -r '.team.taskAssignments.T002' "$status_file")
    assert_equals "$assigned_to" "test-dev" "assign_task_to_teammate should update taskAssignments"

    # Test 4.7: get_unassigned_tasks
    local unassigned
    unassigned=$(get_unassigned_tasks "$temp_dir" "REQ-TEST")
    # T001 completed, T002 assigned, T003 and T004 should be unassigned
    if echo "$unassigned" | grep -q "T003"; then
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${GREEN}  PASS${NC}: get_unassigned_tasks returns T003"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${RED}  FAIL${NC}: get_unassigned_tasks should return T003"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    # Test 4.8: all_teammates_idle
    update_teammate_status "$temp_dir" "REQ-TEST" "test-dev" "idle" "null"
    if all_teammates_idle "$temp_dir" "REQ-TEST"; then
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${GREEN}  PASS${NC}: all_teammates_idle returns true when all idle"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${RED}  FAIL${NC}: all_teammates_idle should return true"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    # Test 4.9: update_teammate_ralph_state
    update_teammate_ralph_state "$temp_dir" "REQ-TEST" "test-dev" "passed"
    local ralph_iteration
    ralph_iteration=$(jq -r '.ralphLoop.teammates["test-dev"].iteration' "$status_file")
    assert_equals "$ralph_iteration" "1" "update_teammate_ralph_state should increment iteration"

    local ralph_result
    ralph_result=$(jq -r '.ralphLoop.teammates["test-dev"].lastVerifyResult' "$status_file")
    assert_equals "$ralph_result" "passed" "update_teammate_ralph_state should update lastVerifyResult"

    # Test 4.10: cleanup_team_state
    cleanup_team_state "$temp_dir" "REQ-TEST"
    if ! is_team_mode_enabled "$temp_dir" "REQ-TEST"; then
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${GREEN}  PASS${NC}: cleanup_team_state removes team state"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${RED}  FAIL${NC}: cleanup_team_state should remove team state"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    cleanup_test_env
}

# Test 5: CLI Interface Tests
test_cli_interface() {
    echo ""
    echo -e "${YELLOW}=== Test Suite: CLI Interface ===${NC}"

    local temp_dir
    temp_dir=$(setup_test_env)

    # Test 5.1: detect command
    local result
    result=$("$SCRIPT_DIR/team-init.sh" detect "" "" "false" "false")
    assert_equals "$result" "team" "CLI detect command should work"

    # Test 5.2: config command
    result=$("$SCRIPT_DIR/team-init.sh" config)
    if echo "$result" | jq -e '.name' > /dev/null 2>&1; then
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${GREEN}  PASS${NC}: CLI config command returns valid JSON"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        echo -e "${RED}  FAIL${NC}: CLI config command should return valid JSON"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    # Test 5.3: init command
    "$SCRIPT_DIR/team-init.sh" init "$temp_dir" "REQ-TEST" > /dev/null 2>&1
    local status_file="$temp_dir/devflow/requirements/REQ-TEST/orchestration_status.json"
    assert_json_not_null "$status_file" ".team" "CLI init command should create team state"

    cleanup_test_env
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "  flow-spec Team Mode Integration Tests"
    echo "=============================================="
    echo ""

    # Run all test suites
    test_mode_detection
    test_team_initialization
    test_team_configuration
    test_common_team_functions
    test_cli_interface

    # Print summary
    echo ""
    echo "=============================================="
    echo "  Test Summary"
    echo "=============================================="
    echo ""
    echo "  Total:  $TESTS_RUN"
    echo -e "  ${GREEN}Passed${NC}: $TESTS_PASSED"
    echo -e "  ${RED}Failed${NC}: $TESTS_FAILED"
    echo ""

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed.${NC}"
        exit 1
    fi
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
