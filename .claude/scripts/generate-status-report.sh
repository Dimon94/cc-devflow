#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 common.sh 的 harness/resume-index/status helper，扫描 requirements 与 intent 工件。
# [OUTPUT]: 生成跨需求状态报告，优先展示 harness 主线阶段与恢复材料。
# [POS]: flow:status 的聚合报告器，为人和 Agent 提供当前项目的状态总览。
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
用法: $0 [选项]

生成跨需求状态报告，展示所有需求的开发进度和状态。

选项:
  -h, --help              显示此帮助信息
  -o, --output FILE       输出报告到文件 (默认: 输出到标准输出)
  -f, --format FORMAT     输出格式: text|markdown|json (默认: text)
  -s, --status STATUS     过滤阶段: init|spec|dev|verify|prepare-pr|release|all
                         兼容: initialized|prd|epic|quality|qa|released|completed
  -v, --verbose           详细模式，显示更多信息
  --no-color              禁用颜色输出

示例:
  $0                                    # 生成所有需求的文本报告
  $0 -o status.md -f markdown           # 生成Markdown格式报告
  $0 -s dev                             # 只显示开发中的需求
  $0 -s prepare-pr                      # 只显示待提审需求
  $0 -f json -o status.json             # 生成JSON格式报告

EOF
    exit 0
}

# 解析命令行参数
OUTPUT_FILE=""
FORMAT="text"
FILTER_STATUS="all"
VERBOSE=false
NO_COLOR=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -s|--status)
            FILTER_STATUS="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-color)
            NO_COLOR=true
            shift
            ;;
        *)
            echo "错误: 未知参数 $1" >&2
            usage
            ;;
    esac
done

# 如果禁用颜色，清空颜色变量
if [[ "$NO_COLOR" == "true" || -n "$OUTPUT_FILE" ]]; then
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    BOLD=''
    NC=''
fi

# 验证格式
if [[ ! "$FORMAT" =~ ^(text|markdown|json)$ ]]; then
    echo "错误: 无效的格式 '$FORMAT'，必须是 text, markdown 或 json" >&2
    exit 1
fi

# 验证状态过滤器
RAW_FILTER_STATUS="$FILTER_STATUS"
if ! FILTER_STATUS=$(normalize_stage_filter "$FILTER_STATUS"); then
    echo "错误: 无效的状态 '$RAW_FILTER_STATUS'" >&2
    exit 1
fi

# 获取需求目录
REPO_ROOT=$(get_repo_root)
REQUIREMENTS_DIR="$REPO_ROOT/devflow/requirements"

if [[ ! -d "$REQUIREMENTS_DIR" ]]; then
    echo "错误: 需求目录不存在: $REQUIREMENTS_DIR" >&2
    exit 1
fi

