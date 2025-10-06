#!/usr/bin/env bash
# generate-status-report.sh - 生成跨需求状态报告
# 基于 spec-kit 原则，提供跨需求的开发状态总览

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
  -s, --status STATUS     过滤特定状态: initialized|prd|epic|dev|qa|release|all (默认: all)
  -v, --verbose           详细模式，显示更多信息
  --no-color              禁用颜色输出

示例:
  $0                                    # 生成所有需求的文本报告
  $0 -o status.md -f markdown           # 生成Markdown格式报告
  $0 -s dev                             # 只显示开发中的需求
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
if [[ ! "$FILTER_STATUS" =~ ^(all|initialized|prd|epic|dev|qa|release)$ ]]; then
    echo "错误: 无效的状态 '$FILTER_STATUS'" >&2
    exit 1
fi

# 获取需求目录
REPO_ROOT=$(get_repo_root)
REQUIREMENTS_DIR="$REPO_ROOT/devflow/requirements"

if [[ ! -d "$REQUIREMENTS_DIR" ]]; then
    echo "错误: 需求目录不存在: $REQUIREMENTS_DIR" >&2
    exit 1
fi

# 阶段显示名称映射
get_phase_display_name() {
    local phase="$1"
    case "$phase" in
        initialized) echo "初始化" ;;
        planning) echo "规划中" ;;
        prd_generation_in_progress) echo "PRD生成中" ;;
        prd_complete) echo "PRD完成" ;;
        epic_planning) echo "Epic规划" ;;
        epic_complete) echo "Epic完成" ;;
        development) echo "开发中" ;;
        dev_complete) echo "开发完成" ;;
        qa) echo "质量保证" ;;
        qa_complete) echo "QA完成" ;;
        release) echo "发布中" ;;
        release_complete) echo "发布完成" ;;
        completed) echo "已完成" ;;
        *) echo "$phase" ;;
    esac
}

# 阶段进度百分比
get_phase_percentage() {
    local phase="$1"
    case "$phase" in
        initialized|planning) echo "0" ;;
        prd_generation_in_progress) echo "10" ;;
        prd_complete|epic_planning) echo "20" ;;
        epic_complete) echo "30" ;;
        development) echo "40" ;;
        dev_complete) echo "70" ;;
        qa) echo "80" ;;
        qa_complete) echo "90" ;;
        release|release_complete) echo "95" ;;
        completed) echo "100" ;;
        *) echo "0" ;;
    esac
}

