#!/usr/bin/env bash
# ============================================================================
# flow-dev Task Orchestrator
# ============================================================================
# [INPUT]: REQ_ID, TASKS.md
# [OUTPUT]: JSON with next task info
# [POS]: flow-dev 的任务调度脚本，解析 TASKS.md 并返回下一个待执行任务
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# ============================================================================

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"

# ============================================================================
# Functions
# ============================================================================
output_json() {
    local status="$1"
    local message="$2"
    local details="${3:-}"

    if [[ -n "$details" ]]; then
        echo "{\"status\":\"${status}\",\"message\":\"${message}\",\"details\":${details}}"
    else
        echo "{\"status\":\"${status}\",\"message\":\"${message}\"}"
    fi
}

# ============================================================================
# Main
# ============================================================================
main() {
    local req_id="${1:-}"
    local action="${2:-next}"  # next, status, mark-complete
    local task_id="${3:-}"

    if [[ -z "$req_id" ]]; then
        output_json "error" "REQ_ID is required"
        exit 1
    fi

    local req_dir="${PROJECT_ROOT}/devflow/requirements/${req_id}"
    local tasks_file="${req_dir}/TASKS.md"

    if [[ ! -f "$tasks_file" ]]; then
        output_json "error" "TASKS.md not found"
        exit 1
    fi

    case "$action" in
        next)
            # 找到第一个未完成的任务
            local next_task
            next_task=$(grep -n "^- \[ \]" "$tasks_file" | head -1 || echo "")

            if [[ -z "$next_task" ]]; then
                output_json "complete" "All tasks completed"
            else
                local line_num=$(echo "$next_task" | cut -d: -f1)
                local task_content=$(echo "$next_task" | cut -d: -f2-)

                # 提取任务 ID (T###)
                local extracted_id=$(echo "$task_content" | grep -o 'T[0-9]\{3\}' | head -1 || echo "")

                output_json "success" "Next task found" "{\"line\":${line_num},\"task_id\":\"${extracted_id}\",\"content\":\"${task_content}\"}"
            fi
            ;;

        status)
            local total=$(grep -c "^- \[" "$tasks_file" 2>/dev/null || echo "0")
            local completed=$(grep -c "^- \[x\]" "$tasks_file" 2>/dev/null || echo "0")
            local pending=$((total - completed))

            output_json "success" "Task status" "{\"total\":${total},\"completed\":${completed},\"pending\":${pending}}"
            ;;

        mark-complete)
            if [[ -z "$task_id" ]]; then
                output_json "error" "task_id required for mark-complete"
                exit 1
            fi

            # 标记任务完成 (将 [ ] 改为 [x])
            if grep -q "^- \[ \].*${task_id}" "$tasks_file"; then
                sed -i.bak "s/^- \[ \]\(.*${task_id}.*\)/- [x]\1/" "$tasks_file"
                rm -f "${tasks_file}.bak"
                output_json "success" "Task marked complete" "{\"task_id\":\"${task_id}\"}"
            else
                output_json "error" "Task not found or already completed: ${task_id}"
                exit 1
            fi
            ;;

        *)
            output_json "error" "Unknown action: ${action}. Use: next, status, mark-complete"
            exit 1
            ;;
    esac
}

main "$@"
