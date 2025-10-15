#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exit_code=0

for test_file in \
    "$SCRIPT_DIR"/test_generate_dualtrack_metrics.sh \
    "$SCRIPT_DIR"/test_conflict_summary.sh \
    "$SCRIPT_DIR"/test_archive_lifecycle.sh \
    "$SCRIPT_DIR"/test_validate_constitution_tracking.sh; do
    if [[ -f "$test_file" ]]; then
        if ! bash "$test_file"; then
            exit_code=1
        fi
        echo ""
    fi
done

exit "$exit_code"
