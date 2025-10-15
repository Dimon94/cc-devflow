#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"
source "$REPO_ROOT/.claude/scripts/common.sh"

test_ensure_change_delta_scaffolds_specs() {
    local suffix change_id change_dir delta_json spec_auth spec_billing
    suffix=$(date '+%Y%m%d%H%M%S%N')
    change_id="req-${suffix}-delta"
    change_dir="$REPO_ROOT/devflow/changes/$change_id"
    delta_json="$change_dir/delta.json"
    spec_auth="$change_dir/specs/auth/spec.md"
    spec_billing="$change_dir/specs/billing/spec.md"

    register_cleanup "$change_dir"

    mkdir -p "$change_dir/specs"
    cat >"$delta_json" <<EOF
{
  "changeId": "$change_id",
  "relatedRequirements": [],
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

    "$REPO_ROOT/.claude/scripts/ensure-change-delta.sh" "$change_id" --cap auth --cap billing >/dev/null

    assert_file_exists "$spec_auth" "auth spec scaffold missing" || return 1
    assert_file_exists "$spec_billing" "billing spec scaffold missing" || return 1

    assert_grep_match "Capability Delta: auth" "$spec_auth" "auth spec missing header" || return 1
    assert_grep_match "Capability Delta: billing" "$spec_billing" "billing spec missing header" || return 1

    if [[ "$(jq -c '.capabilities | sort' "$delta_json")" != '["auth","billing"]' ]]; then
        echo "  $( _color_red "ASSERT FAIL" ): delta.json capabilities not updated"
        return 1
    fi

    return 0
}

run_test "ensure-change-delta scaffolds capabilities" test_ensure_change_delta_scaffolds_specs

finish_tests
