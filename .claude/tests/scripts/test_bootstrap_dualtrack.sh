#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

# ===== 引导脚本应创建双轨脚手架 =====
test_bootstrap_scaffolds_dualtrack() {
    local suffix req change change_dir agents_file project_file
    suffix=$(date '+%Y%m%d%H%M%S%N')
    req="REQ-${suffix}"
    change="req-${suffix}-boot"
    change_dir="$REPO_ROOT/devflow/changes/$change"
    agents_file="$REPO_ROOT/devflow/AGENTS.md"
    project_file="$REPO_ROOT/devflow/project.md"
    [[ ! -f "$agents_file" ]] && register_cleanup "$agents_file"
    [[ ! -f "$project_file" ]] && register_cleanup "$project_file"
    register_cleanup "$change_dir"
    bash "$REPO_ROOT/.claude/scripts/bootstrap-devflow-dualtrack.sh" --req-id "$req" --title "Bootstrap Check" --change-id "$change" >/dev/null
    assert_file_exists "$change_dir/proposal.md" "缺少 proposal" || return 1
    assert_file_exists "$change_dir/constitution.json" "缺少 constitution" || return 1
    assert_equals "pending" "$(jq -r '.articles[0].status' "$change_dir/constitution.json")" "宪章初始状态错误" || return 1
    assert_equals "$change" "$(jq -r '.changeId' "$change_dir/delta.json")" "delta 标识错误" || return 1
    return 0
}

run_test "bootstrap 构建脚手架" test_bootstrap_scaffolds_dualtrack

finish_tests
