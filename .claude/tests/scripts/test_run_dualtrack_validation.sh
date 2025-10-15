#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

# ===== 校验脚本应提示缺失进度文件 =====
test_validation_warns_without_progress() {
    local suffix change change_dir delta_json tasks_md constitution_json tmp_out
    suffix=$(date '+%Y%m%d%H%M%S%N')
    change="req-${suffix}-validate"
    change_dir="$REPO_ROOT/devflow/changes/$change"
    delta_json="$change_dir/delta.json"; tasks_md="$change_dir/tasks.md"; constitution_json="$change_dir/constitution.json"
    tmp_out="$(mktemp)"
    register_cleanup "$change_dir"; register_cleanup "$tmp_out"
    mkdir -p "$change_dir"
    printf '{"changeId":"%s","relatedRequirements":["REQ-%s"],"requirements":{"added":[{"capability":"auth","name":"Session Guard"}],"modified":[],"removed":[],"renamed":[]},"capabilities":["auth"],"updatedAt":"2025-01-01T00:00:00Z","tasks":{},"links":[]}\n' \
        "$change" "$suffix" > "$delta_json"
    printf '* [ ] Draft delta\n* [x] Review constitution\n' > "$tasks_md"
    printf '{"articles":[{"article":"VII","status":"approved","notes":""},{"article":"VIII","status":"pending","notes":""}]}\n' > "$constitution_json"
    if ! bash "$REPO_ROOT/.claude/scripts/run-dualtrack-validation.sh" "$change" >"$tmp_out" 2>&1; then
        echo "  校验脚本意外失败"
        return 1
    fi
    assert_grep_match 'task-progress.json not found' "$tmp_out" "未提示缺失进度" || return 1
    return 0
}

run_test "run-dualtrack-validation 输出缺失进度警告" test_validation_warns_without_progress

finish_tests
