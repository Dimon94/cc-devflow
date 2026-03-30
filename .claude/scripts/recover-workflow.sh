#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 common.sh 的 harness/resume-index/status helper，接收 REQ_ID 与恢复参数。
# [OUTPUT]: 基于 resume-index、harness-state 与兼容状态生成恢复计划与下一步命令。
# [POS]: flow:restart 的恢复分析器，负责把中断现场映射回当前主链阶段。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 使用说明
usage() {
    cat << EOF
用法: $0 [选项] REQ_ID

从中断点恢复需求开发工作流

参数:
  REQ_ID                  需求编号 (例如: REQ-123)

选项:
  -h, --help              显示此帮助信息
  --from STAGE            从指定阶段重新开始 (init/spec/dev/verify/prepare-pr/release；prd/epic/quality/qa 兼容)
  --force                 强制恢复，跳过安全检查
  --dry-run               显示恢复计划但不执行
  --verbose               显示详细信息

阶段说明:
  init      - 初始化阶段
  spec      - 规格与任务规划阶段
  dev       - 开发执行阶段
  verify    - 质量验证阶段
  prepare-pr - PR 准备阶段
  release   - 发布管理阶段

示例:
  $0 REQ-123                          # 自动检测并恢复
  $0 REQ-123 --from dev               # 从开发阶段重新开始
  $0 REQ-123 --dry-run                # 预览恢复计划
  $0 REQ-123 --from spec --force      # 强制从规划阶段重新开始

EOF
    exit 0
}

# 解析命令行参数
REQ_ID=""
FROM_STAGE=""
FORCE=false
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        --from)
            FROM_STAGE="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        -*)
            echo "错误: 未知选项 $1" >&2
            usage
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            else
                echo "错误: 多余的参数 $1" >&2
                usage
            fi
            shift
            ;;
    esac
done

# 验证参数
if [[ -z "$REQ_ID" ]]; then
    # 尝试从当前分支获取
    REQ_ID=$(get_current_req_id)
    if [[ -z "$REQ_ID" ]]; then
        echo "错误: 未提供 REQ_ID 且无法从当前分支检测" >&2
        usage
    fi
fi

# 验证 REQ_ID 格式
if ! validate_req_id "$REQ_ID"; then
    exit 1
fi

# 获取仓库根目录和需求目录
REPO_ROOT=$(get_repo_root)
REQ_DIR=$(get_req_dir "$REPO_ROOT" "$REQ_ID")
STATUS_FILE="$REQ_DIR/orchestration_status.json"
HARNESS_STATE_FILE=$(get_harness_state_file "$REPO_ROOT" "$REQ_ID")
RESUME_INDEX_FILE=$(get_resume_index_file "$REPO_ROOT" "$REQ_ID")

DETECTED_STATUS=""
DETECTED_PHASE=""
RECOVERY_STAGE=""

# ============================================================================
# 工作流状态检测
# ============================================================================

