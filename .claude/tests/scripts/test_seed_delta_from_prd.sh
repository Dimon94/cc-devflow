#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

test_seed_delta_from_prd_generates_specs() {
    local suffix req_id change_id req_dir change_dir prd_file delta_json status_file
    suffix=$(date '+%Y%m%d%H%M%S%N')
    req_id="REQ-${suffix}"
    change_id="req-${suffix}-seed"
    req_dir="$REPO_ROOT/devflow/requirements/$req_id"
    change_dir="$REPO_ROOT/devflow/changes/$change_id"
    prd_file="$req_dir/PRD.md"
    delta_json="$change_dir/delta.json"
    status_file="$req_dir/orchestration_status.json"

    register_cleanup "$req_dir"
    register_cleanup "$change_dir"
    register_cleanup "$REPO_ROOT/devflow/specs/auth"
    register_cleanup "$REPO_ROOT/devflow/specs/billing"
    register_cleanup "$REPO_ROOT/devflow/specs/reports"

    mkdir -p "$req_dir" "$change_dir/specs"

    cat >"$status_file" <<EOF
{
  "reqId": "$req_id",
  "title": "Seed Delta Test",
  "change_id": "$change_id",
  "status": "prd_complete",
  "phase": "epic_planning"
}
EOF

    cat >"$prd_file" <<'EOF'
# PRD Stub

## Delta Mapping (规范变更草案)

| Capability | Operation | Requirement | Summary |
| ---------- | --------- | ----------- | ------- |
| Auth | ADDED | Session Audit Trail | 记录会话发放日志 |
| Auth | MODIFIED | Session Enforcement | 更新过期策略 |
| Billing | REMOVED | Legacy Discount Flow | 合并至新计费流程 |
| Reports | RENAMED | Legacy Report -> Compliance Report | 对齐合规命名 |

EOF

    cat >"$delta_json" <<EOF
{
  "changeId": "$change_id",
  "relatedRequirements": ["$req_id"],
  "requirements": {
    "added": [],
    "modified": [],
    "removed": [],
    "renamed": []
  },
  "capabilities": [],
  "updatedAt": "2025-01-01T00:00:00Z",
  "tasks": {},
  "links": []
}
EOF

    if ! "$REPO_ROOT/.claude/scripts/seed-delta-from-prd.sh" "$req_id" >/dev/null; then
        echo "  $( _color_red \"ASSERT FAIL\" ): seed-delta-from-prd.sh failed"
        return 1
    fi

    local spec_auth="$change_dir/specs/auth/spec.md"
    local spec_billing="$change_dir/specs/billing/spec.md"
    local spec_reports="$change_dir/specs/reports/spec.md"

    assert_file_exists "$spec_auth" "auth spec missing" || return 1
    assert_file_exists "$spec_billing" "billing spec missing" || return 1
    assert_file_exists "$spec_reports" "reports spec missing" || return 1

    assert_grep_match "### Requirement: Session Audit Trail" "$spec_auth" "added requirement missing" || return 1
    assert_grep_match "### Requirement: Session Enforcement" "$spec_auth" "modified requirement missing" || return 1
    assert_grep_match "\\- Legacy Discount Flow" "$spec_billing" "removed requirement missing" || return 1
    assert_grep_match "\\- FROM: Legacy Report" "$spec_reports" "rename FROM missing" || return 1
    assert_grep_match "  TO: Compliance Report" "$spec_reports" "rename TO missing" || return 1

    local capabilities serialized
    capabilities=$(jq -r '.capabilities | sort | join(",")' "$delta_json")
    if [[ "$capabilities" != "auth,billing,reports" ]]; then
        echo "  $( _color_red \"ASSERT FAIL\" ): capabilities not updated"
        return 1
    fi

    if [[ "$(jq -r '.requirements.added[0].name' "$delta_json")" != "Session Audit Trail" ]]; then
        echo "  $( _color_red \"ASSERT FAIL\" ): added requirement not captured"
        return 1
    fi

    if [[ "$(jq -r '.requirements.modified[0].name' "$delta_json")" != "Session Enforcement" ]]; then
        echo "  $( _color_red \"ASSERT FAIL\" ): modified requirement not captured"
        return 1
    fi

    if [[ "$(jq -r '.requirements.removed[0].name' "$delta_json")" != "Legacy Discount Flow" ]]; then
        echo "  $( _color_red \"ASSERT FAIL\" ): removed requirement not captured"
        return 1
    fi

    local renamed_from renamed_to
    renamed_from=$(jq -r '.requirements.renamed[0].from' "$delta_json")
    renamed_to=$(jq -r '.requirements.renamed[0].to' "$delta_json")
    if [[ "$renamed_from" != "Legacy Report" || "$renamed_to" != "Compliance Report" ]]; then
        echo "  $( _color_red \"ASSERT FAIL\" ): renamed requirement not captured"
        return 1
    fi

    return 0
}

run_test "seed-delta-from-prd generates specs" test_seed_delta_from_prd_generates_specs

finish_tests