# 收集所有需求信息
collect_requirements() {
    local requirements=()

    for req_dir in "$REQUIREMENTS_DIR"/*; do
        if [[ ! -d "$req_dir" ]]; then
            continue
        fi

        local req_id=$(basename "$req_dir")
        local status_file="$req_dir/orchestration_status.json"

        if [[ ! -f "$status_file" ]]; then
            continue
        fi

        # 读取状态文件
        local status=$(jq -r '.status // "unknown"' "$status_file" 2>/dev/null || echo "unknown")
        local phase=$(jq -r '.phase // "unknown"' "$status_file" 2>/dev/null || echo "unknown")
        local title=$(jq -r '.title // ""' "$status_file" 2>/dev/null || echo "")
        local updated_at=$(jq -r '.updatedAt // ""' "$status_file" 2>/dev/null || echo "")

        # 状态过滤
        if [[ "$FILTER_STATUS" != "all" ]]; then
            # 简化状态匹配逻辑
            local simplified_status="$phase"
            case "$phase" in
                initialized|planning) simplified_status="initialized" ;;
                prd_*|epic_planning) simplified_status="prd" ;;
                epic_complete) simplified_status="epic" ;;
                development|dev_complete) simplified_status="dev" ;;
                qa*) simplified_status="qa" ;;
                release*|completed) simplified_status="release" ;;
            esac

            if [[ "$simplified_status" != "$FILTER_STATUS" ]]; then
                continue
            fi
        fi

        # 统计任务进度
        local tasks_total=0
        local tasks_completed=0
        local tasks_file="$req_dir/TASKS.md"

        if [[ -f "$tasks_file" ]]; then
            # 统计任务总数 (以 ## TASK 开头的行)
            tasks_total=$(grep -c "^## TASK" "$tasks_file" 2>/dev/null || echo "0")

            # 统计已完成任务 (检查 .completed 标记文件)
            local tasks_dir="$req_dir/tasks"
            if [[ -d "$tasks_dir" ]]; then
                tasks_completed=$(find "$tasks_dir" -name "*.completed" -type f 2>/dev/null | wc -l | tr -d ' ')
            fi
        fi

        # 计算进度百分比
        local progress_percent=$(get_phase_percentage "$phase")
        if [[ $tasks_total -gt 0 ]]; then
            # 开发阶段使用任务完成度计算更精确的百分比
            if [[ "$phase" == "development" ]]; then
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
    echo -e "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "需求总数: ${BOLD}$total${NC}"
    echo ""

    if [[ $total -eq 0 ]]; then
        echo -e "${YELLOW}没有找到符合条件的需求${NC}"
        return
    fi

    # 统计各阶段需求数量
    local count_init=0 count_prd=0 count_epic=0 count_dev=0 count_qa=0 count_release=0

    for req_data in "${requirements[@]}"; do
        IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

        case "$phase" in
            initialized|planning) ((count_init++)) ;;
            prd_*|epic_planning) ((count_prd++)) ;;
            epic_complete) ((count_epic++)) ;;
            development|dev_complete) ((count_dev++)) ;;
            qa*) ((count_qa++)) ;;
            release*|completed) ((count_release++)) ;;
        esac
    done

    echo -e "${BOLD}阶段分布:${NC}"
    echo -e "  初始化阶段:   $count_init"
    echo -e "  PRD阶段:      $count_prd"
    echo -e "  Epic阶段:     $count_epic"
    echo -e "  开发阶段:     $count_dev"
    echo -e "  QA阶段:       $count_qa"
    echo -e "  发布/完成:    $count_release"
    echo ""
    echo -e "${BOLD}${CYAN}───────────────────────────────────────────────────────────────${NC}"
    echo ""

    # 输出每个需求的详细信息
    for req_data in "${requirements[@]}"; do
        IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

        local phase_display=$(get_phase_display_name "$phase")
        local progress_bar=$(generate_progress_bar "$progress_percent")

        # 根据阶段选择颜色
        local color="$CYAN"
        case "$phase" in
            initialized|planning) color="$YELLOW" ;;
            *complete|completed) color="$GREEN" ;;
            development|dev_*) color="$BLUE" ;;
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
    echo "**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "**需求总数**: $total"
    echo ""

    if [[ $total -eq 0 ]]; then
        echo "> 没有找到符合条件的需求"
        return
    fi

    # 统计各阶段需求数量
    local count_init=0 count_prd=0 count_epic=0 count_dev=0 count_qa=0 count_release=0

    for req_data in "${requirements[@]}"; do
        IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

        case "$phase" in
            initialized|planning) ((count_init++)) ;;
            prd_*|epic_planning) ((count_prd++)) ;;
            epic_complete) ((count_epic++)) ;;
            development|dev_complete) ((count_dev++)) ;;
            qa*) ((count_qa++)) ;;
            release*|completed) ((count_release++)) ;;
        esac
    done

    echo "## 阶段分布"
    echo ""
    echo "| 阶段 | 数量 |"
    echo "|------|------|"
    echo "| 初始化阶段 | $count_init |"
    echo "| PRD阶段 | $count_prd |"
    echo "| Epic阶段 | $count_epic |"
    echo "| 开发阶段 | $count_dev |"
    echo "| QA阶段 | $count_qa |"
    echo "| 发布/完成 | $count_release |"
    echo ""

    echo "## 需求详情"
    echo ""
    echo "| 需求ID | 标题 | 阶段 | 进度 | 任务进度 | 最后更新 |"
    echo "|--------|------|------|------|----------|----------|"

    for req_data in "${requirements[@]}"; do
        IFS='|' read -r req_id title status phase updated_at tasks_completed tasks_total progress_percent <<< "$req_data"

        local phase_display=$(get_phase_display_name "$phase")
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

            local phase_display=$(get_phase_display_name "$phase")

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
    echo "  \"generated_at\": \"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\","
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
        echo "      \"phase_display\": \"$(get_phase_display_name "$phase")\","
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
    local requirements_data=$(collect_requirements)

    if [[ -z "$requirements_data" ]]; then
        requirements_data=()
    else
        mapfile -t requirements_data <<< "$requirements_data"
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