#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"
source "$REPO_ROOT/.claude/scripts/common.sh"

FIXTURE_DIR="$REPO_ROOT/.claude/tests/fixtures"

# ===== Delta 解析应输出完整结构 =====
test_parse_delta_outputs_expected_fields() {
    local suffix change_id change_dir cap delta_json spec_dir
    suffix=$(date '+%Y%m%d%H%M%S%N')
    change_id="req-${suffix}-delta"
    change_dir="$REPO_ROOT/devflow/changes/$change_id"
    cap="cap-${suffix}"
    delta_json="$change_dir/delta.json"
    spec_dir="$change_dir/specs/$cap"
    register_cleanup "$change_dir"
    mkdir -p "$spec_dir"
    cp "$FIXTURE_DIR/spec_delta_full.md" "$spec_dir/spec.md"
    bash "$REPO_ROOT/.claude/scripts/parse-delta.sh" "$change_id" >/dev/null
    assert_file_exists "$delta_json" "delta.json 缺失" || return 1
    assert_json_valid "$delta_json" "delta.json 非法" || return 1
    assert_equals "Login Flow" "$(jq -r '.requirements.added[0].name' "$delta_json")" "新增需求未解析" || return 1
    assert_equals "Stable Feature" "$(jq -r '.requirements.renamed[0].to' "$delta_json")" "重命名未解析" || return 1
    assert_equals "1" "$(jq '.capabilities | length' "$delta_json")" "能力列表解析错误" || return 1
    return 0
}

run_test "parse-delta 解析能力结构" test_parse_delta_outputs_expected_fields

finish_tests
