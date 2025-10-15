#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

# ===== 迁移脚本应衔接双轨工作流 =====
test_migrate_existing_requirement_creates_change() {
    local suffix req_id req_dir status_file agents_file project_file
    suffix=$(date '+%Y%m%d%H%M%S%N')
    req_id="REQ-${suffix}"
    req_dir="$REPO_ROOT/devflow/requirements/$req_id"
    status_file="$req_dir/orchestration_status.json"
    agents_file="$REPO_ROOT/devflow/AGENTS.md"
    project_file="$REPO_ROOT/devflow/project.md"
    [[ ! -f "$agents_file" ]] && register_cleanup "$agents_file"; [[ ! -f "$project_file" ]] && register_cleanup "$project_file"
    register_cleanup "$req_dir"
    mkdir -p "$req_dir"
    printf '{"title":"Migration Sample"}\n' > "$status_file"
    bash "$REPO_ROOT/.claude/scripts/migrate-existing-requirement.sh" "$req_id" >/dev/null
    local change_id="$(jq -r '.change_id' "$status_file")"
    local change_dir="$REPO_ROOT/devflow/changes/$change_id"
    register_cleanup "$change_dir"
    assert_grep_match '^req-' <(printf '%s' "$change_id") "change_id 生成失败" || return 1
    assert_file_exists "$change_dir/proposal.md" "缺少脚手架 proposal" || return 1
    return 0
}

run_test "migrate-existing-requirement 生成变更" test_migrate_existing_requirement_creates_change

finish_tests
