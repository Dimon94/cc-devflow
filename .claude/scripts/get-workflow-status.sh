#!/usr/bin/env bash
# =============================================================================
# get-workflow-status.sh - 工作流状态检测脚本
# =============================================================================
# 读取 workflow.yaml，检查工件文件存在性，输出当前状态和可执行的下一步
#
# 用法:
#   ./get-workflow-status.sh REQ-001           # 检查指定需求的状态
#   ./get-workflow-status.sh REQ-001 --json    # JSON 格式输出
#   ./get-workflow-status.sh REQ-001 --next    # 仅输出下一步可执行的工件
#   ./get-workflow-status.sh --project         # 检查项目级工件状态
#
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# 配置
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
WORKFLOW_YAML="${PROJECT_ROOT}/.claude/skills/workflow.yaml"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# 辅助函数
# -----------------------------------------------------------------------------
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[DONE]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# 检查依赖
check_dependencies() {
    local missing=()
    for cmd in yq; do
        if ! command -v "$cmd" &>/dev/null; then
            missing+=("$cmd")
        fi
    done
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "缺少依赖: ${missing[*]}"
        log_info "安装方法: brew install ${missing[*]}"
        exit 1
    fi
}

# 替换路径中的占位符
resolve_path() {
    local path="$1"
    local req_id="${2:-}"
    local bug_id="${3:-}"

    path="${path//\{REQ\}/$req_id}"
    path="${path//\{BUG\}/$bug_id}"
    echo "$path"
}

# 检查文件/目录是否存在（支持 glob）
check_exists() {
    local pattern="$1"
    local is_glob="${2:-false}"
    local full_path="${PROJECT_ROOT}/${pattern}"

    if [[ "$is_glob" == "true" ]]; then
        # glob 模式：检查是否有匹配的文件
        local matches
        matches=$(find "${full_path%/*}" -name "${full_path##*/}" 2>/dev/null | head -1)
        [[ -n "$matches" ]]
    else
        # 精确路径：检查文件或目录存在
        [[ -e "$full_path" ]]
    fi
}

# 检查工件是否完成
is_artifact_complete() {
    local generates="$1"
    local req_id="$2"
    local is_glob="${3:-false}"

    local resolved_path
    resolved_path=$(resolve_path "$generates" "$req_id")

    check_exists "$resolved_path" "$is_glob"
}

# 检查依赖是否满足
are_dependencies_met() {
    local artifact_id="$1"
    local req_id="$2"

    # 获取依赖列表
    local requires
    requires=$(yq ".artifacts[] | select(.id == \"$artifact_id\") | .requires[]?" "$WORKFLOW_YAML" 2>/dev/null)

    if [[ -z "$requires" ]]; then
        return 0  # 无依赖，满足
    fi

    # 检查每个依赖
    while IFS= read -r dep_id; do
        [[ -z "$dep_id" ]] && continue

        local dep_generates dep_glob
        dep_generates=$(yq ".artifacts[] | select(.id == \"$dep_id\") | .generates" "$WORKFLOW_YAML")
        dep_glob=$(yq ".artifacts[] | select(.id == \"$dep_id\") | .glob // false" "$WORKFLOW_YAML")

        if ! is_artifact_complete "$dep_generates" "$req_id" "$dep_glob"; then
            return 1  # 依赖未完成
        fi
    done <<< "$requires"

    return 0  # 所有依赖满足
}

# 获取工件状态
get_artifact_status() {
    local artifact_id="$1"
    local req_id="$2"

    local generates is_glob is_optional
    generates=$(yq ".artifacts[] | select(.id == \"$artifact_id\") | .generates" "$WORKFLOW_YAML")
    is_glob=$(yq ".artifacts[] | select(.id == \"$artifact_id\") | .glob // false" "$WORKFLOW_YAML")
    is_optional=$(yq ".artifacts[] | select(.id == \"$artifact_id\") | .optional // false" "$WORKFLOW_YAML")

    if is_artifact_complete "$generates" "$req_id" "$is_glob"; then
        echo "complete"
    elif are_dependencies_met "$artifact_id" "$req_id"; then
        echo "ready"
    else
        echo "blocked"
    fi
}

# -----------------------------------------------------------------------------
# 主要功能
# -----------------------------------------------------------------------------

