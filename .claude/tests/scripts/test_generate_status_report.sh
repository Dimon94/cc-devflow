#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 .claude/tests/test-framework.sh 与 generate-status-report.sh/common.sh 副本，在临时仓库中构造 harness/resume-index 夹具。
# [OUTPUT]: 回归验证 generate-status-report.sh 优先读取 harness-state 与 resume-index，再回退 compatibility 状态。
# [POS]: .claude/tests/scripts 的状态视图测试，用于守住 status 报告不会漂回旧 orchestration-first 世界。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SCRIPT_SOURCE_DIR="$REPO_ROOT/.claude/scripts"

setup_status_fixture() {
    local test_repo
    test_repo=$(mktemp -d "${TEST_TMP_DIR}/status-repo.XXXXXX")
    mkdir -p "$test_repo/.claude/scripts" "$test_repo/lib/harness"

    cp "$SCRIPT_SOURCE_DIR/common.sh" "$test_repo/.claude/scripts/common.sh"
    cp "$SCRIPT_SOURCE_DIR/generate-status-report.sh" "$test_repo/.claude/scripts/generate-status-report.sh"
    chmod +x "$test_repo/.claude/scripts/generate-status-report.sh"

    cat > "$test_repo/lib/harness/query.js" <<'EOF'
async function getFullState(repoRoot, changeId) {
  if (changeId === 'REQ-123') {
    return {
      lifecycle: {
        status: 'verified',
        stage: 'execute',
        updatedAt: '2026-03-26T01:10:00Z'
      },
      progress: {
        totalTasks: 5,
        completedTasks: 5
      }
    };
  }
  return {
    lifecycle: {
      status: 'unknown',
      stage: 'unknown',
      updatedAt: ''
    },
    progress: {
      totalTasks: 0,
      completedTasks: 0
    }
  };
}

module.exports = { getFullState };
EOF

    (
        cd "$test_repo"
        git init -q
    )

    mkdir -p \
        "$test_repo/devflow/requirements/REQ-123" \
        "$test_repo/devflow/requirements/REQ-124" \
        "$test_repo/devflow/intent/REQ-123"

    cat > "$test_repo/devflow/requirements/REQ-123/harness-state.json" <<'EOF'
{
  "changeId": "REQ-123",
  "goal": "Ship checkout",
  "status": "verified",
  "updatedAt": "2026-03-26T01:10:00Z"
}
EOF

    cat > "$test_repo/devflow/intent/REQ-123/resume-index.md" <<'EOF'
# Resume Index: REQ-123

- Stage: prepare-pr
- Goal: Ship checkout
- Lifecycle: verified
- Updated At: 2026-03-26T01:10:00Z

## Next Action

Run /flow:prepare-pr.
EOF

    cat > "$test_repo/devflow/requirements/REQ-124/orchestration_status.json" <<'EOF'
{
  "reqId": "REQ-124",
  "title": "Legacy fallback",
  "status": "development",
  "phase": "dev",
  "updatedAt": "2026-03-26T09:30:00+08:00"
}
EOF

    echo "$test_repo"
}

run_status_report() {
    local test_repo="$1"
    shift
    (
        cd "$test_repo"
        bash ".claude/scripts/generate-status-report.sh" "$@"
    )
}

test_help_flag() {
    describe "Should show help with --help"

    local test_repo
    test_repo=$(setup_status_fixture)

    local output
    output=$(run_status_report "$test_repo" --help 2>&1)

    assert_contains "$output" "用法:" "Should show usage"
    assert_contains "$output" "--format" "Should mention format option"
}

test_json_prefers_harness_goal_and_resume_stage() {
    describe "json output should prefer harness goal and resume-index stage"

    local test_repo
    test_repo=$(setup_status_fixture)

    local output
    output=$(run_status_report "$test_repo" --format json --no-color)

    assert_json_valid "$output" "Status report json should be valid"
    assert_json_field "$output" "requirements[0].id" "REQ-123" "First requirement should be REQ-123"
    assert_json_field "$output" "requirements[0].title" "Ship checkout" "Should prefer harness goal as title"
    assert_json_field "$output" "requirements[0].phase" "prepare-pr" "Should let resume-index override runtime stage"
    assert_json_field "$output" "requirements[0].phase_display" "准备 PR" "Should map prepare-pr to current display name"
}

test_json_falls_back_to_compatibility_state() {
    describe "json output should fall back to compatibility state when harness files are missing"

    local test_repo
    test_repo=$(setup_status_fixture)

    local output
    output=$(run_status_report "$test_repo" --format json --status dev --no-color)

    assert_json_valid "$output" "Filtered json should be valid"
    assert_json_field "$output" "total_requirements" "1" "Dev filter should keep only compatibility-backed dev requirement"
    assert_json_field "$output" "requirements[0].id" "REQ-124" "Should include legacy fallback requirement"
    assert_json_field "$output" "requirements[0].title" "Legacy fallback" "Should read compatibility title"
    assert_json_field "$output" "requirements[0].phase" "dev" "Should preserve compatibility phase"
}

run_tests \
    test_help_flag \
    test_json_prefers_harness_goal_and_resume_stage \
    test_json_falls_back_to_compatibility_state