# 检测当前工作流状态
detect_workflow_status() {
    echo -e "${BLUE}检测工作流状态...${NC}"
    echo ""

    # 检查需求目录是否存在
    if [[ ! -d "$REQ_DIR" ]]; then
        echo -e "${RED}错误: 需求目录不存在: $REQ_DIR${NC}"
        echo -e "${YELLOW}建议: 使用 /flow:init 初始化需求${NC}"
        exit 1
    fi

    local status="unknown"
    local phase="unknown"
    local title=""
    local updated_at=""
    local raw_stage=""
    local next_action=""

    if has_resume_index "$REPO_ROOT" "$REQ_ID"; then
        raw_stage=$(read_resume_index_stage "$REPO_ROOT" "$REQ_ID" || true)
        next_action=$(read_resume_index_next_action "$REPO_ROOT" "$REQ_ID" || true)
    fi

    if has_harness_runtime_state "$REPO_ROOT" "$REQ_ID"; then
        local snapshot
        snapshot=$(get_harness_snapshot "$REPO_ROOT" "$REQ_ID")
        status=$(echo "$snapshot" | jq -r '.lifecycle.status // "unknown"' 2>/dev/null || echo "unknown")
        if [[ -z "$raw_stage" ]]; then
            raw_stage=$(echo "$snapshot" | jq -r '.lifecycle.stage // "unknown"' 2>/dev/null || echo "unknown")
        fi
        updated_at=$(echo "$snapshot" | jq -r '.lifecycle.updatedAt // ""' 2>/dev/null || echo "")
        title=$(jq -r '.goal // ""' "$HARNESS_STATE_FILE" 2>/dev/null || echo "")
    elif [[ -f "$STATUS_FILE" ]]; then
        status=$(jq -r '.status // "unknown"' "$STATUS_FILE" 2>/dev/null || echo "unknown")
        raw_stage=$(jq -r '.phase // "unknown"' "$STATUS_FILE" 2>/dev/null || echo "unknown")
        title=$(jq -r '.title // ""' "$STATUS_FILE" 2>/dev/null || echo "")
        updated_at=$(jq -r '.updatedAt // ""' "$STATUS_FILE" 2>/dev/null || echo "")
    else
        echo -e "${YELLOW}警告: 未找到 harness-state 或兼容状态文件${NC}"
        echo -e "${YELLOW}建议: 使用 /flow:init --force 重新初始化${NC}"
        exit 1
    fi

    phase=$(map_runtime_stage_to_flow_stage "$raw_stage")

    echo -e "${BOLD}需求信息:${NC}"
    echo -e "  ID:       $REQ_ID"
    echo -e "  标题:     $title"
    echo -e "  状态:     $status"
    echo -e "  阶段:     $phase"
    if [[ -n "$raw_stage" && "$raw_stage" != "$phase" ]]; then
        echo -e "  原始阶段: $raw_stage"
    fi
    echo -e "  更新时间: $updated_at"
    echo ""

    if [[ -n "$next_action" ]]; then
        echo -e "${BOLD}下一步唯一动作:${NC}"
        echo "$next_action"
        echo ""
    fi

    # 检查文档完整性
    echo -e "${BOLD}文档状态:${NC}"
    check_document_status "PRD.md"
    check_document_status "EPIC.md"
    check_document_status "TASKS.md"
    check_document_status "TEST_REPORT.md"
    check_document_status "SECURITY_REPORT.md"
    check_document_status "RELEASE_PLAN.md"
    echo ""

    # 检查任务进度
    if [[ -f "$REQ_DIR/TASKS.md" ]]; then
        # 统计已完成任务 (- [x] 标记)
        local tasks_completed
        tasks_completed=$(count_task_marks "$REQ_DIR/TASKS.md" "^\- \[x\]")

        # 统计待完成任务 (- [ ] 标记)
        local tasks_pending
        tasks_pending=$(count_task_marks "$REQ_DIR/TASKS.md" "^\- \[ \]")

        # 计算任务总数
        local tasks_total=$((tasks_completed + tasks_pending))

        echo -e "${BOLD}任务进度:${NC}"
        echo -e "  总任务数:     $tasks_total"
        echo -e "  已完成:       $tasks_completed"
        echo -e "  未完成:       $tasks_pending"
        echo ""
    fi

    DETECTED_STATUS="$status"
    DETECTED_PHASE="$phase"
}

# 检查文档状态
check_document_status() {
    local doc_name="$1"
    local doc_path="$REQ_DIR/$doc_name"

    if [[ -f "$doc_path" ]]; then
        local size=$(wc -l < "$doc_path" | tr -d ' ')
        echo -e "  ✅ $doc_name ($size 行)"
    else
        echo -e "  ❌ $doc_name (不存在)"
    fi
}

count_task_marks() {
    local tasks_file="$1"
    local pattern="$2"
    local count
    count=$(grep -c "$pattern" "$tasks_file" 2>/dev/null || true)
    echo "${count:-0}"
}

# ============================================================================
# 恢复策略分析
# ============================================================================

