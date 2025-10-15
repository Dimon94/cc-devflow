#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

write_delta_fixture() {
    local dir="$1"
    local change="$2"
    local stamp="$3"
    printf '{"changeId":"%s","relatedRequirements":["REQ-%s"],"requirements":{"added":[{"capability":"auth","name":"Session Guard"}],"modified":[],"removed":[],"renamed":[]},"capabilities":["auth"],"updatedAt":"2025-01-01T00:00:%sZ","tasks":{},"links":[]}' \
        "$change" "$stamp" "$stamp" >"$dir/delta.json"
}

# ===== 冲突检测应捕获重复新增 =====
test_conflict_detector_flags_duplicate_add() {
    local suffix change_a change_b dir_a dir_b tmp_out
    suffix=$(date '+%Y%m%d%H%M%S%N')
    change_a="req-${suffix}-alpha"
    change_b="req-${suffix}-beta"
    dir_a="$REPO_ROOT/devflow/changes/$change_a"
    dir_b="$REPO_ROOT/devflow/changes/$change_b"
    tmp_out="$(mktemp)"
    register_cleanup "$dir_a"; register_cleanup "$dir_b"; register_cleanup "$tmp_out"
    mkdir -p "$dir_a" "$dir_b"
    local tail=$((10#${suffix: -2}))
    write_delta_fixture "$dir_a" "$change_a" "$(printf '%02d' "$tail")"
    write_delta_fixture "$dir_b" "$change_b" "$(printf '%02d' $(((tail + 1) % 60)))"
    if bash "$REPO_ROOT/.claude/scripts/check-dualtrack-conflicts.sh" --strict >"$tmp_out" 2>&1; then
        echo "  冲突检测未触发失败"
        return 1
    fi
    assert_grep_match "ADDED_DUPLICATE" "$tmp_out" "缺少重复新增告警" || return 1
    return 0
}

run_test "冲突检测发现重复新增" test_conflict_detector_flags_duplicate_add

finish_tests