# 获取需求级工件状态
get_requirement_status() {
    local req_id="$1"
    local output_format="${2:-text}"

    log_info "检查需求 $req_id 的工作流状态..."

    # 获取所有需求级工件（包含 {REQ} 占位符的）
    local artifacts
    artifacts=$(yq '.artifacts[] | select(.generates | contains("{REQ}")) | .id' "$WORKFLOW_YAML")

    local complete=()
    local ready=()
    local blocked=()
    local optional_pending=()

    while IFS= read -r artifact_id; do
        [[ -z "$artifact_id" ]] && continue

        local status is_optional
        status=$(get_artifact_status "$artifact_id" "$req_id")
        is_optional=$(yq ".artifacts[] | select(.id == \"$artifact_id\") | .optional // false" "$WORKFLOW_YAML")

        case "$status" in
            complete)
                complete+=("$artifact_id")
                ;;
            ready)
                if [[ "$is_optional" == "true" ]]; then
                    optional_pending+=("$artifact_id")
                else
                    ready+=("$artifact_id")
                fi
                ;;
            blocked)
                blocked+=("$artifact_id")
                ;;
        esac
    done <<< "$artifacts"

    # 输出结果
    if [[ "$output_format" == "json" ]]; then
        cat <<EOF
{
  "req_id": "$req_id",
  "complete": [$(printf '"%s",' "${complete[@]}" | sed 's/,$//')]
  "ready": [$(printf '"%s",' "${ready[@]}" | sed 's/,$//')]
  "optional_pending": [$(printf '"%s",' "${optional_pending[@]}" | sed 's/,$//')]
  "blocked": [$(printf '"%s",' "${blocked[@]}" | sed 's/,$//')]
  "progress": "${#complete[@]}/$((${#complete[@]} + ${#ready[@]} + ${#blocked[@]}))"
}
EOF
    else
        echo ""
        echo -e "${CYAN}=== 需求 $req_id 工作流状态 ===${NC}"
        echo ""

        if [[ ${#complete[@]} -gt 0 ]]; then
            echo -e "${GREEN}已完成 (${#complete[@]}):${NC}"
            for a in "${complete[@]}"; do
                local generates
                generates=$(yq ".artifacts[] | select(.id == \"$a\") | .generates" "$WORKFLOW_YAML")
                generates=$(resolve_path "$generates" "$req_id")
                echo -e "  ${GREEN}✓${NC} $a → $generates"
            done
            echo ""
        fi

        if [[ ${#ready[@]} -gt 0 ]]; then
            echo -e "${YELLOW}可执行 (${#ready[@]}):${NC}"
            for a in "${ready[@]}"; do
                local skill
                skill=$(yq ".artifacts[] | select(.id == \"$a\") | .skill" "$WORKFLOW_YAML")
                echo -e "  ${YELLOW}→${NC} $a (skill: $skill)"
            done
            echo ""
        fi

        if [[ ${#optional_pending[@]} -gt 0 ]]; then
            echo -e "${BLUE}可选工件 (${#optional_pending[@]}):${NC}"
            for a in "${optional_pending[@]}"; do
                local skill
                skill=$(yq ".artifacts[] | select(.id == \"$a\") | .skill" "$WORKFLOW_YAML")
                echo -e "  ${BLUE}○${NC} $a (skill: $skill)"
            done
            echo ""
        fi

        if [[ ${#blocked[@]} -gt 0 ]]; then
            echo -e "${RED}阻塞中 (${#blocked[@]}):${NC}"
            for a in "${blocked[@]}"; do
                local requires
                requires=$(yq ".artifacts[] | select(.id == \"$a\") | .requires[]?" "$WORKFLOW_YAML" | tr '\n' ', ' | sed 's/,$//')
                echo -e "  ${RED}✗${NC} $a (等待: $requires)"
            done
            echo ""
        fi

        # 进度条
        local total=$((${#complete[@]} + ${#ready[@]} + ${#blocked[@]}))
        local percent=0
        [[ $total -gt 0 ]] && percent=$((${#complete[@]} * 100 / total))
        echo -e "进度: ${GREEN}${#complete[@]}${NC}/$total ($percent%)"

        # 下一步建议
        if [[ ${#ready[@]} -gt 0 ]]; then
            local next_artifact="${ready[0]}"
            local next_skill
            next_skill=$(yq ".artifacts[] | select(.id == \"$next_artifact\") | .skill" "$WORKFLOW_YAML")
            echo ""
            echo -e "${CYAN}建议下一步:${NC} /$next_skill \"$req_id\""
        fi
    fi
}

# 获取项目级工件状态
get_project_status() {
    local output_format="${1:-text}"

    log_info "检查项目级工件状态..."

    # 获取所有项目级工件（不包含 {REQ} 占位符的）
    local artifacts
    artifacts=$(yq '.artifacts[] | select(.generates | contains("{REQ}") | not) | select(.generates | contains("{BUG}") | not) | .id' "$WORKFLOW_YAML")

    local complete=()
    local missing=()

    while IFS= read -r artifact_id; do
        [[ -z "$artifact_id" ]] && continue

        local generates
        generates=$(yq ".artifacts[] | select(.id == \"$artifact_id\") | .generates" "$WORKFLOW_YAML")

        if check_exists "$generates" "false"; then
            complete+=("$artifact_id")
        else
            missing+=("$artifact_id")
        fi
    done <<< "$artifacts"

    # 输出结果
    if [[ "$output_format" == "json" ]]; then
        cat <<EOF
{
  "type": "project",
  "complete": [$(printf '"%s",' "${complete[@]}" | sed 's/,$//')]
  "missing": [$(printf '"%s",' "${missing[@]}" | sed 's/,$//')]
}
EOF
    else
        echo ""
        echo -e "${CYAN}=== 项目级工件状态 ===${NC}"
        echo ""

        if [[ ${#complete[@]} -gt 0 ]]; then
            echo -e "${GREEN}已完成 (${#complete[@]}):${NC}"
            for a in "${complete[@]}"; do
                local generates
                generates=$(yq ".artifacts[] | select(.id == \"$a\") | .generates" "$WORKFLOW_YAML")
                echo -e "  ${GREEN}✓${NC} $a → $generates"
            done
            echo ""
        fi

        if [[ ${#missing[@]} -gt 0 ]]; then
            echo -e "${YELLOW}缺失 (${#missing[@]}):${NC}"
            for a in "${missing[@]}"; do
                local skill generates
                skill=$(yq ".artifacts[] | select(.id == \"$a\") | .skill" "$WORKFLOW_YAML")
                generates=$(yq ".artifacts[] | select(.id == \"$a\") | .generates" "$WORKFLOW_YAML")
                echo -e "  ${YELLOW}○${NC} $a → $generates (skill: $skill)"
            done
        fi
    fi
}

# 仅输出下一步可执行的工件
get_next_actions() {
    local req_id="$1"

    local artifacts
    artifacts=$(yq '.artifacts[] | select(.generates | contains("{REQ}")) | .id' "$WORKFLOW_YAML")

    while IFS= read -r artifact_id; do
        [[ -z "$artifact_id" ]] && continue

        local status is_optional
        status=$(get_artifact_status "$artifact_id" "$req_id")
        is_optional=$(yq ".artifacts[] | select(.id == \"$artifact_id\") | .optional // false" "$WORKFLOW_YAML")

        if [[ "$status" == "ready" && "$is_optional" != "true" ]]; then
            local skill
            skill=$(yq ".artifacts[] | select(.id == \"$artifact_id\") | .skill" "$WORKFLOW_YAML")
            echo "$artifact_id:$skill"
        fi
    done <<< "$artifacts"
}

# -----------------------------------------------------------------------------
# 主入口
# -----------------------------------------------------------------------------
main() {
    check_dependencies

    local req_id=""
    local output_format="text"
    local mode="requirement"

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --json)
                output_format="json"
                shift
                ;;
            --next)
                mode="next"
                shift
                ;;
            --project)
                mode="project"
                shift
                ;;
            -h|--help)
                echo "用法: $0 [REQ-ID] [选项]"
                echo ""
                echo "选项:"
                echo "  --json      JSON 格式输出"
                echo "  --next      仅输出下一步可执行的工件"
                echo "  --project   检查项目级工件状态"
                echo "  -h, --help  显示帮助"
                exit 0
                ;;
            REQ-*)
                req_id="$1"
                shift
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done

    # 执行
    case "$mode" in
        project)
            get_project_status "$output_format"
            ;;
        next)
            if [[ -z "$req_id" ]]; then
                log_error "需要指定 REQ-ID"
                exit 1
            fi
            get_next_actions "$req_id"
            ;;
        requirement)
            if [[ -z "$req_id" ]]; then
                log_error "需要指定 REQ-ID 或使用 --project"
                exit 1
            fi
            get_requirement_status "$req_id" "$output_format"
            ;;
    esac
}

main "$@"
