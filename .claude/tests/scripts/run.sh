#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 scripts 目录下各 shell 测试文件。
# [OUTPUT]: 串行执行脚本回归测试并汇总退出码。
# [POS]: .claude/tests/scripts 的最薄聚合入口，被测试执行器或人工回归调用。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exit_code=0

tests=(
    test_archive_requirement.sh
    test_common.sh
    test_create_requirement.sh
    test_check_prerequisites.sh
    test_check_task_status.sh
    test_mark_task_complete.sh
    test_generate_status_report.sh
    test_recover_workflow.sh
    test_setup_epic.sh
    test_sync_roadmap_progress.sh
    test_workflow_skill_alignment.sh
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
