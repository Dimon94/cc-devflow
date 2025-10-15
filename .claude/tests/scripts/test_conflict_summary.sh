#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

test_conflict_summary_output() {
    local cap="cap-summary"
    local change_a="req-summary-a"
    local change_b="req-summary-b"
    local dir_a="$REPO_ROOT/devflow/changes/$change_a"
    local dir_b="$REPO_ROOT/devflow/changes/$change_b"

    register_cleanup "$dir_a"
    register_cleanup "$dir_b"

    mkdir -p "$dir_a/specs/$cap" "$dir_b/specs/$cap"

    cat > "$dir_a/delta.json" <<EOF
{
  "changeId": "$change_a",
  "capabilities": ["$cap"],
  "requirements": {
    "added": [
      {"capability": "$cap", "name": "Overlap Requirement"}
    ],
    "modified": [],
    "removed": [],
    "renamed": []
  }
}
EOF

    cat > "$dir_b/delta.json" <<EOF
{
  "changeId": "$change_b",
  "capabilities": ["$cap"],
  "requirements": {
    "added": [
      {"capability": "$cap", "name": "Overlap Requirement"}
    ],
    "modified": [],
    "removed": [],
    "renamed": []
  }
}
EOF

    local output
    output=$(bash "$REPO_ROOT/.claude/scripts/check-dualtrack-conflicts.sh" --summary 2>/dev/null)

    assert_contains "Total conflicts" "$output" "summary should include total" || return 1
    assert_contains "$cap" "$output" "summary should include capability name" || return 1
    assert_contains "$change_a" "$output" "summary should include change a" || return 1
    assert_contains "$change_b" "$output" "summary should include change b" || return 1

    return 0
}

run_test "conflict summary aggregates entries" test_conflict_summary_output

finish_tests
