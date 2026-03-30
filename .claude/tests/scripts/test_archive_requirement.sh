#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 .claude/tests/test-framework.sh 与归档脚本副本，在临时 git 仓库中构造 harness/resume-index 夹具。
# [OUTPUT]: 回归验证 archive-requirement.sh 的 archive/list/restore 行为与 compatibility 清理结果。
# [POS]: .claude/tests/scripts 的生命周期收尾回归，用于守住 archive 主线不漂回旧状态世界。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SCRIPT_SOURCE_DIR="$REPO_ROOT/.claude/scripts"

setup_archive_fixture() {
    local test_repo
    test_repo=$(mktemp -d "${TEST_TMP_DIR}/repo.XXXXXX")
    mkdir -p "$test_repo/.claude/scripts"

    cp "$SCRIPT_SOURCE_DIR/common.sh" "$test_repo/.claude/scripts/common.sh"
    cp "$SCRIPT_SOURCE_DIR/archive-requirement.sh" "$test_repo/.claude/scripts/archive-requirement.sh"
    chmod +x "$test_repo/.claude/scripts/archive-requirement.sh"

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
  "status": "released",
  "updatedAt": "2026-03-26T01:00:00Z"
}
EOF

    cat > "$test_repo/devflow/requirements/REQ-123/report-card.json" <<'EOF'
{
  "changeId": "REQ-123",
  "overall": "pass",
  "timestamp": "2026-03-26T01:05:00Z"
}
EOF

    cat > "$test_repo/devflow/requirements/REQ-123/orchestration_status.json" <<'EOF'
{
  "reqId": "REQ-123",
  "title": "Legacy checkout title",
  "status": "released",
  "updatedAt": "2026-03-26T09:00:00+08:00"
}
EOF

    cat > "$test_repo/devflow/intent/REQ-123/resume-index.md" <<'EOF'
# Resume Index: REQ-123

- Stage: released
- Goal: Ship checkout
- Lifecycle: released
- Updated At: 2026-03-26T01:00:00Z

## Last Good Checkpoint

- Release done

## Blockers

- None

## Next Action

Archive when ready.
EOF

    cat > "$test_repo/devflow/requirements/REQ-124/harness-state.json" <<'EOF'
{
  "changeId": "REQ-124",
  "goal": "Hold before release",
  "status": "verified",
  "updatedAt": "2026-03-26T02:00:00Z"
}
EOF

    echo "$test_repo"
}

run_archive_script() {
    local test_repo="$1"
    shift

    (
        cd "$test_repo"
        bash ".claude/scripts/archive-requirement.sh" "$@"
    )
}

test_archive_completed_requires_released() {
    describe "completed archive should require released lifecycle"

    local test_repo
    test_repo=$(setup_archive_fixture)

    local exit_code=0
    local output
    output=$(run_archive_script "$test_repo" REQ-124 --reason completed 2>&1) || exit_code=$?

    assert_equals "$exit_code" "1" "Should reject completed archive before released"
    assert_contains "$output" "completed 归档要求当前生命周期为 released" "Should explain released requirement"
}

test_archive_writes_archive_metadata_from_harness_truth() {
    describe "archive should write compatibility metadata using harness truth"

    local test_repo
    test_repo=$(setup_archive_fixture)

    run_archive_script "$test_repo" REQ-123 --reason completed >/dev/null

    local archived_dir="$test_repo/devflow/archive/$(TZ='Asia/Shanghai' date '+%Y-%m')/REQ-123"
    assert_dir_exists "$archived_dir" "Archived requirement should be moved into month bucket"

    local archived_json
    archived_json=$(cat "$archived_dir/orchestration_status.json")

    assert_json_field "$archived_json" "status" "archived" "Archive status should be archived"
    assert_json_field "$archived_json" "archivedReason" "completed" "Archive reason should be recorded"
    assert_json_field "$archived_json" "statusBeforeArchive" "released" "Previous status should come from harness lifecycle"
    assert_json_field "$archived_json" "title" "Ship checkout" "Title should prefer harness goal"
}

test_list_prefers_harness_title_and_previous_status() {
    describe "list json should expose harness title and previous status"

    local test_repo
    test_repo=$(setup_archive_fixture)

    run_archive_script "$test_repo" REQ-123 --reason completed >/dev/null

    local output
    output=$(run_archive_script "$test_repo" --list --json)

    assert_json_valid "$output" "List output should be valid json"
    assert_json_field "$output" "[0].title" "Ship checkout" "List should prefer harness goal"
    assert_json_field "$output" "[0].previousStatus" "released" "List should expose pre-archive lifecycle"
}

test_restore_clears_archive_only_fields_and_rebuilds_resume_index() {
    describe "restore should clear archive-only compatibility fields and rebuild resume index"

    local test_repo
    test_repo=$(setup_archive_fixture)

    run_archive_script "$test_repo" REQ-123 --reason completed >/dev/null
    run_archive_script "$test_repo" REQ-123 --restore >/dev/null

    local restored_json
    restored_json=$(cat "$test_repo/devflow/requirements/REQ-123/orchestration_status.json")

    assert_json_field "$restored_json" "status" "released" "Restore should return compatibility status to released"
    assert_json_field "$restored_json" "title" "Ship checkout" "Restore should keep canonical title"
    assert_json_field "$restored_json" "deltaCount" "null" "Restore should remove archive-only deltaCount"

    local resume_file="$test_repo/devflow/intent/REQ-123/resume-index.md"
    assert_file_exists "$resume_file" "Restore should regenerate resume index"

    local resume_content
    resume_content=$(cat "$resume_file")
    assert_contains "$resume_content" "## Next Action" "Resume index should include next action section"
    assert_contains "$resume_content" "/flow:prepare-pr \"REQ-123\"" "Released+pass restore should point to prepare-pr follow-up"
}

run_tests \
    test_archive_completed_requires_released \
    test_archive_writes_archive_metadata_from_harness_truth \
    test_list_prefers_harness_title_and_previous_status \
    test_restore_clears_archive_only_fields_and_rebuilds_resume_index
