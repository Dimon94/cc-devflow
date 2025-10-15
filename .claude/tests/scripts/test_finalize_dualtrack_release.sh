#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

test_finalize_release_archives_and_updates_specs() {
    local suffix change_id change_dir delta_json cap slug_cap spec_dir tasks_md constitution_json progress_json archive_dir target_spec changelog
    suffix=$(date '+%Y%m%d%H%M%S%N')
    change_id="req-${suffix}-release"
    slug_cap="release-auth"
    change_dir="$REPO_ROOT/devflow/changes/$change_id"
    delta_json="$change_dir/delta.json"
    spec_dir="$change_dir/specs/$slug_cap"
    tasks_md="$change_dir/tasks.md"
    constitution_json="$change_dir/constitution.json"
    progress_json="$change_dir/task-progress.json"
    archive_dir="$REPO_ROOT/devflow/changes/archive/$change_id"
    target_spec="$REPO_ROOT/devflow/specs/$slug_cap/spec.md"
    changelog="$REPO_ROOT/devflow/specs/$slug_cap/CHANGELOG.md"

    register_cleanup "$change_dir"
    register_cleanup "$archive_dir"
    register_cleanup "$REPO_ROOT/devflow/specs/$slug_cap"

    mkdir -p "$spec_dir"
    cat >"$delta_json" <<EOF
{
  "changeId": "$change_id",
  "relatedRequirements": ["REQ-${suffix}"],
  "requirements": {
    "added": [],
    "modified": [],
    "removed": [],
    "renamed": []
  },
  "capabilities": ["$slug_cap"],
  "updatedAt": "2025-01-01T00:00:00Z",
  "tasks": {},
  "links": []
}
EOF

    cat >"$spec_dir/spec.md" <<'EOF'
# Capability Delta: release-auth

## ADDED Requirements

### Requirement: Session Audit Trail
- **WHEN** a session token is issued
- **THEN** persist an audit record with user id and expiration timestamp
- **AND** expose the record to compliance reporting

## MODIFIED Requirements

## REMOVED Requirements

## RENAMED Requirements
EOF

    cat >"$tasks_md" <<'EOF'
# Tasks
- [x] **T100** [TEST] Add audit log contract tests (tests/auth/audit_contract.test.ts)
- [x] **T110** [IMPL] Implement audit trail persistence (src/auth/audit.ts)
EOF

    cat >"$constitution_json" <<EOF
{
  "changeId": "$change_id",
  "updatedAt": "2025-01-01T00:00:00Z",
  "articles": [
    {"article": "VII", "status": "approved", "notes": ""},
    {"article": "VIII", "status": "approved", "notes": ""},
    {"article": "IX", "status": "approved", "notes": ""},
    {"article": "X", "status": "approved", "notes": ""}
  ]
}
EOF

    cat >"$progress_json" <<EOF
{
  "changeId": "$change_id",
  "generatedAt": "2025-01-01T00:00:00Z",
  "total": 2,
  "completed": 2
}
EOF

    if ! "$REPO_ROOT/.claude/scripts/finalize-dualtrack-release.sh" "$change_id" >/dev/null; then
        echo "  $( _color_red "ASSERT FAIL" ): finalize dualtrack release failed"
        return 1
    fi

    if [[ -d "$change_dir" ]]; then
        echo "  $( _color_red "ASSERT FAIL" ): change directory still active after archive"
        return 1
    fi

    assert_file_exists "$archive_dir/summary.md" "archive summary missing" || return 1
    assert_file_exists "$target_spec" "target spec not created" || return 1
    assert_file_exists "$changelog" "capability changelog missing" || return 1

    assert_grep_match "Session Audit Trail" "$target_spec" "spec content not merged" || return 1
    assert_grep_match "$change_id" "$changelog" "change id not recorded in changelog" || return 1

    return 0
}

run_test "finalize-dualtrack-release archives change" test_finalize_release_archives_and_updates_specs

finish_tests