# 分析并建议恢复策略
analyze_recovery_strategy() {
    local current_status="$1"
    local current_phase="$2"
    local normalized_phase="$current_phase"

    echo -e "${BLUE}分析恢复策略...${NC}"
    echo ""

    # 如果指定了 --from，使用指定的阶段
    if [[ -n "$FROM_STAGE" ]]; then
        echo -e "${YELLOW}用户指定从阶段恢复: $FROM_STAGE${NC}"
        validate_stage "$FROM_STAGE"
        RECOVERY_STAGE="$(normalize_stage "$FROM_STAGE")"
        return 0
    fi

    if [[ "$current_phase" == "completed" || "$current_status" == "completed" ]]; then
        echo -e "${GREEN}需求已完成，无需恢复${NC}"
        echo ""
        exit 0
    fi

    normalized_phase=$(normalize_mainline_stage "$current_phase")
    if [[ -z "$normalized_phase" || "$normalized_phase" == "unknown" ]]; then
        normalized_phase=$(normalize_mainline_stage "$current_status")
    fi

    # 根据当前阶段智能判断恢复点
    case "$normalized_phase" in
        init)
            echo -e "${CYAN}建议: 从规格阶段开始${NC}"
            RECOVERY_STAGE="spec"
            ;;
        spec)
            echo -e "${CYAN}建议: 从开发阶段开始${NC}"
            RECOVERY_STAGE="dev"
            ;;
        dev)
            # 检查是否有未完成的任务
            local tasks_file="$REQ_DIR/TASKS.md"
            local manifest_file
            manifest_file=$(get_task_manifest_file "$REPO_ROOT" "$REQ_ID")

            if [[ -f "$manifest_file" ]]; then
                local pending_count
                pending_count=$(jq '[.tasks[] | select(.status == "pending" or .status == "running" or .status == "failed")] | length' "$manifest_file" 2>/dev/null || echo "0")
                if [[ "$pending_count" -gt 0 ]]; then
                    echo -e "${CYAN}建议: 继续开发 (恢复未完成任务)${NC}"
                    RECOVERY_STAGE="dev"
                else
                    echo -e "${CYAN}建议: 进入质量验证阶段${NC}"
                    RECOVERY_STAGE="verify"
                fi
            elif [[ -f "$tasks_file" ]]; then
                # 统计已完成任务 (- [x] 标记)
                local tasks_completed
                tasks_completed=$(count_task_marks "$tasks_file" "^\- \[x\]")

                # 统计待完成任务 (- [ ] 标记)
                local tasks_pending
                tasks_pending=$(count_task_marks "$tasks_file" "^\- \[ \]")

                # 计算任务总数
                local tasks_total=$((tasks_completed + tasks_pending))

                if [[ $tasks_pending -gt 0 ]]; then
                    echo -e "${CYAN}建议: 继续开发 (恢复未完成任务)${NC}"
                    RECOVERY_STAGE="dev"
                else
                    echo -e "${CYAN}建议: 进入质量验证阶段${NC}"
                    RECOVERY_STAGE="verify"
                fi
            else
                echo -e "${CYAN}建议: 从开发阶段开始${NC}"
                RECOVERY_STAGE="dev"
            fi
            ;;
        verify)
            if [[ "$current_status" == "verified" ]]; then
                echo -e "${CYAN}建议: 从 PR 准备阶段开始${NC}"
                RECOVERY_STAGE="prepare-pr"
            else
                echo -e "${CYAN}建议: 从质量验证阶段开始${NC}"
                RECOVERY_STAGE="verify"
            fi
            ;;
        prepare-pr)
            echo -e "${CYAN}建议: 从 PR 准备阶段开始${NC}"
            RECOVERY_STAGE="prepare-pr"
            ;;
        release)
            echo -e "${CYAN}建议: 从发布阶段开始${NC}"
            RECOVERY_STAGE="release"
            ;;
        *)
            echo -e "${YELLOW}警告: 未知阶段 '$current_phase'，从规格阶段开始${NC}"
            RECOVERY_STAGE="spec"
            ;;
    esac
}

# 验证阶段名称
validate_stage() {
    local stage="$1"
    local normalized=""

    normalized=$(normalize_stage_filter "$stage" 2>/dev/null || true)
    case "$normalized" in
        init|spec|dev|verify|prepare-pr|release)
            return 0
            ;;
    esac

    echo -e "${RED}错误: 无效的阶段 '$stage'${NC}"
    echo -e "${YELLOW}有效阶段: init, spec, dev, verify, prepare-pr, release (prd/epic/quality/qa 兼容)${NC}"
    exit 1
}

# 兼容历史阶段名称，统一映射到主链阶段
normalize_stage() {
    local stage="$1"
    normalize_stage_filter "$stage"
}

# ============================================================================
# 恢复执行
# ============================================================================

