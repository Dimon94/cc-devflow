#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"
source "$REPO_ROOT/.claude/scripts/common.sh"

generate_unique_id() {
    date '+%Y%m%d%H%M%S%N'
}

test_metrics_increments_with_new_requirement() {
    local baseline_json new_json
    local req_suffix change_id capability
    local req_dir change_dir status_file delta_file spec_dir

    baseline_json=$(bash "$REPO_ROOT/.claude/scripts/generate-dualtrack-metrics.sh" --json)
    local req_total_before
    local req_dual_before
    local change_total_before
    local change_complete_before

    req_total_before=$(echo "$baseline_json" | jq '.requirements.total')
    req_dual_before=$(echo "$baseline_json" | jq '.requirements.dualtrack')
    change_total_before=$(echo "$baseline_json" | jq '.changes.total')
    change_complete_before=$(echo "$baseline_json" | jq '.changes.complete')

    req_suffix=$(generate_unique_id)
    local req_id="REQ-TEST-$req_suffix"
    change_id="req-test-${req_suffix}-change"
    capability="testcap-${req_suffix}"

    req_dir="$REPO_ROOT/devflow/requirements/$req_id"
    change_dir="$REPO_ROOT/devflow/changes/$change_id"
    status_file="$req_dir/orchestration_status.json"
    delta_file="$change_dir/delta.json"
    spec_dir="$change_dir/specs/$capability"

    register_cleanup "$req_dir"
    register_cleanup "$change_dir"

    mkdir -p "$req_dir" "$spec_dir"

    cat > "$status_file" <<EOF
{
  "reqId": "$req_id",
  "title": "Test Requirement $req_suffix",
  "status": "initialized",
  "phase": "planning",
  "change_id": "$change_id",
  "createdAt": "$(get_beijing_time_iso)",
  "updatedAt": "$(get_beijing_time_iso)"
}
EOF

    cat > "$delta_file" <<EOF
{
  "changeId": "$change_id",
  "relatedRequirements": ["$req_id"],
  "capabilities": ["$capability"],
  "requirements": {
    "added": [
      { "capability": "$capability", "name": "Sample Requirement" }
    ],
    "modified": [],
    "removed": [],
    "renamed": []
  }
}
EOF

    mkdir -p "$spec_dir"
    cat > "$spec_dir/spec.md" <<'EOF'
## ADDED Requirements

### Requirement: Sample Requirement
- placeholder
EOF

    new_json=$(bash "$REPO_ROOT/.claude/scripts/generate-dualtrack-metrics.sh" --json)

    local req_total_after req_dual_after change_total_after change_complete_after
    req_total_after=$(echo "$new_json" | jq '.requirements.total')
    req_dual_after=$(echo "$new_json" | jq '.requirements.dualtrack')
    change_total_after=$(echo "$new_json" | jq '.changes.total')
    change_complete_after=$(echo "$new_json" | jq '.changes.complete')

    assert_equals $((req_total_before + 1)) "$req_total_after" "requirements.total should increment by 1" || return 1
    assert_equals $((req_dual_before + 1)) "$req_dual_after" "requirements.dualtrack should increment by 1" || return 1
    assert_equals $((change_total_before + 1)) "$change_total_after" "changes.total should increment by 1" || return 1
    assert_equals $((change_complete_before + 1)) "$change_complete_after" "changes.complete should increment by 1" || return 1

    return 0
}

run_test "generate-dualtrack-metrics increments counts" test_metrics_increments_with_new_requirement

finish_tests
