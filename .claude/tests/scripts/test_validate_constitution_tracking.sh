#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"
source "$REPO_ROOT/.claude/scripts/common.sh"

test_pending_allows_non_strict() {
    local change_suffix="$(date '+%Y%m%d%H%M%S%N')"
    local change_id="req-${change_suffix}-unit"
    local change_dir="$REPO_ROOT/devflow/changes/$change_id"
    local constitution_file="$change_dir/constitution.json"

    register_cleanup "$change_dir"
    mkdir -p "$change_dir"

    cat > "$constitution_file" <<'EOF'
{
  "changeId": "dummy",
  "articles": [
    {"article": "VII", "status": "approved", "notes": ""},
    {"article": "VIII", "status": "pending", "notes": "awaiting review"}
  ]
}
EOF

    local output
    output=$("$REPO_ROOT/.claude/scripts/validate-constitution-tracking.sh" "$change_id")
    assert_contains "pending articles" "$output" "non-strict should warn about pending" || return 1

    if "$REPO_ROOT/.claude/scripts/validate-constitution-tracking.sh" "$change_id" --strict >/dev/null 2>&1; then
        echo "  strict validation unexpectedly succeeded"
        return 1
    fi

    return 0
}

run_test "validate-constitution-tracking strict gate" test_pending_allows_non_strict

test_invalid_schema_rejected() {
    local change_suffix="$(date '+%Y%m%d%H%M%S%N')"
    local change_id="req-${change_suffix}-invalid"
    local change_dir="$REPO_ROOT/devflow/changes/$change_id"
    local constitution_file="$change_dir/constitution.json"

    register_cleanup "$change_dir"
    mkdir -p "$change_dir"

    cat > "$constitution_file" <<'EOF'
{
  "changeId": "dummy",
  "articles": [
    {"status": "approved", "notes": "ok"},
    {"article": "VIII", "status": "approved", "notes": 123}
  ]
}
EOF

    if "$REPO_ROOT/.claude/scripts/validate-constitution-tracking.sh" "$change_id" >/tmp/constitution.err 2>&1; then
        echo "  schema validation unexpectedly succeeded"
        return 1
    fi

    if ! grep -q "missing or invalid article" /tmp/constitution.err && ! grep -q "notes must be strings" /tmp/constitution.err; then
        echo "  expected schema error not reported"
        cat /tmp/constitution.err
        return 1
    fi

    rm -f /tmp/constitution.err
    return 0
}

run_test "validate-constitution-tracking schema errors" test_invalid_schema_rejected

finish_tests
