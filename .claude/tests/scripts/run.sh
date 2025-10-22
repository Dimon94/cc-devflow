#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exit_code=0

tests=(
    test_common.sh
    test_check_prerequisites.sh
    test_check_task_status.sh
    test_mark_task_complete.sh
    test_generate_status_report.sh
    test_recover_workflow.sh
    test_setup_epic.sh
    test_validate_constitution.sh
)

for test_name in "${tests[@]}"; do
    test_file="$SCRIPT_DIR/$test_name"
    if [[ -f "$test_file" ]]; then
        if ! bash "$test_file"; then
            exit_code=1
        fi
        echo ""
    fi
done

exit "$exit_code"
