#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

FIXTURE_DIR="$REPO_ROOT/.claude/tests/fixtures"

# ===== 任务进度应同步至 JSON =====
test_sync_task_progress_updates_delta() {
    local suffix change change_dir tasks_md delta_json progress_json
    suffix=$(date '+%Y%m%d%H%M%S%N')
    change="req-${suffix}-tasks"
    change_dir="$REPO_ROOT/devflow/changes/$change"
    tasks_md="$change_dir/tasks.md"
    delta_json="$change_dir/delta.json"
    progress_json="$change_dir/task-progress.json"
    register_cleanup "$change_dir"
    mkdir -p "$change_dir"
    cp "$FIXTURE_DIR/tasks_progress_sample.md" "$tasks_md"
    cat > "$delta_json" <<EOF
{"changeId":"$change","relatedRequirements":["REQ-$suffix"],"requirements":{"added":[],"modified":[],"removed":[],"renamed":[]},"capabilities":[],"updatedAt":"2025-01-01T00:00:00Z","tasks":{},"links":[]}
EOF
    bash "$REPO_ROOT/.claude/scripts/sync-task-progress.sh" "$change" >/dev/null
    assert_file_exists "$progress_json" "缺少 task-progress.json" || return 1
    assert_equals "3" "$(jq '.total' "$progress_json")" "任务总数错误" || return 1
    assert_equals "2" "$(jq '.completed' "$progress_json")" "完成数错误" || return 1
    assert_equals "2" "$(jq '.tasks.completed' "$delta_json")" "delta 未更新完成数" || return 1
    return 0
}

run_test "sync-task-progress 同步统计" test_sync_task_progress_updates_delta

finish_tests
