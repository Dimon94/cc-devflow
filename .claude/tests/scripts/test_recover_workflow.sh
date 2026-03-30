#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 .claude/tests/test-framework.sh 与 recover-workflow.sh/common.sh 副本，在临时仓库中构造 harness/resume-index 夹具。
# [OUTPUT]: 回归验证 recover-workflow.sh 会从 resume-index 与 harness-state 推导当前恢复阶段和下一步动作。
# [POS]: .claude/tests/scripts 的恢复入口测试，用于守住 restart 分析器贴合当前主链阶段语义。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SCRIPT_SOURCE_DIR="$REPO_ROOT/.claude/scripts"

setup_recover_fixture() {
    local test_repo
    test_repo=$(mktemp -d "${TEST_TMP_DIR}/recover-repo.XXXXXX")
    mkdir -p "$test_repo/.claude/scripts" "$test_repo/lib/harness"

    cp "$SCRIPT_SOURCE_DIR/common.sh" "$test_repo/.claude/scripts/common.sh"
    cp "$SCRIPT_SOURCE_DIR/recover-workflow.sh" "$test_repo/.claude/scripts/recover-workflow.sh"
    chmod +x "$test_repo/.claude/scripts/recover-workflow.sh"

    cat > "$test_repo/lib/harness/query.js" <<'EOF'
async function getFullState(repoRoot, changeId) {
  if (changeId === 'REQ-123') {
    return {
      lifecycle: {
        status: 'verified',
        stage: 'execute',
        updatedAt: '2026-03-26T02:00:00Z'
      },
      progress: {
        totalTasks: 4,
        completedTasks: 4
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
        "$test_repo/devflow/intent/REQ-123"

    cat > "$test_repo/devflow/requirements/REQ-123/harness-state.json" <<'EOF'
{
  "changeId": "REQ-123",
  "goal": "Ship checkout",
  "status": "verified",
  "updatedAt": "2026-03-26T02:00:00Z"
}
EOF

    cat > "$test_repo/devflow/intent/REQ-123/resume-index.md" <<'EOF'
# Resume Index: REQ-123

- Stage: prepare-pr
- Goal: Ship checkout
- Lifecycle: verified
- Updated At: 2026-03-26T02:00:00Z

## Last Good Checkpoint

- Verification completed.

## Next Action

运行 `/flow:prepare-pr "REQ-123"` 进入提审准备。
EOF

    echo "# PRD" > "$test_repo/devflow/requirements/REQ-123/PRD.md"
    echo "# TASKS" > "$test_repo/devflow/requirements/REQ-123/TASKS.md"
    echo "# TEST REPORT" > "$test_repo/devflow/requirements/REQ-123/TEST_REPORT.md"

    echo "$test_repo"
}

run_recover() {
    local test_repo="$1"
    shift
    (
        cd "$test_repo"
        bash ".claude/scripts/recover-workflow.sh" "$@"
    )
}

test_help_flag() {
    describe "Should show help with --help"

    local test_repo
    test_repo=$(setup_recover_fixture)

    local output
    output=$(run_recover "$test_repo" --help 2>&1)

    assert_contains "$output" "用法:" "Should show usage"
    assert_contains "$output" "--from STAGE" "Should mention --from option"
}

test_dry_run_prefers_resume_index_stage() {
    describe "dry-run should prefer resume-index stage over runtime stage"

    local test_repo
    test_repo=$(setup_recover_fixture)

    local output
    output=$(run_recover "$test_repo" REQ-123 --dry-run 2>&1)

    assert_contains "$output" "下一步唯一动作" "Should surface next action from resume-index"
    assert_contains "$output" "/flow:prepare-pr \"REQ-123\"" "Should include prepare-pr next action"
    assert_contains "$output" "阶段:     prepare-pr" "Should report mapped phase from resume-index"
    assert_contains "$output" "起始阶段: prepare-pr" "Should recover from prepare-pr instead of falling back to dev/verify"
}

test_from_qa_normalizes_to_verify() {
    describe "compatibility --from qa should normalize to verify"

    local test_repo
    test_repo=$(setup_recover_fixture)

    local output
    output=$(run_recover "$test_repo" REQ-123 --from qa --dry-run 2>&1)

    assert_contains "$output" "用户指定从阶段恢复: qa" "Should show original compatibility stage"
    assert_contains "$output" "起始阶段: verify" "Should normalize qa to verify"
    assert_contains "$output" "/flow:verify \"REQ-123\" --strict" "Should plan verify command"
}

run_tests \
    test_help_flag \
    test_dry_run_prefers_resume_index_stage \
    test_from_qa_normalizes_to_verify
