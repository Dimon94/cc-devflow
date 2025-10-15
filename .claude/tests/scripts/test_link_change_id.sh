#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

# ===== 链接脚本应更新编排状态 =====
test_link_changes_updates_status_file() {
    local suffix req_id change req_dir status_file
    suffix=$(date '+%Y%m%d%H%M%S%N')
    req_id="REQ-${suffix}"
    change="req-${suffix}-link"
    req_dir="$REPO_ROOT/devflow/requirements/$req_id"
    status_file="$req_dir/orchestration_status.json"
    register_cleanup "$req_dir"
    mkdir -p "$req_dir"
    printf '{}' > "$status_file"
    bash "$REPO_ROOT/.claude/scripts/link-change-id.sh" --req-id "$req_id" --change-id "$change" >/dev/null
    assert_equals "$change" "$(jq -r '.change_id' "$status_file")" "未写入 change_id" || return 1
    assert_grep_match '"updatedAt"' "$status_file" "缺少更新时间" || return 1
    return 0
}

run_test "link-change-id 更新状态文件" test_link_changes_updates_status_file

finish_tests
