#!/usr/bin/env bash
# ============================================================================
# flow-dev Exit Gate
# ============================================================================
# [INPUT]: REQ_ID, devflow/requirements/${REQ_ID}/
# [OUTPUT]: JSON validation result
# [POS]: flow-dev 的出口检查脚本，验证开发阶段完成条件
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
log_error() {
    echo "[ERROR] $1" >&2
}

log_info() {
    echo "[INFO] $1" >&2
}

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

    # 1. REQ_ID 验证
    if [[ -z "$req_id" ]]; then
        output_json "error" "REQ_ID is required"
        exit 1
    fi

    local req_dir="${PROJECT_ROOT}/devflow/requirements/${req_id}"
    local tasks_file="${req_dir}/TASKS.md"

    # 2. 任务完成度检查
    local total_tasks=0
    local completed_tasks=0

    if [[ -f "$tasks_file" ]]; then
        total_tasks=$(grep -c "^- \[" "$tasks_file" 2>/dev/null || echo "0")
        completed_tasks=$(grep -c "^- \[x\]" "$tasks_file" 2>/dev/null || echo "0")
    fi

    if [[ "$total_tasks" -eq 0 ]]; then
        output_json "error" "No tasks found in TASKS.md"
        exit 1
    fi

    local incomplete_tasks=$((total_tasks - completed_tasks))

    if [[ "$incomplete_tasks" -gt 0 ]]; then
        output_json "warning" "Not all tasks completed" "{\"total\":${total_tasks},\"completed\":${completed_tasks},\"incomplete\":${incomplete_tasks}}"
        exit 1
    fi

    # 3. 测试验证 (检查是否有测试相关文件)
    local has_tests=false

    # 检查常见测试目录/文件
    if [[ -d "${PROJECT_ROOT}/tests" ]] || \
       [[ -d "${PROJECT_ROOT}/test" ]] || \
       [[ -d "${PROJECT_ROOT}/__tests__" ]] || \
       [[ -d "${PROJECT_ROOT}/spec" ]]; then
        has_tests=true
    fi

    # 4. 实现文件检查 (检查 tasks/ 目录)
    local impl_dir="${req_dir}/tasks"
    local has_implementation=false

    if [[ -d "$impl_dir" ]] && [[ -n "$(ls -A "$impl_dir" 2>/dev/null)" ]]; then
        has_implementation=true
    fi

    # 5. 成功
    output_json "success" "Exit gate passed" "{\"req_id\":\"${req_id}\",\"total_tasks\":${total_tasks},\"completed_tasks\":${completed_tasks},\"has_tests\":${has_tests},\"has_implementation\":${has_implementation}}"
}

main "$@"
