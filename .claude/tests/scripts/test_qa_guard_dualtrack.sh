#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"

test_qa_guard_passes_with_valid_delta() {
    local suffix change_id change_dir delta_json spec_dir tasks_md constitution_json progress_json
    suffix=$(date '+%Y%m%d%H%M%S%N')
    change_id="req-${suffix}-qa"
    change_dir="$REPO_ROOT/devflow/changes/$change_id"
    delta_json="$change_dir/delta.json"
    spec_dir="$change_dir/specs/auth"
    tasks_md="$change_dir/tasks.md"
    constitution_json="$change_dir/constitution.json"
    progress_json="$change_dir/task-progress.json"

    register_cleanup "$change_dir"

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
  "capabilities": ["auth"],
  "updatedAt": "2025-01-01T00:00:00Z",
  "tasks": {},
  "links": []
}
EOF

    cat >"$spec_dir/spec.md" <<'EOF'
# Capability Delta: auth

## ADDED Requirements

### Requirement: Session Enforcement
- **WHEN** a user authenticates
- **THEN** issue a signed session token
- **AND** expire the token after 30 minutes of inactivity

## MODIFIED Requirements

## REMOVED Requirements

## RENAMED Requirements
EOF

    cat >"$tasks_md" <<'EOF'
# Tasks
- [x] **T001** [CTX] Draft authentication scenarios (auth/session)
- [x] **T002** [DEV] Implement session timeout enforcement (src/auth/session.go)
EOF

    cat >"$constitution_json" <<EOF
{
  "changeId": "$change_id",
  "updatedAt": "2025-01-01T00:00:00Z",
  "articles": [
    {"article": "VII", "status": "approved", "notes": "≤3 projects"},
    {"article": "VIII", "status": "approved", "notes": "Framework usage documented"},
    {"article": "IX", "status": "approved", "notes": "Contract tests defined"},
    {"article": "X", "status": "approved", "notes": "No speculation"}
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

    if ! "$REPO_ROOT/.claude/scripts/qa-guard-dualtrack.sh" "$change_id" >/dev/null; then
        echo "  $( _color_red "ASSERT FAIL" ): qa guard failed unexpectedly"
        return 1
    fi

    return 0
}

run_test "qa-guard-dualtrack validates change" test_qa_guard_passes_with_valid_delta

finish_tests
