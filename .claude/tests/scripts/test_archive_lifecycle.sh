#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

source "$SCRIPT_DIR/test-framework.sh"
source "$REPO_ROOT/.claude/scripts/common.sh"

test_archive_moves_directory_and_supports_summary() {
    local suffix
    suffix=$(date '+%Y%m%d%H%M%S%N')
    local change_id="req-${suffix}-archive"
    local cap="cap-${suffix}"
    local req_id="REQ-${suffix}"
    local change_dir="$REPO_ROOT/devflow/changes/$change_id"
    local archive_dir="$REPO_ROOT/devflow/changes/archive/$change_id"
    local spec_change_dir="$change_dir/specs/$cap"
    local spec_target_dir="$REPO_ROOT/devflow/specs/$cap"
    local delta_json="$change_dir/delta.json"
    local target_spec="$spec_target_dir/spec.md"
    local summary_file="$archive_dir/summary.md"
    local changelog_file="$spec_target_dir/CHANGELOG.md"

    register_cleanup "$archive_dir"
    register_cleanup "$change_dir"
    register_cleanup "$spec_target_dir"

    mkdir -p "$spec_change_dir"

    cat > "$delta_json" <<EOF
{
  "changeId": "$change_id",
  "relatedRequirements": ["$req_id"],
  "capabilities": ["$cap"],
  "requirements": {
    "added": [
      {"capability": "$cap", "name": "New Requirement"}
    ],
    "modified": [],
    "removed": [],
    "renamed": []
  }
}
EOF

    cat > "$spec_change_dir/spec.md" <<'EOF'
## ADDED Requirements

### Requirement: New Requirement
- new behavior
EOF

    mkdir -p "$spec_target_dir"
    cat > "$target_spec" <<'EOF'
# Capability: Legacy Capability

### Requirement: Legacy Behavior
- legacy description
EOF

    bash "$REPO_ROOT/.claude/scripts/archive-change.sh" "$change_id" >/dev/null

    if [[ -d "$change_dir" ]]; then
        echo "  change directory still exists after archive"
        return 1
    fi

    if [[ ! -d "$archive_dir" ]]; then
        echo "  archive directory missing"
        return 1
    fi

    bash "$REPO_ROOT/.claude/scripts/generate-archive-summary.sh" "$change_id" >/dev/null
    if [[ ! -f "$summary_file" ]]; then
        echo "  summary file not generated in archive directory"
        return 1
    fi

    bash "$REPO_ROOT/.claude/scripts/generate-spec-changelog.sh" "$change_id" >/dev/null
    if [[ ! -f "$changelog_file" ]]; then
        echo "  changelog not created"
        return 1
    fi

    if ! grep -q "New Requirement" "$target_spec"; then
        echo "  target spec missing new requirement after archive"
        return 1
    fi

    echo "# mutated" > "$target_spec"
    bash "$REPO_ROOT/.claude/scripts/rollback-archive.sh" "$change_id" >/dev/null

    if ! grep -q "Legacy Behavior" "$target_spec"; then
        echo "  rollback did not restore legacy content"
        return 1
    fi

    return 0
}

run_test "archive lifecycle moves change directory" test_archive_moves_directory_and_supports_summary

finish_tests