# 收集所有需求信息
collect_requirements() {
    local requirements=()

    for req_dir in "$REQUIREMENTS_DIR"/*; do
        if [[ ! -d "$req_dir" ]]; then
            continue
        fi

        local req_id=$(basename "$req_dir")
        local status_file="$req_dir/orchestration_status.json"
        local harness_state_file
        harness_state_file=$(get_harness_state_file "$REPO_ROOT" "$req_id")

        local status="unknown"
        local phase="unknown"
        local title=""
        local updated_at=""
        local tasks_total=0
        local tasks_completed=0
        local progress_percent=0

        if [[ -f "$harness_state_file" ]]; then
            local snapshot
            snapshot=$(get_harness_snapshot "$REPO_ROOT" "$req_id")
            local raw_stage
            raw_stage=$(echo "$snapshot" | jq -r '.lifecycle.stage // "unknown"' 2>/dev/null || echo "unknown")
            if has_resume_index "$REPO_ROOT" "$req_id"; then
                raw_stage=$(read_resume_index_stage "$REPO_ROOT" "$req_id" || echo "$raw_stage")
            fi

            status=$(echo "$snapshot" | jq -r '.lifecycle.status // "unknown"' 2>/dev/null || echo "unknown")
            phase=$(normalize_mainline_stage "$raw_stage")
            updated_at=$(echo "$snapshot" | jq -r '.lifecycle.updatedAt // ""' 2>/dev/null || echo "")
            tasks_total=$(echo "$snapshot" | jq -r '.progress.totalTasks // 0' 2>/dev/null || echo "0")
            tasks_completed=$(echo "$snapshot" | jq -r '.progress.completedTasks // 0' 2>/dev/null || echo "0")
            title=$(jq -r '.goal // ""' "$harness_state_file" 2>/dev/null || echo "")
            progress_percent=$(get_mainline_stage_progress "$phase")

            if [[ $tasks_total -gt 0 && "$phase" == "dev" ]]; then
                progress_percent=$((30 + (tasks_completed * 40 / tasks_total)))
            elif [[ $tasks_total -gt 0 && "$phase" == "verify" ]]; then
                progress_percent=$((80 + (tasks_completed * 10 / tasks_total)))
            fi
        elif [[ -f "$status_file" ]]; then
            status=$(jq -r '.status // "unknown"' "$status_file" 2>/dev/null || echo "unknown")
            local raw_phase
            raw_phase=$(jq -r '.phase // ""' "$status_file" 2>/dev/null || echo "")
            if [[ -z "$raw_phase" || "$raw_phase" == "null" || "$raw_phase" == "unknown" ]]; then
                raw_phase="$status"
            fi
            phase=$(normalize_mainline_stage "$raw_phase")
            title=$(jq -r '.title // ""' "$status_file" 2>/dev/null || echo "")
            updated_at=$(jq -r '.updatedAt // ""' "$status_file" 2>/dev/null || echo "")
            progress_percent=$(get_mainline_stage_progress "$phase")
        else
            continue
        fi

        if [[ -z "$title" && -f "$status_file" ]]; then
            title=$(jq -r '.title // ""' "$status_file" 2>/dev/null || echo "")
        fi

        # 状态过滤
        if [[ "$FILTER_STATUS" != "all" ]]; then
            if [[ "$phase" != "$FILTER_STATUS" ]]; then
                continue
            fi
        fi

        # 兼容旧流程：无 harness 时退回 TASKS.md 统计
        local tasks_file="$req_dir/TASKS.md"
        if [[ "$tasks_total" -eq 0 && -f "$tasks_file" ]]; then
            # 统计已完成任务 (- [x] 标记)
            tasks_completed=$(grep -c "^\- \[x\]" "$tasks_file" 2>/dev/null || echo "0")

            # 统计待完成任务 (- [ ] 标记)
            local tasks_pending=$(grep -c "^\- \[ \]" "$tasks_file" 2>/dev/null || echo "0")

            # 计算任务总数
            tasks_total=$((tasks_completed + tasks_pending))
            if [[ "$tasks_total" -gt 0 && ( "$progress_percent" -eq 0 || "$phase" == "dev" ) ]]; then
                progress_percent=$((30 + (tasks_completed * 40 / tasks_total)))
            fi
        fi

        # 添加到结果数组
        requirements+=("$req_id|$title|$status|$phase|$updated_at|$tasks_completed|$tasks_total|$progress_percent")
    done

    printf '%s\n' "${requirements[@]}"
}

# 文本格式输出
output_text() {
    local requirements=("$@")
    local total=${#requirements[@]}

    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}          CC-DevFlow 需求开发状态报告${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "生成时间: $(get_beijing_time_full)"
    echo -e "需求总数: ${BOLD}$total${NC}"
    echo ""

    if [[ $total -eq 0 ]]; then
        echo -e "${YELLOW}没有找到符合条件的需求${NC}"
        return
    fi

    # 统计各阶段需求数量
    local count_init=0 count_spec=0 count_dev=0 count_verify=0 count_prepare_pr=0 count_release=0

    for req_data in "${requirements[@]}"; do
        IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

        case "$phase" in
            init) ((count_init++)) ;;
            spec) ((count_spec++)) ;;
            dev) ((count_dev++)) ;;
            verify) ((count_verify++)) ;;
            prepare-pr) ((count_prepare_pr++)) ;;
            release) ((count_release++)) ;;
        esac
    done

    echo -e "${BOLD}阶段分布:${NC}"
    echo -e "  初始化阶段:   $count_init"
    echo -e "  规格阶段:     $count_spec"
    echo -e "  开发阶段:     $count_dev"
    echo -e "  验证阶段:     $count_verify"
    echo -e "  提审阶段:     $count_prepare_pr"
    echo -e "  发布阶段:     $count_release"
    echo ""
    echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────────${NC}"
    echo ""

    # 输出每个需求的详细信息
    for req_data in "${requirements[@]}"; do
        IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

        local phase_display
        phase_display=$(get_mainline_stage_display_name "$phase")
        local progress_bar=$(generate_progress_bar "$progress_percent")

        # 根据阶段选择颜色
        local color="$CYAN"
        case "$phase" in
            init|spec) color="$YELLOW" ;;
            release) color="$GREEN" ;;
            dev) color="$BLUE" ;;
            prepare-pr) color="$GREEN" ;;
        esac

        echo -e "${BOLD}${color}${req_id}${NC}: ${title:-无标题}"
        echo -e "  阶段:     ${phase_display}"
        echo -e "  进度:     $progress_bar ${progress_percent}%"

        if [[ $tasks_total -gt 0 ]]; then
            echo -e "  任务:     ${tasks_completed}/${tasks_total} 已完成"
        fi

        if [[ -n "$updated_at" ]]; then
            echo -e "  更新时间: ${updated_at}"
        fi

        if [[ "$VERBOSE" == "true" ]]; then
            echo -e "  状态:     ${status}"
            local req_dir="$REQUIREMENTS_DIR/$req_id"

            # 检查关键文件
            local files_status=""
            [[ -f "$req_dir/PRD.md" ]] && files_status+="PRD "
            [[ -f "$req_dir/EPIC.md" ]] && files_status+="Epic "
            [[ -f "$req_dir/TASKS.md" ]] && files_status+="Tasks "
            [[ -f "$req_dir/TEST_REPORT.md" ]] && files_status+="TestReport "
            [[ -f "$req_dir/SECURITY_REPORT.md" ]] && files_status+="SecurityReport "

            if [[ -n "$files_status" ]]; then
                echo -e "  文档:     ${files_status}"
            fi
        fi

        echo ""
    done

    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
}

# Markdown格式输出
output_markdown() {
    local requirements=("$@")
    local total=${#requirements[@]}

    echo "# CC-DevFlow 需求开发状态报告"
    echo ""
    echo "**生成时间**: $(get_beijing_time_full)"
    echo ""
    echo "**需求总数**: $total"
    echo ""

    if [[ $total -eq 0 ]]; then
        echo "> 没有找到符合条件的需求"
        return
    fi

    # 统计各阶段需求数量
    local count_init=0 count_spec=0 count_dev=0 count_verify=0 count_prepare_pr=0 count_release=0

    for req_data in "${requirements[@]}"; do
        IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

        case "$phase" in
            init) ((count_init++)) ;;
            spec) ((count_spec++)) ;;
            dev) ((count_dev++)) ;;
            verify) ((count_verify++)) ;;
            prepare-pr) ((count_prepare_pr++)) ;;
            release) ((count_release++)) ;;
        esac
    done

    echo "## 阶段分布"
    echo ""
    echo "| 阶段 | 数量 |"
    echo "|------|------|"
    echo "| 初始化阶段 | $count_init |"
    echo "| 规格阶段 | $count_spec |"
    echo "| 开发阶段 | $count_dev |"
    echo "| 验证阶段 | $count_verify |"
    echo "| 提审阶段 | $count_prepare_pr |"
    echo "| 发布阶段 | $count_release |"
    echo ""

    echo "## 需求详情"
    echo ""
    echo "| 需求ID | 标题 | 阶段 | 进度 | 任务进度 | 最后更新 |"
    echo "|--------|------|------|------|----------|----------|"

    for req_data in "${requirements[@]}"; do
        IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

        local phase_display
        phase_display=$(get_mainline_stage_display_name "$phase")
        local tasks_display="-"

        if [[ $tasks_total -gt 0 ]]; then
            tasks_display="${tasks_completed}/${tasks_total}"
        fi

        local updated_display="${updated_at:-N/A}"

        echo "| **$req_id** | ${title:-无标题} | $phase_display | ${progress_percent}% | $tasks_display | $updated_display |"
    done

    echo ""

    if [[ "$VERBOSE" == "true" ]]; then
        echo "## 详细信息"
        echo ""

        for req_data in "${requirements[@]}"; do
            IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

            local phase_display
            phase_display=$(get_mainline_stage_display_name "$phase")

            echo "### $req_id: ${title:-无标题}"
            echo ""
            echo "- **阶段**: $phase_display"
            echo "- **进度**: ${progress_percent}%"

            if [[ $tasks_total -gt 0 ]]; then
                echo "- **任务**: ${tasks_completed}/${tasks_total} 已完成"
            fi

            echo "- **最后更新**: ${updated_at:-N/A}"
            echo "- **状态**: $status"

            local req_dir="$REQUIREMENTS_DIR/$req_id"
            echo "- **文档**:"
            [[ -f "$req_dir/PRD.md" ]] && echo "  - ✅ PRD.md"
            [[ -f "$req_dir/EPIC.md" ]] && echo "  - ✅ EPIC.md"
            [[ -f "$req_dir/TASKS.md" ]] && echo "  - ✅ TASKS.md"
            [[ -f "$req_dir/TEST_REPORT.md" ]] && echo "  - ✅ TEST_REPORT.md"
            [[ -f "$req_dir/SECURITY_REPORT.md" ]] && echo "  - ✅ SECURITY_REPORT.md"

            echo ""
        done
    fi
}

# JSON格式输出
output_json() {
    local requirements=("$@")

    echo "{"
    echo "  \"generated_at\": \"$(get_beijing_time_iso)\","
    echo "  \"total_requirements\": ${#requirements[@]},"
    echo "  \"requirements\": ["

    local first=true
    for req_data in "${requirements[@]}"; do
        IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo ","
        fi

        echo "    {"
        echo "      \"id\": \"$req_id\","
        echo "      \"title\": \"${title:-}\","
        echo "      \"status\": \"$status\","
        echo "      \"phase\": \"$phase\","
        echo "      \"phase_display\": \"$(get_mainline_stage_display_name "$phase")\","
        echo "      \"progress_percent\": $progress_percent,"
        echo "      \"tasks\": {"
        echo "        \"total\": $tasks_total,"
        echo "        \"completed\": $tasks_completed"
        echo "      },"
        echo "      \"updated_at\": \"${updated_at:-}\""

        if [[ "$VERBOSE" == "true" ]]; then
            local req_dir="$REQUIREMENTS_DIR/$req_id"
            echo "      ,"
            echo "      \"documents\": {"
            echo "        \"prd\": $([ -f "$req_dir/PRD.md" ] && echo "true" || echo "false"),"
            echo "        \"epic\": $([ -f "$req_dir/EPIC.md" ] && echo "true" || echo "false"),"
            echo "        \"tasks\": $([ -f "$req_dir/TASKS.md" ] && echo "true" || echo "false"),"
            echo "        \"test_report\": $([ -f "$req_dir/TEST_REPORT.md" ] && echo "true" || echo "false"),"
            echo "        \"security_report\": $([ -f "$req_dir/SECURITY_REPORT.md" ] && echo "true" || echo "false")"
            echo "      }"
        fi

        echo -n "    }"
    done

    echo ""
    echo "  ]"
    echo "}"
}

# 生成进度条
generate_progress_bar() {
    local percent=$1
    local bar_length=20
    local filled=$((percent * bar_length / 100))
    local empty=$((bar_length - filled))

    local bar="["
    for ((i=0; i<filled; i++)); do bar+="█"; done
    for ((i=0; i<empty; i++)); do bar+="░"; done
    bar+="]"

    echo "$bar"
}

# 主逻辑
main() {
    # 收集需求信息
    local requirements_data_raw
    requirements_data_raw=$(collect_requirements)
    local requirements_data=()

    if [[ -z "$requirements_data_raw" ]]; then
        requirements_data=()
    else
        while IFS= read -r line; do
            requirements_data+=("$line")
        done <<< "$requirements_data_raw"
    fi

    # 根据格式输出
    local output=""
    case "$FORMAT" in
        text)
            output=$(output_text "${requirements_data[@]}")
            ;;
        markdown)
            output=$(output_markdown "${requirements_data[@]}")
            ;;
        json)
            output=$(output_json "${requirements_data[@]}")
            ;;
    esac

    # 输出到文件或标准输出
    if [[ -n "$OUTPUT_FILE" ]]; then
        echo "$output" > "$OUTPUT_FILE"
        echo -e "${GREEN}报告已生成: $OUTPUT_FILE${NC}" >&2
    else
        echo "$output"
    fi
}

main
