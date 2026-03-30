#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 .claude/tests/test-framework.sh 与 sync-roadmap-progress.sh/common.sh 副本，在临时仓库中构造 ROADMAP 与 compatibility 状态夹具。
# [OUTPUT]: 回归验证 sync-roadmap-progress.sh 会按主链阶段更新 ROADMAP 表格，并保持列结构不被写坏。
# [POS]: .claude/tests/scripts 的路线图同步测试，用于守住 roadmap 视图跟随 harness-first 主链。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SCRIPT_SOURCE_DIR="$REPO_ROOT/.claude/scripts"

setup_roadmap_fixture() {
    local test_repo
    test_repo=$(mktemp -d "${TEST_TMP_DIR}/roadmap-repo.XXXXXX")
    mkdir -p "$test_repo/.claude/scripts" "$test_repo/devflow/requirements/REQ-123" "$test_repo/devflow/intent/REQ-123"

    cp "$SCRIPT_SOURCE_DIR/common.sh" "$test_repo/.claude/scripts/common.sh"
    cp "$SCRIPT_SOURCE_DIR/sync-roadmap-progress.sh" "$test_repo/.claude/scripts/sync-roadmap-progress.sh"
    chmod +x "$test_repo/.claude/scripts/sync-roadmap-progress.sh"

    (
        cd "$test_repo"
        git init -q
    )

    cat > "$test_repo/devflow/ROADMAP.md" <<'EOF'
# Roadmap

| Priority | Milestone | Description | Owner | Status | Requirement | Progress | Notes |
|----------|-----------|-------------|-------|--------|-------------|----------|-------|
| P1 | RM-001 | Demo | team | Planned | REQ-123 | 0% | - |
EOF

    cat > "$test_repo/devflow/requirements/REQ-123/orchestration_status.json" <<'EOF'
{
  "reqId": "REQ-123",
  "title": "Ship checkout",
  "status": "verified",
  "phase": "prepare-pr",
  "updatedAt": "2026-03-26T09:30:00+08:00"
}
EOF

    echo "$test_repo"
}

run_sync_roadmap() {
    local test_repo="$1"
    (
        cd "$test_repo"
        bash ".claude/scripts/sync-roadmap-progress.sh"
    )
}

test_prepare_pr_updates_tracking_row_without_shifting_columns() {
    describe "prepare-pr compatibility state should update roadmap row without corrupting columns"

    local test_repo
    test_repo=$(setup_roadmap_fixture)

    run_sync_roadmap "$test_repo" >/dev/null 2>&1

    local roadmap_content
    roadmap_content=$(cat "$test_repo/devflow/ROADMAP.md")

    assert_contains "$roadmap_content" "| P1 | RM-001 | Demo | team | In Progress | REQ-123 | 95% | - |" \
        "Roadmap row should keep owner/notes columns while updating status and progress"
}

run_tests \
    test_prepare_pr_updates_tracking_row_without_shifting_columns