# 生成恢复计划
generate_recovery_plan() {
    local start_stage="$1"

    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}  恢复计划${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${BOLD}起始阶段: $start_stage${NC}"
    echo ""

    # 根据起始阶段生成后续步骤
    local stages=()
    case "$start_stage" in
        init)
            stages=("init" "spec" "dev" "verify" "prepare-pr" "release")
            ;;
        spec)
            stages=("spec" "dev" "verify" "prepare-pr" "release")
            ;;
        dev)
            stages=("dev" "verify" "prepare-pr" "release")
            ;;
        verify)
            stages=("verify" "prepare-pr" "release")
            ;;
        prepare-pr)
            stages=("prepare-pr" "release")
            ;;
        release)
            stages=("release")
            ;;
    esac

    echo -e "${BOLD}执行步骤:${NC}"
    local step_num=1
    for stage in "${stages[@]}"; do
        local command=""
        case "$stage" in
            init)
                command="/flow:init \"$REQ_ID\""
                ;;
            spec)
                command="/flow:spec \"$REQ_ID\""
                ;;
            dev)
                command="/flow:dev \"$REQ_ID\" --resume"
                ;;
            verify)
                command="/flow:verify \"$REQ_ID\" --strict"
                ;;
            prepare-pr)
                command="/flow:prepare-pr \"$REQ_ID\""
                ;;
            release)
                command="/flow:release \"$REQ_ID\""
                ;;
        esac

        echo -e "  ${step_num}. $command"
        ((step_num++))
    done

    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 执行恢复
execute_recovery() {
    local start_stage="$1"

    echo -e "${GREEN}开始执行恢复...${NC}"
    echo ""

    # 安全检查 (除非使用 --force)
    if [[ "$FORCE" != "true" ]]; then
        echo -e "${YELLOW}警告: 恢复操作可能覆盖现有文档${NC}"
        read -p "确认继续? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}已取消恢复${NC}"
            exit 0
        fi
    fi

    # 根据起始阶段执行命令
    # 注意: 这里只是展示命令，实际执行由用户手动调用或使用 /flow:restart
    echo -e "${CYAN}请手动执行以下命令以恢复工作流:${NC}"
    echo ""

    case "$start_stage" in
        init)
            echo "/flow:init \"$REQ_ID\""
            echo "/flow:spec \"$REQ_ID\""
            echo "/flow:dev \"$REQ_ID\""
            echo "/flow:verify \"$REQ_ID\" --strict"
            echo "/flow:prepare-pr \"$REQ_ID\""
            echo "/flow:release \"$REQ_ID\""
            ;;
        spec)
            echo "/flow:spec \"$REQ_ID\""
            echo "/flow:dev \"$REQ_ID\""
            echo "/flow:verify \"$REQ_ID\" --strict"
            echo "/flow:prepare-pr \"$REQ_ID\""
            echo "/flow:release \"$REQ_ID\""
            ;;
        dev)
            echo "/flow:dev \"$REQ_ID\" --resume"
            echo "/flow:verify \"$REQ_ID\" --strict"
            echo "/flow:prepare-pr \"$REQ_ID\""
            echo "/flow:release \"$REQ_ID\""
            ;;
        verify)
            echo "/flow:verify \"$REQ_ID\" --strict"
            echo "/flow:prepare-pr \"$REQ_ID\""
            echo "/flow:release \"$REQ_ID\""
            ;;
        prepare-pr)
            echo "/flow:prepare-pr \"$REQ_ID\""
            echo "/flow:release \"$REQ_ID\""
            ;;
        release)
            echo "/flow:release \"$REQ_ID\""
            ;;
    esac

    echo ""
    echo -e "${GREEN}恢复计划已生成${NC}"
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  CC-DevFlow 工作流恢复工具${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
    echo ""

    # 检测工作流状态
    detect_workflow_status
    local current_status="$DETECTED_STATUS"
    local current_phase="$DETECTED_PHASE"

    # 分析恢复策略
    analyze_recovery_strategy "$current_status" "$current_phase"
    local recovery_stage="$RECOVERY_STAGE"

    # 生成恢复计划
    generate_recovery_plan "$recovery_stage"

    # 如果是 dry-run，只显示计划不执行
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}Dry-run 模式: 仅显示计划，未执行任何操作${NC}"
        exit 0
    fi

    # 执行恢复
    execute_recovery "$recovery_stage"
}

# 运行主逻辑
main
