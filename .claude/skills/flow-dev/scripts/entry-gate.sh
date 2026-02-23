#!/usr/bin/env bash
# ============================================================================
# flow-dev Entry Gate
# ============================================================================
# [INPUT]: REQ_ID, devflow/requirements/${REQ_ID}/
# [OUTPUT]: JSON validation result
# [POS]: flow-dev 的入口检查脚本，验证开发阶段前置条件
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

    # 2. 目录存在性检查
    if [[ ! -d "$req_dir" ]]; then
        output_json "error" "Requirement directory not found: ${req_dir}"
        exit 1
    fi

    # 3. 必需文件检查
    local missing_files=()

    [[ ! -f "${req_dir}/TASKS.md" ]] && missing_files+=("TASKS.md")
    [[ ! -f "${req_dir}/EPIC.md" ]] && missing_files+=("EPIC.md")
    [[ ! -f "${req_dir}/PRD.md" ]] && missing_files+=("PRD.md")
    [[ ! -f "${req_dir}/orchestration_status.json" ]] && missing_files+=("orchestration_status.json")

    if [[ ${#missing_files[@]} -gt 0 ]]; then
        local files_json=$(printf '"%s",' "${missing_files[@]}" | sed 's/,$//')
        output_json "error" "Missing required files" "[${files_json}]"
        exit 1
    fi

    # 4. 状态检查
    local status_file="${req_dir}/orchestration_status.json"
    local current_status

    if command -v jq &> /dev/null; then
        current_status=$(jq -r '.status // "unknown"' "$status_file" 2>/dev/null || echo "unknown")
    else
        current_status=$(grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' "$status_file" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
    fi

    local valid_statuses=("spec_complete" "epic_complete" "development_in_progress" "development_failed")
    local status_valid=false

    for valid in "${valid_statuses[@]}"; do
        if [[ "$current_status" == "$valid" ]]; then
            status_valid=true
            break
        fi
    done

    if [[ "$status_valid" != "true" ]]; then
        output_json "error" "Invalid status for flow-dev: ${current_status}. Expected: spec_complete, epic_complete, development_in_progress, or development_failed"
        exit 1
    fi

    # 5. TASKS.md 格式检查
    if ! grep -q "^- \[ \]" "${req_dir}/TASKS.md" 2>/dev/null; then
        # 检查是否所有任务都已完成
        if grep -q "^- \[x\]" "${req_dir}/TASKS.md" 2>/dev/null; then
            log_info "All tasks appear to be completed"
        else
            output_json "error" "TASKS.md has no valid task format (- [ ] or - [x])"
            exit 1
        fi
    fi

    # 6. 成功
    output_json "success" "Entry gate passed" "{\"req_id\":\"${req_id}\",\"status\":\"${current_status}\"}"
}

main "$@"
