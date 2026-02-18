#!/usr/bin/env bash
# recover-workflow.sh - 从中断恢复工作流
# 智能检测中断点，选择最佳恢复策略

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
  --from STAGE            从指定阶段重新开始 (init/spec/dev/verify/release；prd/epic/quality/qa 兼容)
  --force                 强制恢复，跳过安全检查
  --dry-run               显示恢复计划但不执行
  --verbose               显示详细信息

阶段说明:
  init      - 初始化阶段
  spec      - 规格与任务规划阶段
  dev       - 开发执行阶段
  verify    - 质量验证阶段
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

    # 检查状态文件
    if [[ ! -f "$STATUS_FILE" ]]; then
        echo -e "${YELLOW}警告: 状态文件不存在，需求可能未正确初始化${NC}"
        echo -e "${YELLOW}建议: 使用 /flow:init --force 重新初始化${NC}"
        exit 1
    fi

    # 读取状态文件
    local status=$(jq -r '.status // "unknown"' "$STATUS_FILE" 2>/dev/null || echo "unknown")
    local phase=$(jq -r '.phase // "unknown"' "$STATUS_FILE" 2>/dev/null || echo "unknown")
    local title=$(jq -r '.title // ""' "$STATUS_FILE" 2>/dev/null || echo "")
    local updated_at=$(jq -r '.updatedAt // ""' "$STATUS_FILE" 2>/dev/null || echo "")

    echo -e "${BOLD}需求信息:${NC}"
    echo -e "  ID:       $REQ_ID"
    echo -e "  标题:     $title"
    echo -e "  状态:     $status"
    echo -e "  阶段:     $phase"
    echo -e "  更新时间: $updated_at"
    echo ""

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
        local tasks_completed=$(grep -c "^\- \[x\]" "$REQ_DIR/TASKS.md" 2>/dev/null || echo "0")

        # 统计待完成任务 (- [ ] 标记)
        local tasks_pending=$(grep -c "^\- \[ \]" "$REQ_DIR/TASKS.md" 2>/dev/null || echo "0")

        # 计算任务总数
        local tasks_total=$((tasks_completed + tasks_pending))

        echo -e "${BOLD}任务进度:${NC}"
        echo -e "  总任务数:     $tasks_total"
        echo -e "  已完成:       $tasks_completed"
        echo -e "  未完成:       $tasks_pending"
        echo ""
    fi

    # 返回状态和阶段
    echo "$status|$phase"
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

# ============================================================================
# 恢复策略分析
# ============================================================================

# 分析并建议恢复策略
analyze_recovery_strategy() {
    local current_status="$1"
    local current_phase="$2"

    echo -e "${BLUE}分析恢复策略...${NC}"
    echo ""

    # 如果指定了 --from，使用指定的阶段
    if [[ -n "$FROM_STAGE" ]]; then
        echo -e "${YELLOW}用户指定从阶段恢复: $FROM_STAGE${NC}"
        validate_stage "$FROM_STAGE"
        echo "$(normalize_stage "$FROM_STAGE")"
        return 0
    fi

    # 根据当前阶段智能判断恢复点
    case "$current_phase" in
        initialized|context_packed|planning|planned|spec_in_progress)
            echo -e "${CYAN}建议: 从规格阶段开始${NC}"
            echo "spec"
            ;;
        prd_generation_in_progress|epic_planning|prd_complete|epic_complete|spec_complete)
            echo -e "${CYAN}建议: 从开发阶段开始${NC}"
            echo "dev"
            ;;
        development|development_in_progress|dev_complete|development_complete)
            # 检查是否有未完成的任务
            if [[ -f "$REQ_DIR/TASKS.md" ]]; then
                # 统计已完成任务 (- [x] 标记)
                local tasks_completed=$(grep -c "^\- \[x\]" "$REQ_DIR/TASKS.md" 2>/dev/null || echo "0")

                # 统计待完成任务 (- [ ] 标记)
                local tasks_pending=$(grep -c "^\- \[ \]" "$REQ_DIR/TASKS.md" 2>/dev/null || echo "0")

                # 计算任务总数
                local tasks_total=$((tasks_completed + tasks_pending))

                if [[ $tasks_pending -gt 0 ]]; then
                    echo -e "${CYAN}建议: 继续开发 (恢复未完成任务)${NC}"
                    echo "dev"
                else
                    echo -e "${CYAN}建议: 进入质量验证阶段${NC}"
                    echo "verify"
                fi
            else
                echo -e "${CYAN}建议: 从开发阶段开始${NC}"
                echo "dev"
            fi
            ;;
        quality|qa|verification_in_progress)
            echo -e "${CYAN}建议: 从质量验证阶段开始${NC}"
            echo "verify"
            ;;
        quality_complete|qa_complete|verified)
            echo -e "${CYAN}建议: 从发布阶段开始${NC}"
            echo "release"
            ;;
        release|release_complete)
            echo -e "${CYAN}建议: 从发布阶段开始${NC}"
            echo "release"
            ;;
        completed)
            echo -e "${GREEN}需求已完成，无需恢复${NC}"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${YELLOW}警告: 未知阶段 '$current_phase'，从规格阶段开始${NC}"
            echo "spec"
            ;;
    esac
}

# 验证阶段名称
validate_stage() {
    local stage="$1"

    case "$stage" in
        init|spec|dev|verify|release|prd|epic|quality|qa)
            return 0
            ;;
        *)
            echo -e "${RED}错误: 无效的阶段 '$stage'${NC}"
            echo -e "${YELLOW}有效阶段: init, spec, dev, verify, release (prd/epic/quality/qa 兼容)${NC}"
            exit 1
            ;;
    esac
}

# 兼容历史阶段名称，统一映射到主链阶段
normalize_stage() {
    local stage="$1"
    case "$stage" in
        prd|epic)
            echo "spec"
            ;;
        quality|qa)
            echo "verify"
            ;;
        *)
            echo "$stage"
            ;;
    esac
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
            stages=("init" "spec" "dev" "verify" "release")
            ;;
        spec)
            stages=("spec" "dev" "verify" "release")
            ;;
        dev)
            stages=("dev" "verify" "release")
            ;;
        verify)
            stages=("verify" "release")
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
            echo "/flow:release \"$REQ_ID\""
            ;;
        spec)
            echo "/flow:spec \"$REQ_ID\""
            echo "/flow:dev \"$REQ_ID\""
            echo "/flow:verify \"$REQ_ID\" --strict"
            echo "/flow:release \"$REQ_ID\""
            ;;
        dev)
            echo "/flow:dev \"$REQ_ID\" --resume"
            echo "/flow:verify \"$REQ_ID\" --strict"
            echo "/flow:release \"$REQ_ID\""
            ;;
        verify)
            echo "/flow:verify \"$REQ_ID\" --strict"
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
    local status_info=$(detect_workflow_status)
    local current_status=$(echo "$status_info" | cut -d'|' -f1)
    local current_phase=$(echo "$status_info" | cut -d'|' -f2)

    # 分析恢复策略
    local recovery_stage=$(analyze_recovery_strategy "$current_status" "$current_phase")

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
